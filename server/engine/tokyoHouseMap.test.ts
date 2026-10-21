import { it, expect } from "vitest";
import { runSingleMethodEvent } from "./isolatedMethodRunner";
import { houseCusp } from "./houseFrameFoundation";
it("reports Tokyo Dome corrected house map for territorial audit",()=>{
  const e={teamA:"Tyson",teamB:"Douglas",sport:"boxing" as const,location:"Tokyo Dome, Tokyo",latitude:35.7056,longitude:139.7519,startTime:"1990-02-11T03:00:00.000Z",actualWinner:"B" as const};
  const r=runSingleMethodEvent(e,"CORE_01");
  const bodies=r.agent.chart.bodies;
  expect(bodies).toHaveLength(12);
  const asc=55.673653;
  for(const h of [1,2,3,4,5,6,7,8,9,10,11,12]){
    console.log("TOKYO_CHART_HOUSE "+JSON.stringify({house:h,cusp:houseCusp(h,"agent",asc),side:r.agent.chart.houses[h-1]!.side,bodies:bodies.filter(p=>p.house===h)}));
  }
});