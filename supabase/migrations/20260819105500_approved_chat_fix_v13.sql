-- TinDog V13 — approved request => visible, usable private chat.
-- Uses SECURITY DEFINER RPCs with explicit participant checks so nested RLS
-- queries cannot make an approved match disappear from the Chats screen.

create or replace function public.decide_match_request(
  p_request_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.match_requests;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_decision not in ('approved', 'declined') then
    raise exception 'Invalid decision';
  end if;

  select mr.*
  into v_request
  from public.match_requests mr
  join public.dogs d on d.id = mr.dog_id
  where mr.id = p_request_id
    and d.owner_id = v_uid
  for update;

  if not found then
    raise exception 'Request not found or not owned by current shelter';
  end if;

  -- Idempotent: pressing approve again leaves it approved.
  if v_request.status <> p_decision then
    update public.match_requests
    set
      status = p_decision,
      match_seen_at = case when p_decision = 'approved' then null else match_seen_at end
    where id = p_request_id
    returning * into v_request;
  end if;

  return to_jsonb(v_request);
end;
$$;

create or replace function public.get_my_approved_matches()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(mr)
      || jsonb_build_object(
        'dogs',
        to_jsonb(d)
        || jsonb_build_object(
          'profiles',
          to_jsonb(owner_profile)
        ),
        'requester',
        to_jsonb(requester_profile)
      )
      order by mr.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.match_requests mr
  join public.dogs d on d.id = mr.dog_id
  join public.profiles owner_profile on owner_profile.id = d.owner_id
  join public.profiles requester_profile on requester_profile.id = mr.requester_id
  where mr.status = 'approved'
    and (
      mr.requester_id = auth.uid()
      or d.owner_id = auth.uid()
    );
$$;

create or replace function public.get_approved_match_chat(
  p_request_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    to_jsonb(mr)
    || jsonb_build_object(
      'dogs',
      to_jsonb(d)
      || jsonb_build_object(
        'profiles',
        to_jsonb(owner_profile)
      ),
      'requester',
      to_jsonb(requester_profile)
    )
  from public.match_requests mr
  join public.dogs d on d.id = mr.dog_id
  join public.profiles owner_profile on owner_profile.id = d.owner_id
  join public.profiles requester_profile on requester_profile.id = mr.requester_id
  where mr.id = p_request_id
    and mr.status = 'approved'
    and (
      mr.requester_id = auth.uid()
      or d.owner_id = auth.uid()
    );
$$;

create or replace function public.get_approved_match_messages(
  p_request_id uuid,
  p_limit integer default 50
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(to_jsonb(x) order by x.created_at asc),
    '[]'::jsonb
  )
  from (
    select m.*
    from public.messages m
    join public.match_requests mr on mr.id = m.request_id
    join public.dogs d on d.id = mr.dog_id
    where m.request_id = p_request_id
      and mr.status = 'approved'
      and (
        mr.requester_id = auth.uid()
        or d.owner_id = auth.uid()
      )
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  ) x;
$$;

create or replace function public.send_approved_match_message(
  p_request_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_message public.messages;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  p_content := btrim(coalesce(p_content, ''));

  if char_length(p_content) < 1 or char_length(p_content) > 2000 then
    raise exception 'Message must contain 1 to 2000 characters';
  end if;

  if not exists (
    select 1
    from public.match_requests mr
    join public.dogs d on d.id = mr.dog_id
    where mr.id = p_request_id
      and mr.status = 'approved'
      and (
        mr.requester_id = v_uid
        or d.owner_id = v_uid
      )
  ) then
    raise exception 'Approved match not found';
  end if;

  insert into public.messages(request_id, sender_id, content)
  values (p_request_id, v_uid, p_content)
  returning * into v_message;

  return to_jsonb(v_message);
end;
$$;

revoke all on function public.decide_match_request(uuid, text) from public;
revoke all on function public.get_my_approved_matches() from public;
revoke all on function public.get_approved_match_chat(uuid) from public;
revoke all on function public.get_approved_match_messages(uuid, integer) from public;
revoke all on function public.send_approved_match_message(uuid, text) from public;

grant execute on function public.decide_match_request(uuid, text) to authenticated;
grant execute on function public.get_my_approved_matches() to authenticated;
grant execute on function public.get_approved_match_chat(uuid) to authenticated;
grant execute on function public.get_approved_match_messages(uuid, integer) to authenticated;
grant execute on function public.send_approved_match_message(uuid, text) to authenticated;

grant execute on function public.decide_match_request(uuid, text) to service_role;
grant execute on function public.get_my_approved_matches() to service_role;
grant execute on function public.get_approved_match_chat(uuid) to service_role;
grant execute on function public.get_approved_match_messages(uuid, integer) to service_role;
grant execute on function public.send_approved_match_message(uuid, text) to service_role;
