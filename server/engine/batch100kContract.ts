/** Deterministic planning/validation utilities for a future durable DB-backed 100k runner. */
export const SIMULATION_PRESETS = [1,200,1000,10000,100000] as const;
export type RunStatus = 'queued'|'running'|'pausing'|'paused'|'completed'|'partial'|'failed'|'cancelled';
export type RunProgress = {target:number;processed:number;verified:number;failed:number;unavailable:number;skipped:number;status:RunStatus};
export function validateRunProgress(p:RunProgress):RunProgress {for(const key of ['target','processed','verified','failed','unavailable','skipped'] as const){if(!Number.isSafeInteger(p[key])||p[key]<0)throw Error('Invalid '+key);}if(p.processed>p.target||p.verified+p.failed+p.unavailable+p.skipped>p.processed)throw Error('Inconsistent run progress');if(p.status==='completed'&&p.processed!==p.target)throw Error('Completed run must process all requested events');return p;}
export function planEventPages(total:number,pageSize=250):Array<{offset:number;limit:number}>{if(!Number.isSafeInteger(total)||total<0||total>100000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw Error('Invalid batch plan');const pages=[];for(let offset=0;offset<total;offset+=pageSize)pages.push({offset,limit:Math.min(pageSize,total-offset)});return pages;}
/** Stable event identifier for idempotent persistence; DB MUST enforce unique(runId,eventId). */
export function eventResultKey(runId:number,eventId:string):string {if(!Number.isSafeInteger(runId)||runId<1||!eventId.trim())throw Error('Invalid event key');return runId+':'+eventId;}
