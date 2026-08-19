type Coordinates = { lat: number; lng: number };

const CITY_COORDINATES: Record<string, Coordinates> = {
  "tel aviv": { lat: 32.0853, lng: 34.7818 },
  "tel aviv yafo": { lat: 32.0853, lng: 34.7818 },
  "תל אביב": { lat: 32.0853, lng: 34.7818 },
  "תל אביב יפו": { lat: 32.0853, lng: 34.7818 },
  "netanya": { lat: 32.3215, lng: 34.8532 },
  "נתניה": { lat: 32.3215, lng: 34.8532 },
  "jerusalem": { lat: 31.7683, lng: 35.2137 },
  "ירושלים": { lat: 31.7683, lng: 35.2137 },
  "haifa": { lat: 32.7940, lng: 34.9896 },
  "חיפה": { lat: 32.7940, lng: 34.9896 },
  "ramat gan": { lat: 32.0684, lng: 34.8248 },
  "רמת גן": { lat: 32.0684, lng: 34.8248 },
  "herzliya": { lat: 32.1663, lng: 34.8433 },
  "הרצליה": { lat: 32.1663, lng: 34.8433 },
  "kfar saba": { lat: 32.1782, lng: 34.9076 },
  "כפר סבא": { lat: 32.1782, lng: 34.9076 },
  "rishon lezion": { lat: 31.9730, lng: 34.7925 },
  "rishon le zion": { lat: 31.9730, lng: 34.7925 },
  "ראשון לציון": { lat: 31.9730, lng: 34.7925 },
  "petah tikva": { lat: 32.0840, lng: 34.8878 },
  "פתח תקווה": { lat: 32.0840, lng: 34.8878 },
  "holon": { lat: 32.0158, lng: 34.7874 },
  "חולון": { lat: 32.0158, lng: 34.7874 },
  "bat yam": { lat: 32.0167, lng: 34.7500 },
  "בת ים": { lat: 32.0167, lng: 34.7500 },
  "ashdod": { lat: 31.8044, lng: 34.6553 },
  "אשדוד": { lat: 31.8044, lng: 34.6553 },
  "ashkelon": { lat: 31.6688, lng: 34.5743 },
  "אשקלון": { lat: 31.6688, lng: 34.5743 },
  "beer sheva": { lat: 31.2530, lng: 34.7915 },
  "beersheba": { lat: 31.2530, lng: 34.7915 },
  "באר שבע": { lat: 31.2530, lng: 34.7915 },
  "rehovot": { lat: 31.8948, lng: 34.8113 },
  "רחובות": { lat: 31.8948, lng: 34.8113 },
  "raanana": { lat: 32.1848, lng: 34.8713 },
  "ra'anana": { lat: 32.1848, lng: 34.8713 },
  "רעננה": { lat: 32.1848, lng: 34.8713 },
  "hadera": { lat: 32.4340, lng: 34.9196 },
  "חדרה": { lat: 32.4340, lng: 34.9196 },
  "modiin": { lat: 31.8969, lng: 35.0096 },
  "modi'in": { lat: 31.8969, lng: 35.0096 },
  "מודיעין": { lat: 31.8969, lng: 35.0096 },
  "eilat": { lat: 29.5577, lng: 34.9519 },
  "אילת": { lat: 29.5577, lng: 34.9519 },
  "nahariya": { lat: 33.0059, lng: 35.0941 },
  "נהריה": { lat: 33.0059, lng: 35.0941 },
  "acre": { lat: 32.9281, lng: 35.0765 },
  "akko": { lat: 32.9281, lng: 35.0765 },
  "עכו": { lat: 32.9281, lng: 35.0765 },
  "kiryat ono": { lat: 32.0564, lng: 34.8587 },
  "קריית אונו": { lat: 32.0564, lng: 34.8587 },
  "givatayim": { lat: 32.0719, lng: 34.8115 },
  "גבעתיים": { lat: 32.0719, lng: 34.8115 },
  "rosh haayin": { lat: 32.0953, lng: 34.9566 },
  "rosh ha'ayin": { lat: 32.0953, lng: 34.9566 },
  "ראש העין": { lat: 32.0953, lng: 34.9566 },
  "yavne": { lat: 31.8779, lng: 34.7394 },
  "יבנה": { lat: 31.8779, lng: 34.7394 },
  "ramla": { lat: 31.9292, lng: 34.8656 },
  "רמלה": { lat: 31.9292, lng: 34.8656 },
  "lod": { lat: 31.9510, lng: 34.8881 },
  "לוד": { lat: 31.9510, lng: 34.8881 },
  "karmiel": { lat: 32.9182, lng: 35.2973 },
  "כרמיאל": { lat: 32.9182, lng: 35.2973 },
  "tiberias": { lat: 32.7940, lng: 35.5312 },
  "טבריה": { lat: 32.7940, lng: 35.5312 },
  "nazareth": { lat: 32.6996, lng: 35.3035 },
  "נצרת": { lat: 32.6996, lng: 35.3035 },
};

function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[־–—-]/g, " ")
    .replace(/[׳']/g, "'")
    .replace(/\s+/g, " ");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function distanceBetweenCities(userCity: string | null | undefined, dogCity: string | null | undefined): number | null {
  if (!userCity || !dogCity) return null;
  const user = CITY_COORDINATES[normalizeCity(userCity)];
  const dog = CITY_COORDINATES[normalizeCity(dogCity)];
  if (!user || !dog) return null;
  return Math.round(haversineKm(user, dog));
}
