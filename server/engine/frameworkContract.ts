/** Authoritative user-defined architecture contract. No prediction weights change here.
 * This module exists to prevent accidental method drift and to make gaps explicit.
 */
export const FIRMAMENT_FRAMEWORK_VERSION="ASC_DSC_ALL_HOUSES_V1" as const;
export const ASCENDANT_HOUSES=[1,2,3,6,10,11] as const;
export const DESCENDANT_HOUSES=[4,5,7,8,9,12] as const;
export const UNIVERSAL_ASPECT_ORB_DEGREES=5 as const;
export const USER_ORB_WEIGHT_TIERS=[100,80,60,40] as const;
export const EXPECTED_METHOD_COUNT=21 as const;
export const METHOD_NAMES=[
"Cluster territory & house-lord placement",
"Nakshatra influence",
"Essential dignity",
"Chaldean Decans",
"Planetary war",
"Arabic Lots",
"Arabic mansion context",
"Nine-planet influence",
"Fixed-star amplifications",
"Retrograde condition",
"Lunar flow",
"Chart-wide aspects",
"Moon phase / VOC",
"Nodes (Rahu/Ketu)",
"Upachaya growth",
"Via Combusta",
"Besiegement",
"Mutual reception",
"Translation of light",
"Harmonious vs friction aspects",
"KP Star → Sub → Sub–Sub chain"
] as const;
export function frameworkSide(house:number):"A"|"B" {
 if((ASCENDANT_HOUSES as readonly number[]).includes(house))return "A";
 if((DESCENDANT_HOUSES as readonly number[]).includes(house))return "B";
 throw new Error("Invalid house "+house+"; all 12 houses must be assigned.");
}
export function assertFrameworkMethodRoster(names:readonly string[]) {
 if(names.length!==EXPECTED_METHOD_COUNT || new Set(names).size!==EXPECTED_METHOD_COUNT || METHOD_NAMES.some(name=>!names.includes(name)))throw new Error("Framework method roster drift: expected all 21 exact method names.");
}
