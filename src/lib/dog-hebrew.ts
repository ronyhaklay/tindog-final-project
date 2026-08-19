type DogLike = {
  gender?: string | null;
  energy_level?: string | null;
  good_with_kids?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_cats?: boolean | null;
  house_trained?: boolean | null;
  vaccinated?: boolean | null;
  temperament?: string | null;
  description?: string | null;
  special_needs?: string | null;
};

const CITY_HE: Record<string, string> = {
  "tel aviv": "תל אביב",
  "tel aviv-yafo": "תל אביב-יפו",
  jerusalem: "ירושלים",
  "ramat gan": "רמת גן",
  herzliya: "הרצליה",
  netanya: "נתניה",
  haifa: "חיפה",
  holon: "חולון",
  "bat yam": "בת ים",
  "petah tikva": "פתח תקווה",
  "petach tikva": "פתח תקווה",
  "rishon lezion": "ראשון לציון",
  "rishon le-zion": "ראשון לציון",
  rehovot: "רחובות",
  "kfar saba": "כפר סבא",
  raanana: "רעננה",
  "ra'anana": "רעננה",
  "beer sheva": "באר שבע",
  beersheba: "באר שבע",
  ashdod: "אשדוד",
  ashkelon: "אשקלון",
  eilat: "אילת",
};

const BREED_HE: Array<[RegExp, string]> = [
  [/golden retriever/i, "גולדן רטריבר"],
  [/labrador/i, "לברדור"],
  [/border collie/i, "בורדר קולי"],
  [/collie/i, "קולי"],
  [/siberian husky|husky/i, "האסקי"],
  [/miniature pinscher|pinscher/i, "פינצ׳ר"],
  [/german shepherd/i, "רועה גרמני"],
  [/canaan/i, "כנעני"],
  [/dachshund/i, "תחש"],
  [/samoyed/i, "סמוייד"],
  [/rottweiler/i, "רוטוויילר"],
  [/chihuahua/i, "צ׳יוואווה"],
  [/poodle/i, "פודל"],
  [/beagle/i, "ביגל"],
  [/boxer/i, "בוקסר"],
  [/pug/i, "פאג"],
  [/malamute/i, "מלמוט"],
  [/cocker spaniel/i, "קוקר ספנייל"],
  [/spaniel/i, "ספנייל"],
  [/terrier/i, "טרייר"],
  [/retriever/i, "רטריבר"],
];

const SHELTER_HE: Record<string, string> = {
  "second chance dogs": "כלבים להזדמנות שנייה",
  "coastal paws": "כפות החוף",
  "happy tails": "זנבות שמחים",
  "safe paws": "כפות בטוחות",
  "home for paws": "בית לכפות",
};

function key(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

export function hebrewCity(value?: string | null) {
  const raw = String(value || "").trim();
  return CITY_HE[key(raw)] || raw;
}

export function hebrewBreed(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw || /^mixed(?: breed)?$/i.test(raw)) return "מעורב";

  let translated = raw;
  for (const [pattern, label] of BREED_HE) {
    if (pattern.test(raw)) {
      translated = label;
      break;
    }
  }

  if (/\bmix(?:ed)?\b/i.test(raw)) {
    return `${translated.replace(/\s+(mix|mixed)$/i, "").trim()} מעורב`;
  }

  return translated;
}

export function hebrewShelterName(value?: string | null) {
  const raw = String(value || "").trim();
  return SHELTER_HE[key(raw)] || raw;
}

function female(dog: DogLike) {
  return dog.gender === "female";
}

export function hebrewTemperament(dog: DogLike) {
  const isFemale = female(dog);
  const energy = dog.energy_level;

  if (energy === "high") {
    return isFemale
      ? "חברותית, אנרגטית, סקרנית ואוהבת אנשים."
      : "חברותי, אנרגטי, סקרן ואוהב אנשים.";
  }

  if (energy === "low") {
    return isFemale
      ? "רגועה, מתוקה ונעימה, ואוהבת קרבה ושגרה שקטה."
      : "רגוע, מתוק ונעים, ואוהב קרבה ושגרה שקטה.";
  }

  return isFemale
    ? "חברותית, נעימה ונאמנה, עם שילוב טוב של משחק ורוגע."
    : "חברותי, נעים ונאמן, עם שילוב טוב של משחק ורוגע.";
}

export function hebrewDescription(dog: DogLike) {
  const isFemale = female(dog);
  const parts: string[] = [];

  parts.push(
    isFemale
      ? "מחפשת בית חם, יציב ואוהב שבו תוכל להרגיש בטוחה ולהיות חלק מהמשפחה."
      : "מחפש בית חם, יציב ואוהב שבו יוכל להרגיש בטוח ולהיות חלק מהמשפחה.",
  );

  const compat: string[] = [];
  if (dog.good_with_kids) compat.push("ילדים");
  if (dog.good_with_dogs) compat.push("כלבים");
  if (dog.good_with_cats) compat.push("חתולים");

  if (compat.length) {
    parts.push(`${isFemale ? "מתאימה" : "מתאים"} לבית עם ${compat.join(", ")}.`);
  }

  if (dog.house_trained) {
    parts.push(isFemale ? "מורגלת לחיים בבית." : "מורגל לחיים בבית.");
  }

  return parts.join(" ");
}

export function hebrewSpecialNeeds(dog: DogLike) {
  if (!dog.special_needs) return "";
  return "יש מידע נוסף שחשוב לקבל מהעמותה לפני האימוץ.";
}
