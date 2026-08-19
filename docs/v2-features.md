# TinDog v2 product notes

## Roles
- **Adopter**: discovers, saves, swipes, receives approved matches and chats.
- **Shelter manager**: manages a shelter profile, publishes dogs, reviews requests and chats with approved adopters.
- Listing write access is enforced in both the UI/server actions and Supabase RLS.

## Rich dog profiles
- Up to 6 photos.
- One short profile video.
- One bark / greeting audio clip, either uploaded or recorded from the browser microphone.
- Compatibility and care facts, story, city, breed, age, size and energy level.
- Shelter identity and optional verified badge.

## Matching
- Adopters see a lightweight lifestyle-fit score based on their profile.
- A right swipe sends interest to the shelter.
- The shelter approves or declines the request.
- The first time an adopter returns after approval, a full-screen match celebration appears and links directly to chat.

## Visual refresh
- Role-specific navigation.
- Shelter dashboard with listing/request/chat stats.
- Subtle dog/paw/bone background motifs.
- Richer landing page and dog cards.
