import "@testing-library/jest-dom/vitest";

// Env vars used by lib/photos.ts when building public photo URLs.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
