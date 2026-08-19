#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-$HOME/Desktop/tindog}"
cd "$TARGET"

CLOUD_URL="https://vneedjbuaxarlvszvbfp.supabase.co"

echo "☁️ TinDog V17 — sync local media to Supabase Cloud"
echo ""
echo "קוראת אוטומטית את פרטי Supabase המקומי..."

STATUS_ENV="$(npx supabase status -o env)"

LOCAL_URL="$(
  printf '%s\n' "$STATUS_ENV" |
  sed -nE 's/^(API_URL|SUPABASE_URL)="?([^"]+)"?$/\2/p' |
  head -1
)"

LOCAL_KEY="$(
  printf '%s\n' "$STATUS_ENV" |
  sed -nE 's/^(SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)="?([^"]+)"?$/\2/p' |
  head -1
)"

if [ -z "${LOCAL_URL:-}" ] || [ -z "${LOCAL_KEY:-}" ]; then
  echo "❌ Supabase המקומי לא רץ."
  echo "פתחי Docker Desktop והריצי:"
  echo "  cd \"$TARGET\""
  echo "  npx supabase start"
  exit 1
fi

echo "✅ Supabase המקומי נמצא."
echo ""
echo "הדביקי את ה-service_role של פרויקט הענן."
echo "הוא לא יוצג על המסך ולא יישמר בהיסטוריית הפקודות."
printf "Cloud service_role: "
IFS= read -r -s CLOUD_KEY
printf "\n"

if [ -z "${CLOUD_KEY:-}" ]; then
  echo "❌ לא הוזן מפתח."
  exit 1
fi

LOCAL_SUPABASE_URL="$LOCAL_URL" \
LOCAL_SUPABASE_SERVICE_ROLE_KEY="$LOCAL_KEY" \
CLOUD_SUPABASE_URL="$CLOUD_URL" \
CLOUD_SUPABASE_SERVICE_ROLE_KEY="$CLOUD_KEY" \
node scripts/sync-local-media-to-cloud-v17.mjs

unset CLOUD_KEY
