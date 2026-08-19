// Seeds the local TinDog demo with 4 human demo accounts and exactly 50 dog listings.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
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

const DEMO_PASSWORD = "Demo1234!";
const DEMO_DOMAIN = "demo.tindog.app";

// Keep only the original human demo accounts: 3 shelter managers + 1 adopter.
const demoUsers = [
  { email: `maya@${DEMO_DOMAIN}`, name: "Maya Levi", city: "Tel Aviv", role: "shelter_admin", shelter: "Lev Chai Rescue" },
  { email: `daniel@${DEMO_DOMAIN}`, name: "Daniel Cohen", city: "Herzliya", role: "shelter_admin", shelter: "Coastal Paws" },
  { email: `noa@${DEMO_DOMAIN}`, name: "Noa Shapira", city: "Ramat Gan", role: "shelter_admin", shelter: "Second Chance Dogs" },
  { email: `alex@${DEMO_DOMAIN}`, name: "Alex Bar", city: "Tel Aviv", role: "adopter", shelter: null },
];

const baseDogs = [
  { ownerEmail: `maya@${DEMO_DOMAIN}`, name: "Rexi", breed: "Mixed", age_years: 3, size: "medium", energy_level: "high", gender: "male", temperament: "Playful, affectionate, curious and great with people", special_needs: "", description: "Rexi was rescued from the street and is looking for a forever home. He knows basic commands, loves long walks and settles happily next to his people after a busy day.", listing_type: "adoption", city: "Tel Aviv", good_with_kids: true, good_with_dogs: true, good_with_cats: false, house_trained: true, vaccinated: true, neutered: true },
  { ownerEmail: `maya@${DEMO_DOMAIN}`, name: "Luna", breed: "Border Collie", age_years: 2, size: "medium", energy_level: "high", gender: "female", temperament: "Smart, energetic, gentle and a little shy at first", special_needs: "Needs daily exercise and mental stimulation", description: "Luna is looking for a caring foster home. She is house-trained, learns quickly and thrives with patient, active people.", listing_type: "foster", city: "Tel Aviv", good_with_kids: true, good_with_dogs: true, good_with_cats: true, house_trained: true, vaccinated: true, neutered: true },
  { ownerEmail: `daniel@${DEMO_DOMAIN}`, name: "Bamba", breed: "French Bulldog", age_years: 4, size: "small", energy_level: "low", gender: "male", temperament: "Chill, cuddly and happiest close to people", special_needs: "Sensitive to heat - short walks in summer", description: "Bamba is a calm little character who loves naps, slow walks and attention. He would be happiest in a relaxed home.", listing_type: "adoption", city: "Herzliya", good_with_kids: true, good_with_dogs: true, good_with_cats: false, house_trained: true, vaccinated: true, neutered: true },
  { ownerEmail: `noa@${DEMO_DOMAIN}`, name: "Simba", breed: "Golden Retriever", age_years: 1.5, size: "large", energy_level: "high", gender: "male", temperament: "Friendly with everyone, goofy and still a puppy at heart", special_needs: "", description: "Simba is an affectionate young dog looking for an active home that enjoys training, outdoor time and lots of play.", listing_type: "adoption", city: "Ramat Gan", good_with_kids: true, good_with_dogs: true, good_with_cats: true, house_trained: true, vaccinated: true, neutered: true },
  { ownerEmail: `noa@${DEMO_DOMAIN}`, name: "Pitzi", breed: "Chihuahua mix", age_years: 7, size: "small", energy_level: "low", gender: "female", temperament: "Sweet senior who prefers quiet routines and gentle company", special_needs: "Daily thyroid medication", description: "Pitzi is looking for a calm, loving home where she can enjoy her golden years.", listing_type: "adoption", city: "Ramat Gan", good_with_kids: false, good_with_dogs: true, good_with_cats: true, house_trained: true, vaccinated: true, neutered: true },
];

const extraNames = [
  "Milo", "Nala", "Charlie", "Bella", "Leo", "Daisy", "Rocky", "Mika", "Toby", "Ginger",
  "Max", "Kiki", "Oscar", "Lola", "Bruno", "Zoe", "Louie", "Molly", "Archie", "Coco",
  "Buddy", "Maya", "Finn", "Lucy", "Benji", "Toffee", "Jack", "Penny", "Theo", "Rosie",
  "Ollie", "Maple", "Lucky", "Minnie", "Cooper", "Nuni", "Mango", "Sandy", "Kai", "Poppy",
  "Biscuit", "Lily", "Mocha", "Sunny", "Peanut",
];

const breeds = [
  "Mixed", "Labrador mix", "Canaan mix", "Border Collie mix", "Terrier mix", "Shepherd mix",
  "Poodle mix", "Beagle mix", "Husky mix", "Spaniel mix", "Pinscher mix", "Retriever mix",
];
const cities = [
  "Tel Aviv", "Netanya", "Jerusalem", "Haifa", "Ramat Gan", "Herzliya", "Kfar Saba",
  "Rishon LeZion", "Petah Tikva", "Beer Sheva", "Holon", "Bat Yam", "Ashdod", "Rehovot",
  "Raanana", "Hadera", "Modiin", "Givatayim",
];
const temperaments = [
  "Affectionate, social and eager to please",
  "Gentle, calm and happiest near people",
  "Playful, curious and full of personality",
  "Smart, attentive and quick to learn",
  "Sweet, loyal and a little shy at first",
  "Energetic, funny and always ready for an adventure",
  "Easygoing, cuddly and friendly with visitors",
  "Independent but deeply affectionate once comfortable",
];
const descriptions = [
  "A loving rescue looking for a stable forever home and a family to call their own.",
  "Enjoys walks, treats and relaxing beside people after a fun day.",
  "Would thrive with patient adopters who want a loyal companion and enjoy spending time together.",
  "Has lots of love to give and is ready for the next chapter in a safe home.",
  "A charming dog with a big heart, looking for people who will make them part of the family.",
  "Rescued and now ready to meet the person or family who will be their perfect match.",
];

const shelterEmails = [`maya@${DEMO_DOMAIN}`, `daniel@${DEMO_DOMAIN}`, `noa@${DEMO_DOMAIN}`];

const extraDogs = extraNames.map((name, i) => {
  const size = ["small", "medium", "large"][i % 3];
  const energy = ["low", "medium", "high"][(i * 2) % 3];
  const gender = i % 2 === 0 ? "male" : "female";
  const age = Number((0.8 + ((i * 7) % 82) / 10).toFixed(1));
  return {
    ownerEmail: shelterEmails[i % shelterEmails.length],
    name,
    breed: breeds[i % breeds.length],
    age_years: age,
    size,
    energy_level: energy,
    gender,
    temperament: temperaments[i % temperaments.length],
    special_needs: i % 11 === 0 ? "Needs a patient introduction to a new home" : "",
    description: descriptions[i % descriptions.length],
    listing_type: i % 9 === 0 ? "foster" : "adoption",
    city: cities[i % cities.length],
    good_with_kids: i % 5 !== 0,
    good_with_dogs: i % 4 !== 0,
    good_with_cats: i % 3 === 0,
    house_trained: i % 6 !== 0,
    vaccinated: true,
    neutered: i % 7 !== 0,
  };
});

const demoDogs = [...baseDogs, ...extraDogs];
if (demoDogs.length !== 50) throw new Error(`Expected exactly 50 demo dogs, got ${demoDogs.length}`);

async function getOrCreateUser(u, usersByEmail) {
  let user = usersByEmail.get(u.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: u.name, role: u.role, shelter_name: u.shelter },
    });
    if (error) throw error;
    user = data.user;
    usersByEmail.set(u.email, user);
    console.log(`Created user ${u.email}`);
  } else {
    console.log(`User ${u.email} already exists`);
  }

  const { error: profileError } = await admin.from("profiles").update({
    display_name: u.name,
    city: u.city,
    role: u.role,
    account_mode: u.role === "shelter_admin" ? "lister" : "adopter",
    shelter_name: u.shelter,
    shelter_about: u.role === "shelter_admin" ? `A verified rescue helping dogs around ${u.city} find thoughtful forever homes.` : null,
    shelter_verified: u.role === "shelter_admin",
    household_type: u.role === "adopter" ? "apartment" : null,
    has_children: false,
    has_other_pets: false,
    activity_level: u.role === "adopter" ? "medium" : null,
    preferred_size: u.role === "adopter" ? "medium" : null,
    dog_experience: u.role === "adopter" ? "some" : null,
    bio: u.role === "adopter" ? "Demo adopter ready to meet a great dog." : null,
  }).eq("id", user.id);
  if (profileError) throw profileError;
  return user.id;
}

async function main() {
  const { data: existingAuth, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const usersByEmail = new Map(existingAuth.users.map((user) => [user.email, user]));
  const userIdsByEmail = new Map();

  for (const u of demoUsers) {
    userIdsByEmail.set(u.email, await getOrCreateUser(u, usersByEmail));
  }

  let created = 0;
  let existing = 0;
  for (const d of demoDogs) {
    const ownerId = userIdsByEmail.get(d.ownerEmail);
    if (!ownerId) throw new Error(`Missing owner for ${d.name}`);
    const { data: found, error: findError } = await admin
      .from("dogs")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("name", d.name)
      .maybeSingle();
    if (findError) throw findError;
    if (found) {
      existing += 1;
      console.log(`Dog ${d.name} already exists`);
      continue;
    }
    const { ownerEmail, ...dog } = d;
    const { error } = await admin.from("dogs").insert({ ...dog, owner_id: ownerId });
    if (error) throw error;
    created += 1;
    console.log(`Created dog ${dog.name} (${dog.city})`);
  }

  console.log("\nSeed complete.");
  console.log(`Human demo accounts: ${demoUsers.length} total (3 shelter managers + 1 adopter).`);
  console.log(`Dog demo listings: ${demoDogs.length} total (${created} created now, ${existing} already existed).`);
  console.log(`Password for the 4 demo accounts: ${DEMO_PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
