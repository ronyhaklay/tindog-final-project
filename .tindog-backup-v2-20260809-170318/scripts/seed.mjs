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
    gender: "male",
    temperament: "Playful, affectionate, curious and great with people",
    special_needs: "",
    description:
      "Rexi was rescued from the street and is looking for a forever home. He knows basic commands, loves long walks and settles happily next to his people after a busy day.",
    listing_type: "adoption",
    city: "Tel Aviv",
    good_with_kids: true,
    good_with_dogs: true,
    good_with_cats: false,
    house_trained: true,
    vaccinated: true,
    neutered: true,
  },
  {
    owner: 0,
    name: "Luna",
    breed: "Border Collie",
    age_years: 2,
    size: "medium",
    energy_level: "high",
    gender: "female",
    temperament: "Smart, energetic, gentle and a little shy at first",
    special_needs: "Needs daily exercise and mental stimulation",
    description:
      "Luna is looking for a caring foster home while her family relocates. She is house-trained, learns quickly and thrives with patient, active people.",
    listing_type: "foster",
    city: "Tel Aviv",
    good_with_kids: true,
    good_with_dogs: true,
    good_with_cats: true,
    house_trained: true,
    vaccinated: true,
    neutered: true,
  },
  {
    owner: 1,
    name: "Bamba",
    breed: "French Bulldog",
    age_years: 4,
    size: "small",
    energy_level: "low",
    gender: "male",
    temperament: "Chill, cuddly and happiest close to people",
    special_needs: "Sensitive to heat - short walks in summer",
    description:
      "Bamba is a calm little character who loves naps, slow walks and attention. He would be happiest in a relaxed home.",
    listing_type: "adoption",
    city: "Herzliya",
    good_with_kids: true,
    good_with_dogs: true,
    good_with_cats: false,
    house_trained: true,
    vaccinated: true,
    neutered: true,
  },
  {
    owner: 2,
    name: "Simba",
    breed: "Golden Retriever",
    age_years: 1.5,
    size: "large",
    energy_level: "high",
    gender: "male",
    temperament: "Friendly with everyone, goofy and still a puppy at heart",
    special_needs: "",
    description:
      "Simba is an affectionate young dog looking for an active home that enjoys training, outdoor time and lots of play.",
    listing_type: "adoption",
    city: "Ramat Gan",
    good_with_kids: true,
    good_with_dogs: true,
    good_with_cats: true,
    house_trained: true,
    vaccinated: true,
    neutered: true,
  },
  {
    owner: 2,
    name: "Pitzi",
    breed: "Chihuahua mix",
    age_years: 7,
    size: "small",
    energy_level: "low",
    gender: "female",
    temperament: "Sweet senior who prefers quiet routines and gentle company",
    special_needs: "Daily thyroid medication (cheap and easy)",
    description:
      "Pitzi's elderly owner can no longer care for her. She is looking for a calm, loving home where she can enjoy her golden years.",
    listing_type: "adoption",
    city: "Ramat Gan",
    good_with_kids: false,
    good_with_dogs: true,
    good_with_cats: true,
    house_trained: true,
    vaccinated: true,
    neutered: true,
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
    await admin.from("profiles").update({ city: u.city, account_mode: "both", household_type: "apartment", activity_level: "medium", dog_experience: "some" }).eq("id", data.user.id);
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
