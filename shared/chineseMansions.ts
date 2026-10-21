/**
 * Chinese 28 Lunar Mansions (二十八宿) — determinative-star equatorial overlay.
 *
 * Primary source: Stellarium Chinese sky culture's 28 HIP determinative stars.
 * https://stellarium.org/doc/25.0/classStelSkyCultureSkyPartition.html
 *
 * No fabricated 360/28° segments. Source stars must supply VERIFIED RA in
 * DEGREES and the SAME declared equatorial epoch as input moving bodies.
 * RA values are never inferred from zodiac signs or made-up fixed-star offsets.
 * Historically determinative-star choices change; this is one documented
 * Stellarium contemporary catalog, NOT a universal antiquity assertion.
 */
import { normalizeLongitude, type FirmamentFrame, arcHouseOverlaps } from "./firmamentWheel";

export const CHINESE_MANSION_CATALOG = [
  ["Jiao","角","Horn",65474],["Kang","亢","Neck",69427],["Di","氐","Root",72622],
  ["Fang","房","Room",78265],["Xin","心","Heart",80763],["Wei","尾","Tail",82514],
  ["Ji","箕","Winnowing Basket",88635],["Dou","斗","Dipper",92041],
  ["Niu","牛","Ox",100345],["Nu","女","Girl",102618],["Xu","虛","Emptiness",106278],
  ["WeiNorth","危","Rooftop",109074],["Shi","室","Encampment",113963],["BiNorth","壁","Wall",1067],
  ["Kui","奎","Legs",4463],["Lou","婁","Bond",8903],["WeiWest","胃","Stomach",12719],
  ["Mao","昴","Hairy Head",17499],["BiWest","畢","Net",20889],["Zi","觜","Turtle Beak",26207],
  ["Shen","參","Three Stars",26727],["Jing","井","Well",30343],["Gui","鬼","Ghost",41822],
  ["Liu","柳","Willow",42313],["Xing","星","Star",46390],["Zhang","張","Extended Net",48356],
  ["Yi","翼","Wings",53740],["Zhen","軫","Chariot",59803],
] as const;
export const CHINESE_MANSION_VERSION = "CHINESE_XIU_STELLARIUM_HIP_EQUATORIAL_V1" as const;
export const CHINESE_MANSION_QUADRANTS = [
  {name:"Azure Dragon",direction:"East",chinese:"青龍",phase:"Wood"},
  {name:"Black Tortoise",direction:"North",chinese:"玄武",phase:"Water"},
  {name:"White Tiger",direction:"West",chinese:"白虎",phase:"Metal"},
  {name:"Vermilion Bird",direction:"South",chinese:"朱雀",phase:"Fire"},
] as const;
export type ChineseMansionAnchor = {
  hip:number;
  raDegrees:number;
  frame:"equatorial";
  epoch:string;
  catalogSource:string;
};
export type ChineseMansionSector = {
  ordinal:number;
  name:string;
  chinese:string;
  english:string;
  hip:number;
  quadrant:string;
  startRa:number;
  endRa:number;
  widthDegrees:number;
  epoch:string;
  catalogSource:string;
};

/**
 * Returns an explicit NOT_EVALUABLE result rather than inventing an equal
 * division if some determinative stars have not been calibrated.
 * The 28 sectors are sorted by measured RA so the historical Zi/Shen crossing
 * can be detected, not silently concealed.
 */
export function buildChineseMansionSectors(
  anchors:readonly ChineseMansionAnchor[],
): {status:"READY";sectors:ChineseMansionSector[];warnings:string[]} |
   {status:"NOT_EVALUABLE";sectors:[];reason:string} {
  if (anchors.length!==28) return {status:"NOT_EVALUABLE",sectors:[],reason:"Requires all 28 verified determinative-star coordinates."};
  const lookup=new Map<number,ChineseMansionAnchor>();
  for(const a of anchors) {
    if(!Number.isFinite(a.raDegrees)||a.raDegrees<0||a.raDegrees>=360||
      a.frame!=="equatorial"||!a.epoch.trim()||!a.catalogSource.trim()||lookup.has(a.hip)) {
      return {status:"NOT_EVALUABLE",sectors:[],reason:"Invalid, duplicate or unproven determinative-star RA."};
    }
    lookup.set(a.hip,a);
  }
  const missing=CHINESE_MANSION_CATALOG.find(c=>!lookup.has(c[3]));
  if(missing) return {status:"NOT_EVALUABLE",sectors:[],reason:`Missing verified HIP ${missing[3]} (${missing[0]}).`};
  const epochs=new Set(anchors.map(a=>a.epoch));
  const sources=new Set(anchors.map(a=>a.catalogSource));
  if(epochs.size!==1||sources.size!==1)return {status:"NOT_EVALUABLE",sectors:[],reason:"Mismatched epochs or catalogs."};
  const sorted=CHINESE_MANSION_CATALOG.map((c,i)=>({c,i,ra:lookup.get(c[3])!.raDegrees}))
    .sort((a,b)=>a.ra-b.ra);
  const sectors=sorted.map((s,i)=>{
    const next=sorted[(i+1)%28]!;
    const width=normalizeLongitude(next.ra-s.ra);
    return {
      ordinal:s.i+1,name:s.c[0],chinese:s.c[1],english:s.c[2],
      hip:s.c[3],quadrant:CHINESE_MANSION_QUADRANTS[Math.floor(s.i/7)]!.name,
      startRa:s.ra,endRa:next.ra,widthDegrees:width,
      epoch:anchors[0]!.epoch,catalogSource:anchors[0]!.catalogSource,
    };
  });
  if(sectors.some(s=>s.widthDegrees<1e-8))return {status:"NOT_EVALUABLE",sectors:[],reason:"Coincident reference stars cannot define unique mansion sectors."};
  const swapped=sorted.some((s,i)=>sorted[(i+1)%28]!.i!==(s.i+1)%28);
  return {
    status:"READY",sectors,
    warnings:swapped?["Measured RA order differs from historical conventional list (including possible Zi/Shen crossover); review epoch before interpretation."]:[],
  };
}

export function chineseMansionForRA(
 raDegrees:number,sectors:readonly ChineseMansionSector[],expectedEpoch:string,
) {
 if(!Number.isFinite(raDegrees)||sectors.length!==28||
   !sectors.every(s=>s.epoch===expectedEpoch))return null;
 const angle=normalizeLongitude(raDegrees);
 return sectors.find(s=>normalizeLongitude(angle-s.startRa)<s.widthDegrees-1e-10)??null;
}

/** A research-only projection: RA sectors are overlaid on the wheel's degree
 * axis ONLY if caller certifies it is the same equatorial RA frame/epoch.
 */
export function chineseMansionHouseIntersections(
 sector:ChineseMansionSector,frame:FirmamentFrame,ascendantRa:number,
): ReturnType<typeof arcHouseOverlaps> {
 const end=sector.startRa+sector.widthDegrees;
 return arcHouseOverlaps({startLongitude:sector.startRa,endLongitude:end},frame,ascendantRa);
}
