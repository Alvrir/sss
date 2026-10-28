import type {Match} from './types.ts';
export function calendarSections(matches:Match[]){
 const map=new Map<string,{key:string;phase:Match['phase'];round:number;matches:Match[]}>();
 for(const m of matches){const key=`${m.phase}:${m.round}`;if(!map.has(key))map.set(key,{key,phase:m.phase,round:m.round,matches:[]});map.get(key)!.matches.push(m);}
 const phaseOrder={amistoso:0,liga:0,copa:1,tercero:2};
 return [...map.values()].sort((a,b)=>phaseOrder[a.phase]-phaseOrder[b.phase]||a.round-b.round);
}
