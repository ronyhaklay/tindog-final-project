# TinDog product refresh

This branch/package adds an adoption-first product refresh without removing the existing foster/playdate capability.

## Added

- Richer adopter profile: household, children, pets, activity, preferred dog size, dog experience, account intent.
- Richer dog profile: gender, compatibility, house training, vaccination and spay/neuter status.
- Saved dogs / favorites with a dedicated Saved page.
- Advanced discovery filters for size, energy and kid compatibility.
- Full public dog profile pages with photo gallery and compatibility details.
- Redesigned Discover, My listings, Requests, Chats, Profile, signup and landing experiences.
- Wider, warmer visual system and more useful empty states.

## Database migration

After pulling these changes while local Supabase is running:

```bash
npx supabase migration up
```

If this is a throwaway local database and you prefer a clean rebuild:

```bash
npx supabase db reset
```

The second command deletes local data and reapplies all migrations.
