// Seeds demo users and dogs for local development / presentation.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
// The service role key bypasses RLS - NEVER ship it to the client.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  { email: "maya@demo.tindog.app", name: "Maya Levi", city: "Tel Aviv" },
  { email: "daniel@demo.tindog.app", name: "Daniel Cohen", city: "Herzliya" },
  { email: "noa@demo.tindog.app", name: "Noa Shapira", city: "Ramat Gan" },
];

const demoDogs = [
  {
    owner: 0,
    name: "Rexi",
    breed: "Mixed",
    age_years: 3,
    size: "medium",
    energy_level: "high",
    temperament: "Playful, loves people, great with kids",
    special_needs: "",
    description:
      "Rexi was rescued from the street and is looking for a forever home. He knows basic commands and loves long walks on the beach.",
    listing_type: "adoption",
    city: "Tel Aviv",
  },
  {
    owner: 0,
    name: "Luna",
    breed: "Border Collie",
    age_years: 2,
    size: "medium",
    energy_level: "high",
    temperament: "Smart, energetic, a bit shy at first",
    special_needs: "",
    description:
      "Luna needs a foster home for 2 months while her family relocates. She is house-trained and friendly with other dogs.",
    listing_type: "foster",
    city: "Tel Aviv",
  },
  {
    owner: 1,
    name: "Bamba",
    breed: "French Bulldog",
    age_years: 4,
    size: "small",
    energy_level: "low",
    temperament: "Chill, cuddly, snores loudly",
    special_needs: "Sensitive to heat - short walks in summer",
    description:
      "Bamba is looking for calm dog friends for short park meetups in the Herzliya area.",
    listing_type: "playdate",
    city: "Herzliya",
  },
  {
    owner: 2,
    name: "Simba",
    breed: "Golden Retriever",
    age_years: 1.5,
    size: "large",
    energy_level: "high",
    temperament: "Friendly with everyone, still a puppy at heart",
    special_needs: "",
    description:
      "Simba wants energetic friends to run with at the dog park. Fully vaccinated and neutered.",
    listing_type: "playdate",
    city: "Ramat Gan",
  },
  {
    owner: 2,
    name: "Pitzi",
    breed: "Chihuahua mix",
    age_years: 7,
    size: "small",
    energy_level: "low",
    temperament: "Sweet senior, prefers quiet homes",
    special_needs: "Daily thyroid medication (cheap and easy)",
    description:
      "Pitzi's elderly owner can no longer care for her. She is looking for a quiet loving home for her golden years.",
    listing_type: "adoption",
    city: "Ramat Gan",
  },
];

async function main() {
  const userIds = [];

  for (const u of demoUsers) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: "Demo1234!",
      email_confirm: true,
      user_metadata: { display_name: u.name },
    });
    if (error) {
      if (error.message.includes("already been registered")) {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list.users.find((x) => x.email === u.email);
        userIds.push(existing.id);
        console.log(`User ${u.email} already exists`);
        continue;
      }
      throw error;
    }
    userIds.push(data.user.id);
    await admin.from("profiles").update({ city: u.city }).eq("id", data.user.id);
    console.log(`Created user ${u.email} (password: Demo1234!)`);
  }

  for (const d of demoDogs) {
    const { owner, ...dog } = d;
    const { error } = await admin
      .from("dogs")
      .insert({ ...dog, owner_id: userIds[owner] });
    if (error) throw error;
    console.log(`Created dog ${dog.name} (${dog.listing_type})`);
  }

  console.log("\nSeed complete. Log in with any demo user / Demo1234!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
