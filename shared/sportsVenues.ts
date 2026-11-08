export type VenueInfo = {
  name: string;
  city: string;
  sport: string;
  latitude: number;
  longitude: number;
  alias?: string[];
};

export const SPORTS_VENUES: VenueInfo[] = [
  // College Football Stadiums
  { name: "Michigan Stadium (The Big House)", city: "Ann Arbor, MI", sport: "NCAAF", latitude: 42.2658, longitude: -83.7487, alias: ["michigan", "ann arbor", "the big house"] },
  { name: "Ohio Stadium (The Horseshoe)", city: "Columbus, OH", sport: "NCAAF", latitude: 40.0016, longitude: -83.0197, alias: ["ohio stadium", "columbus", "horseshoe", "ohio state"] },
  { name: "Bryant-Denny Stadium", city: "Tuscaloosa, AL", sport: "NCAAF", latitude: 33.2082, longitude: -87.5504, alias: ["bryant-denny", "tuscaloosa", "alabama"] },
  { name: "Sanford Stadium", city: "Athens, GA", sport: "NCAAF", latitude: 33.9498, longitude: -83.3734, alias: ["sanford", "athens", "georgia"] },
  { name: "Tiger Stadium (Death Valley)", city: "Baton Rouge, LA", sport: "NCAAF", latitude: 30.4120, longitude: -91.1838, alias: ["tiger stadium", "lsu", "baton rouge", "death valley lsu"] },
  { name: "Memorial Stadium (Clemson)", city: "Clemson, SC", sport: "NCAAF", latitude: 34.6788, longitude: -82.8432, alias: ["clemson", "death valley clemson"] },
  { name: "Beaver Stadium", city: "State College, PA", sport: "NCAAF", latitude: 40.8122, longitude: -77.8561, alias: ["beaver stadium", "penn state", "state college"] },
  { name: "Neyland Stadium", city: "Knoxville, TN", sport: "NCAAF", latitude: 35.9550, longitude: -83.9250, alias: ["neyland", "knoxville", "tennessee"] },
  { name: "Darrell K Royal Stadium", city: "Austin, TX", sport: "NCAAF", latitude: 30.2836, longitude: -97.7325, alias: ["texas", "austin", "dkr"] },
  { name: "Rose Bowl Stadium", city: "Pasadena, CA", sport: "NCAAF", latitude: 34.1613, longitude: -118.1676, alias: ["rose bowl", "pasadena", "ucla"] },
  { name: "Notre Dame Stadium", city: "South Bend, IN", sport: "NCAAF", latitude: 41.6984, longitude: -86.2339, alias: ["notre dame", "south bend"] },
  { name: "Kyle Field", city: "College Station, TX", sport: "NCAAF", latitude: 30.6102, longitude: -96.3398, alias: ["kyle field", "texas a&m", "college station"] },
  { name: "Ben Hill Griffin Stadium (The Swamp)", city: "Gainesville, FL", sport: "NCAAF", latitude: 29.6499, longitude: -82.3486, alias: ["the swamp", "florida", "gainesville"] },
  { name: "Autzen Stadium", city: "Eugene, OR", sport: "NCAAF", latitude: 44.0583, longitude: -123.0685, alias: ["autzen", "oregon", "eugene"] },
  { name: "Husky Stadium", city: "Seattle, WA", sport: "NCAAF", latitude: 47.6503, longitude: -122.3016, alias: ["husky stadium", "washington", "seattle ncaaf"] },
  { name: "Doak Campbell Stadium", city: "Tallahassee, FL", sport: "NCAAF", latitude: 30.4420, longitude: -84.3044, alias: ["doak campbell", "fsu", "tallahassee"] },
  { name: "Jordan-Hare Stadium", city: "Auburn, AL", sport: "NCAAF", latitude: 32.6022, longitude: -85.4897, alias: ["jordan-hare", "auburn"] },
  { name: "Memorial Stadium (Lincoln)", city: "Lincoln, NE", sport: "NCAAF", latitude: 40.8207, longitude: -96.7056, alias: ["nebraska", "lincoln"] },
  { name: "Camp Randall Stadium", city: "Madison, WI", sport: "NCAAF", latitude: 43.0700, longitude: -89.4127, alias: ["camp randall", "wisconsin", "madison"] },
  { name: "Gaylord Family Oklahoma Memorial", city: "Norman, OK", sport: "NCAAF", latitude: 35.2059, longitude: -97.4426, alias: ["oklahoma", "norman", "sooners"] },

  // NFL Stadiums
  { name: "Arrowhead Stadium (GEHA Field)", city: "Kansas City, MO", sport: "NFL", latitude: 39.0489, longitude: -94.4839, alias: ["arrowhead", "kansas city", "chiefs"] },
  { name: "Lambeau Field", city: "Green Bay, WI", sport: "NFL", latitude: 44.5013, longitude: -88.0622, alias: ["lambeau", "green bay", "packers"] },
  { name: "SoFi Stadium", city: "Inglewood, CA", sport: "NFL", latitude: 33.9535, longitude: -118.3392, alias: ["sofi", "inglewood", "rams", "chargers", "los angeles nfl"] },
  { name: "AT&T Stadium (Jerry World)", city: "Arlington, TX", sport: "NFL", latitude: 32.7473, longitude: -97.0945, alias: ["at&t stadium", "dallas cowboys", "arlington", "jerry world"] },
  { name: "MetLife Stadium", city: "East Rutherford, NJ", sport: "NFL", latitude: 40.8128, longitude: -74.0742, alias: ["metlife", "giants", "jets", "new york nfl"] },
  { name: "Allegiant Stadium", city: "Las Vegas, NV", sport: "NFL", latitude: 36.0908, longitude: -115.1833, alias: ["allegiant", "las vegas", "raiders"] },
  { name: "Hard Rock Stadium", city: "Miami Gardens, FL", sport: "NFL", latitude: 25.9580, longitude: -80.2389, alias: ["hard rock", "miami dolphins", "miami gardens"] },
  { name: "Lincoln Financial Field", city: "Philadelphia, PA", sport: "NFL", latitude: 39.9008, longitude: -75.1675, alias: ["lincoln financial", "eagles", "philadelphia nfl"] },
  { name: "Highmark Stadium", city: "Orchard Park, NY", sport: "NFL", latitude: 42.7738, longitude: -78.7870, alias: ["highmark", "buffalo", "bills", "orchard park"] },
  { name: "Mercedes-Benz Stadium", city: "Atlanta, GA", sport: "NFL", latitude: 33.7554, longitude: -84.4010, alias: ["mercedes-benz stadium", "atlanta", "falcons"] },
  { name: "Caesars Superdome", city: "New Orleans, LA", sport: "NFL", latitude: 29.9511, longitude: -90.0812, alias: ["superdome", "new orleans", "saints"] },
  { name: "Soldier Field", city: "Chicago, IL", sport: "NFL", latitude: 41.8623, longitude: -87.6167, alias: ["soldier field", "chicago", "bears"] },
  { name: "Lumen Field", city: "Seattle, WA", sport: "NFL", latitude: 47.5952, longitude: -122.3316, alias: ["lumen field", "seahawks", "seattle nfl"] },
  { name: "Acrisure Stadium (Heinz Field)", city: "Pittsburgh, PA", sport: "NFL", latitude: 40.4468, longitude: -80.0158, alias: ["heinz field", "acrisure", "steelers", "pittsburgh"] },
  { name: "Gillette Stadium", city: "Foxborough, MA", sport: "NFL", latitude: 42.0909, longitude: -71.2643, alias: ["gillette", "patriots", "foxborough", "boston nfl"] },
  { name: "State Farm Stadium", city: "Glendale, AZ", sport: "NFL", latitude: 33.5276, longitude: -112.2626, alias: ["state farm stadium", "cardinals", "phoenix nfl", "glendale"] },
  { name: "Levi's Stadium", city: "Santa Clara, CA", sport: "NFL", latitude: 37.4033, longitude: -121.9697, alias: ["levi's", "49ers", "santa clara", "san francisco nfl"] },
  { name: "Raymond James Stadium", city: "Tampa, FL", sport: "NFL", latitude: 27.9759, longitude: -82.5033, alias: ["raymond james", "buccaneers", "tampa"] },

  // MLB Ballparks
  { name: "Yankee Stadium", city: "Bronx, NY", sport: "MLB", latitude: 40.8296, longitude: -73.9262, alias: ["yankee stadium", "yankees", "bronx"] },
  { name: "Dodger Stadium", city: "Los Angeles, CA", sport: "MLB", latitude: 34.0739, longitude: -118.2400, alias: ["dodger stadium", "dodgers", "chavez ravine"] },
  { name: "Fenway Park", city: "Boston, MA", sport: "MLB", latitude: 42.3467, longitude: -71.0972, alias: ["fenway", "red sox", "boston mlb"] },
  { name: "Wrigley Field", city: "Chicago, IL", sport: "MLB", latitude: 41.9484, longitude: -87.6553, alias: ["wrigley", "cubs", "chicago mlb"] },
  { name: "Minute Maid Park", city: "Houston, TX", sport: "MLB", latitude: 29.7573, longitude: -95.3555, alias: ["minute maid", "astros", "houston mlb"] },
  { name: "Citi Field", city: "Queens, NY", sport: "MLB", latitude: 40.7571, longitude: -73.8458, alias: ["citi field", "mets", "queens"] },
  { name: "Truist Park", city: "Atlanta, GA", sport: "MLB", latitude: 33.8908, longitude: -84.4678, alias: ["truist", "braves", "cobb county"] },
  { name: "Oracle Park", city: "San Francisco, CA", sport: "MLB", latitude: 37.7786, longitude: -122.3893, alias: ["oracle park", "giants mlb", "san francisco mlb"] },
  { name: "Oriole Park at Camden Yards", city: "Baltimore, MD", sport: "MLB", latitude: 39.2839, longitude: -76.6217, alias: ["camden yards", "orioles", "baltimore"] },
  { name: "Petco Park", city: "San Diego, CA", sport: "MLB", latitude: 32.7076, longitude: -117.1570, alias: ["petco", "padres", "san diego"] },
  { name: "PNC Park", city: "Pittsburgh, PA", sport: "MLB", latitude: 40.4469, longitude: -80.0057, alias: ["pnc park", "pirates"] },
  { name: "Citizens Bank Park", city: "Philadelphia, PA", sport: "MLB", latitude: 39.9061, longitude: -75.1665, alias: ["citizens bank", "phillies"] },
  { name: "Busch Stadium", city: "St. Louis, MO", sport: "MLB", latitude: 38.6226, longitude: -90.1928, alias: ["busch", "cardinals mlb", "st louis"] },
  { name: "American Family Field", city: "Milwaukee, WI", sport: "MLB", latitude: 43.0280, longitude: -87.9712, alias: ["miller park", "american family", "brewers"] },
  { name: "T-Mobile Park", city: "Seattle, WA", sport: "MLB", latitude: 47.5914, longitude: -122.3325, alias: ["t-mobile park", "safeco", "mariners"] },
  { name: "Chase Field", city: "Phoenix, AZ", sport: "MLB", latitude: 33.4453, longitude: -112.0667, alias: ["chase field", "diamondbacks", "phoenix mlb"] },
  { name: "Coors Field", city: "Denver, CO", sport: "MLB", latitude: 39.7559, longitude: -104.9942, alias: ["coors field", "rockies", "denver"] },
  { name: "Tokyo Dome", city: "Tokyo, Japan", sport: "MLB", latitude: 35.7056, longitude: 139.7519, alias: ["tokyo dome", "tokyo"] },

  // NBA & NHL Arenas
  { name: "Madison Square Garden", city: "New York, NY", sport: "NBA", latitude: 40.7505, longitude: -73.9934, alias: ["madison square garden", "msg", "knicks", "rangers"] },
  { name: "Crypto.com Arena (Staples Center)", city: "Los Angeles, CA", sport: "NBA", latitude: 34.0430, longitude: -118.2673, alias: ["crypto.com", "staples center", "lakers", "clippers", "kings nhl"] },
  { name: "TD Garden", city: "Boston, MA", sport: "NBA", latitude: 42.3662, longitude: -71.0621, alias: ["td garden", "celtics", "bruins"] },
  { name: "United Center", city: "Chicago, IL", sport: "NBA", latitude: 41.8807, longitude: -87.6742, alias: ["united center", "bulls", "blackhawks"] },
  { name: "Chase Center", city: "San Francisco, CA", sport: "NBA", latitude: 37.7680, longitude: -122.3877, alias: ["chase center", "warriors", "golden state"] },
  { name: "Ball Arena", city: "Denver, CO", sport: "NBA", latitude: 39.7487, longitude: -105.0077, alias: ["ball arena", "pepsi center", "nuggets", "avalanche"] },
  { name: "American Airlines Center", city: "Dallas, TX", sport: "NBA", latitude: 32.7905, longitude: -96.8103, alias: ["american airlines center", "mavericks", "stars nhl"] },
  { name: "Kaseya Center", city: "Miami, FL", sport: "NBA", latitude: 25.7814, longitude: -80.1870, alias: ["kaseya", "ftx arena", "heat", "miami nba"] },
  { name: "Barclays Center", city: "Brooklyn, NY", sport: "NBA", latitude: 40.6826, longitude: -73.9754, alias: ["barclays", "nets", "brooklyn"] },
  { name: "Wells Fargo Center", city: "Philadelphia, PA", sport: "NBA", latitude: 39.9012, longitude: -75.1720, alias: ["wells fargo", "76ers", "sixers", "flyers"] },
  { name: "Scotiabank Arena", city: "Toronto, Canada", sport: "NBA", latitude: 43.6435, longitude: -79.3791, alias: ["scotiabank", "air canada", "raptors", "maple leafs"] },

  // Major Combat / Boxing Venues
  { name: "T-Mobile Arena", city: "Las Vegas, NV", sport: "boxing", latitude: 36.1029, longitude: -115.1783, alias: ["t-mobile arena", "vegas boxing", "ufc vegas"] },
  { name: "MGM Grand Garden Arena", city: "Las Vegas, NV", sport: "boxing", latitude: 36.1024, longitude: -115.1702, alias: ["mgm grand", "mgm boxing"] },
  { name: "Kingdom Arena", city: "Riyadh, Saudi Arabia", sport: "boxing", latitude: 24.7136, longitude: 46.6753, alias: ["kingdom arena", "riyadh boxing", "saudi boxing"] },
];

export function findMatchingVenue(query: string): VenueInfo | undefined {
  if (!query || query.trim().length < 2) return undefined;
  const q = query.trim().toLowerCase();

  // 1. Exact or starts-with match on name
  const exact = SPORTS_VENUES.find((v) => v.name.toLowerCase() === q);
  if (exact) return exact;

  // 2. Alias match
  const aliasMatch = SPORTS_VENUES.find((v) =>
    v.alias?.some((a) => q.includes(a) || a.includes(q))
  );
  if (aliasMatch) return aliasMatch;

  // 3. Name or city includes
  return SPORTS_VENUES.find(
    (v) => v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
  );
}

export type QuickGamePreset = {
  label: string;
  sport: "NCAAF" | "NFL" | "NBA" | "MLB" | "boxing";
  favoredTeam: string;
  underdogTeam: string;
  venueName: string;
  city: string;
  latitude: number;
  longitude: number;
  defaultTimeOffsetHours: number; // e.g. 2 hours from now, or typical kickoff
};

export const QUICK_GAME_PRESETS: QuickGamePreset[] = [
  {
    label: "🏈 Ohio State vs Michigan",
    sport: "NCAAF",
    favoredTeam: "Ohio State Buckeyes",
    underdogTeam: "Michigan Wolverines",
    venueName: "Ohio Stadium (The Horseshoe)",
    city: "Columbus, OH",
    latitude: 40.0016,
    longitude: -83.0197,
    defaultTimeOffsetHours: 4,
  },
  {
    label: "🏈 Alabama vs Georgia",
    sport: "NCAAF",
    favoredTeam: "Georgia Bulldogs",
    underdogTeam: "Alabama Crimson Tide",
    venueName: "Sanford Stadium",
    city: "Athens, GA",
    latitude: 33.9498,
    longitude: -83.3734,
    defaultTimeOffsetHours: 4,
  },
  {
    label: "🏈 Chiefs vs 49ers",
    sport: "NFL",
    favoredTeam: "Kansas City Chiefs",
    underdogTeam: "San Francisco 49ers",
    venueName: "Arrowhead Stadium (GEHA Field)",
    city: "Kansas City, MO",
    latitude: 39.0489,
    longitude: -94.4839,
    defaultTimeOffsetHours: 3,
  },
  {
    label: "⚾ Dodgers vs Yankees",
    sport: "MLB",
    favoredTeam: "Los Angeles Dodgers",
    underdogTeam: "New York Yankees",
    venueName: "Dodger Stadium",
    city: "Los Angeles, CA",
    latitude: 34.0739,
    longitude: -118.2400,
    defaultTimeOffsetHours: 2,
  },
  {
    label: "🏀 Celtics vs Lakers",
    sport: "NBA",
    favoredTeam: "Boston Celtics",
    underdogTeam: "Los Angeles Lakers",
    venueName: "TD Garden",
    city: "Boston, MA",
    latitude: 42.3662,
    longitude: -71.0621,
    defaultTimeOffsetHours: 2,
  },
  {
    label: "🥊 Heavyweight Championship",
    sport: "boxing",
    favoredTeam: "Usyk",
    underdogTeam: "Fury",
    venueName: "Kingdom Arena",
    city: "Riyadh, Saudi Arabia",
    latitude: 24.7136,
    longitude: 46.6753,
    defaultTimeOffsetHours: 6,
  },
];
