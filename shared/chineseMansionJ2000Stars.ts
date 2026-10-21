/**
 * J2000 equatorial RIGHT ASCENSION positions for 28 source HIP stars from
 * Yale Bright Star Catalogue Fifth Revised Edition / isene/starmap.
 *
 * Source file: https://github.com/isene/starmap/blob/master/data/stars.csv
 * J2000 coordinates in decimal DEGREES. Public-domain source star positions;
 * starmap cites Hoffleit & Warren (1991) Yale Bright Star Catalogue v5.
 * HIP identifiers/order: Stellarium Chinese sky-culture lunar_system.
 * This is a deliberately frozen J2000 reference catalog.
 *
 * IMPORTANT: Hipparcos/modern determinative star choice is a documented
 * reference scheme, not an assertion that all Chinese dynasties used this set.
 * Do not recompute RA by dividing 360/28. No fake/missing-star substitutions.
 */
import {CHINESE_MANSION_CATALOG,buildChineseMansionSectors,type ChineseMansionAnchor} from "./chineseMansions";

const J2000_HIP_RA: Readonly<Record<number,number>> = Object.freeze({
  65474: 201.2983, // Spica
  69427: 213.2242, // Kang
  72622: 222.7196, // Zubenelgenubi
  78265: 239.7129, // Fang
  80763: 247.3517, // Antares
  82514: 252.9675, // Xamidimura
  88635: 271.4521, // Alnasl
  92041: 281.4142, // catalog designation only
  100345: 305.2529, // Dabih
  102618: 311.9192, // Albali
  106278: 322.8896, // Sadalsuud
  109074: 331.4458, // Sadalmelik
  113963: 346.1904, // Markab
  1067: 3.3092, // Algenib
  4463: 14.3017, // catalog designation only
  8903: 28.6600, // Sheratan
  12719: 40.8629, // catalog designation only
  17499: 56.2188, // Electra
  20889: 67.1542, // Ain
  26207: 83.7846, // Meissa
  26727: 85.1896, // Alnitak
  30343: 95.7400, // Tejat
  41822: 127.8988, // catalog designation only
  42313: 129.4142, // catalog designation only
  46390: 141.8967, // Alphard
  48356: 147.8696, // Zhang
  53740: 164.9437, // Alkes
  59803: 183.9517, // Gienah
});

export const CHINESE_J2000_ANCHORS:readonly ChineseMansionAnchor[] =
  Object.freeze(CHINESE_MANSION_CATALOG.map(m=>({
    hip:m[3],raDegrees:J2000_HIP_RA[m[3]]!,
    frame:"equatorial" as const,
    epoch:"J2000",
    catalogSource:"Yale Bright Star Catalogue v5 / starmap stars.csv",
  })));

const computed=buildChineseMansionSectors(CHINESE_J2000_ANCHORS);
if(computed.status!=="READY")throw new Error(`Invalid Chinese 28 mansion stellar catalog: ${computed.reason}`);
export const CHINESE_J2000_MANSIONS=computed.sectors;
export const CHINESE_J2000_MANSION_WARNINGS=computed.warnings;
