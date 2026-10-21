/**
 * Traditional Chinese Twenty-Eight Mansions (二十八宿), star-anchored overlay.
 *
 * IMPORTANT:
 *  - Chinese Xiù are NOT 28 equal 360/28 sectors.
 *  - Determinative stars delimit unequal right-ascension arcs.
 *  - The input 28 longitudes must already be independently calibrated to
 *    ONE documented epoch and common reference frame of the main wheel.
 *  - Never fill absent coordinates with guesses or evenly spaced sectors.
 *  - Historical and Qing determinative stars occasionally differ. This
 *    catalog explicitly selects the traditional column of the stated source.
 *
 * Sources:
 * https://en.wikipedia.org/wiki/Chinese_constellations#The_Twenty-Eight_Mansions
 * https://hama-med.repo.nii.ac.jp/record/187/files/kiyo09_02.pdf
 */
import { normalizeLongitude } from "./firmamentWheel";

export const CHINESE_XIU_SOURCE = "Chinese constellations: traditional determinative stars (not Qing substitutions)" as const;
export const CHINESE_XIU_FRAME = "EQUATORIAL_RIGHT_ASCENSION_REQUIRES_EPOCH_CALIBRATION" as const;
export const CHINESE_XIU_QUADRANTS = [
  "Azure Dragon", "Black Tortoise", "White Tiger", "Vermilion Bird",
] as const;

const items = [
  ["Jiao","角","Horn","α Vir","Spica"],
  ["Kang","亢","Neck","κ Vir","Kang"],
  ["Di","氐","Root","α² Lib","Zubenelgenubi"],
  ["Fang","房","Room","π Sco","Fang"],
  ["Xin","心","Heart","σ Sco","Alniyat"],
  ["Wei","尾","Tail","μ¹ Sco","Xamidimura"],
  ["Ji","箕","Winnowing Basket","γ Sgr","Alnasl"],
  ["Dou","斗","Southern Dipper","φ Sgr","Nandou"],
  ["Niu","牛","Ox","β Cap","Dabih"],
  ["Nu","女","Girl","ε Aqr","Albali"],
  ["Xu","虛","Emptiness","β Aqr","Sadalsuud"],
  ["Wei2","危","Roof","α Aqr","Sadalmelik"],
  ["Shi","室","Encampment","α Peg","Markab"],
  ["Bi","壁","Wall","γ Peg","Algenib"],
  ["Kui","奎","Legs","ζ And","Shimu"],
  ["Lou","婁","Bond","β Ari","Sheratan"],
  ["Wei3","胃","Stomach","35 Ari","Weixiu"],
  ["Mao","昴","Hairy Head","17 Tau","Electra"],
  ["Bi2","畢","Net","ε Tau","Ain"],
  ["Zi","觜","Turtle Beak","φ¹ Ori","Phi1 Orionis"],
  ["Shen","參","Three Stars","δ Ori","Mintaka"],
  ["Jing","井","Well","μ Gem","Tejat"],
  ["Gui","鬼","Ghost","θ Cnc","Theta Cancri"],
  ["Liu","柳","Willow","δ Hya","Delta Hydrae"],
  ["Xing","星","Star","α Hya","Alphard"],
  ["Zhang","張","Extended Net","υ¹ Hya","Upsilon1 Hydrae"],
  ["Yi","翼","Wings","α Crt","Alkes"],
  ["Zhen","軫","Chariot","γ Crv","Gienah"],
] as const;

export const CHINESE_28_MANSIONS = Object.freeze(items.map(([id,hanzi,english,starId,starName],index)=>Object.freeze({
  index:index+1,id,hanzi,english,starId,starName,
  quadrant:CHINESE_XIU_QUADRANTS[Math.floor(index/7)]!,
  source:CHINESE_XIU_SOURCE,
})));

export type ChineseMansionCalibration = {
  /** Must name common coordinate frame/epoch, e.g. J2000 EQJ RA. */
  frame: "J2000_EQJ_RA";
  epoch: "J2000.0";
  /** Coordinates sourced from a verified star catalogue; same order as list. */
  starts: readonly number[];
  provenance: string;
};

export type ChineseMansionArc = typeof CHINESE_28_MANSIONS[number] & {
  startLongitude:number;
  endLongitude:number;
  angularWidth:number;
};

/** Returns null until every determinative-star coordinate is verified. */
export function resolveChineseMansionArcs(calibration?:ChineseMansionCalibration|null): ChineseMansionArc[] | null {
  if (!calibration) return null;
  if (calibration.frame!=="J2000_EQJ_RA"||calibration.epoch!=="J2000.0"||!calibration.provenance.trim())
    throw new RangeError("Chinese mansion boundaries require a verified J2000 EQJ RA catalogue and source");
  if (calibration.starts.length!==28||!calibration.starts.every(Number.isFinite))
    throw new RangeError("Provide 28 verified determinative-star longitudes; no evenly divided fallback");
  const starts=calibration.starts.map(normalizeLongitude);
  const arcs=CHINESE_28_MANSIONS.map((item,i)=>{
    const startLongitude=starts[i]!;
    const endLongitude=starts[(i+1)%28]!;
    const angularWidth=normalizeLongitude(endLongitude-startLongitude);
    if(angularWidth <= 0) throw new RangeError("Chinese mansion boundary width must be positive");
    return {...item,startLongitude,endLongitude,angularWidth};
  });
  const total=arcs.reduce((sum,x)=>sum+x.angularWidth,0);
  // Determinative-star right ascensions can change order across epochs
  // (especially Zi / Shen). Do not silently sort/mislabel them.
  if(Math.abs(total-360)>1e-6)
    throw new RangeError("Traditional mansion order disagrees with the supplied epoch: resolve determinative-star ordering explicitly; do not fabricate widths");
  return arcs;
}

export function chineseMansionAt(longitude:number,arcs:readonly ChineseMansionArc[]): ChineseMansionArc | null {
  const l=normalizeLongitude(longitude);
  for(const arc of arcs){
    if(normalizeLongitude(l-arc.startLongitude)<arc.angularWidth)return arc;
  }
  return null;
}
