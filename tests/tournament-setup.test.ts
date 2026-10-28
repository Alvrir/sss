import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,defaultRules,type Tournament} from '../src/domain/types.ts';
import {startSetup,selectSetupPlayer,assignSetupTeam,availableTeams,undoSetup,finishSetup,withdrawPlayer} from '../src/domain/tournamentSetup.ts';
import {leagueReady,officialTable,groupTables,qualify,syncBracket,bracket,saveResult,resolveLeagueOrder} from '../src/domain/engine.ts';
import {parseBackup,validateState} from '../src/domain/validation.ts';
import {appearances} from '../src/domain/statistics.ts';
import {calendarSections} from '../src/domain/calendar.ts';

export function setup(n=6,groups=false,legs:1|2=1){
 const s=initialState();while(s.players.length<n)s.players.push({...s.players[0]!,id:`p-${s.players.length}`,name:`Jugador ${s.players.length}`});
 s.teams=Array.from({length:n},(_,i)=>({id:`team-${i}`,name:`Equipo ${i}`,gameId:'pes6',kind:'club' as const}));
 s.lists=[{id:'list',gameId:'pes6',name:'Lista',description:'',entries:s.teams.map(t=>({teamId:t.id,active:true}))}];
 const t:Tournament={id:'t',name:'Torneo',gameId:'pes6',date:'2026-10-27T00:00:00Z',season:'2026',players:s.players.slice(0,n).map(p=>p.id),format:groups?'mixto':'liga',manual:false,rules:{...defaultRules,criteria:[...defaultRules.criteria],leagueLegs:legs,qualifiers:Math.min(n,4)},assignment:'fijo',fixedTeams:{},status:'activo',listId:'list'};
 if(groups){t.groups=[{id:'A',name:'Grupo A',players:[]},{id:'B',name:'Grupo B',players:[]}];t.groupQualifiers=2;}
 s.tournaments.push(t);startSetup(s,t,'ruleta');return {s,t};
}
function assignAll(s:ReturnType<typeof initialState>,t:Tournament){for(const p of t.players){selectSetupPlayer(t,p);assignSetupTeam(s,t,availableTeams(s,t)[0]!);}finishSetup(s,t);}
const score=(home:number,away:number)=>({home,away,extraHome:0,extraAway:0});

test('Sorteo alternado, sin repetición y recuperable entre jugador y equipo',()=>{
 const {s,t}=setup(6,true);selectSetupPlayer(t,t.players[0]!);
 assert.throws(()=>selectSetupPlayer(t,t.players[1]!),/primero/);
 const restored=parseBackup(JSON.stringify(s));assert.equal(restored.tournaments[0]!.setup!.pendingPlayer,t.players[0]);
 assignSetupTeam(s,t,'team-0');assert.ok(!availableTeams(s,t).includes('team-0'));
 assert.throws(()=>selectSetupPlayer(t,t.players[0]!),/ya fue/);
 selectSetupPlayer(t,t.players[1]!);assert.throws(()=>assignSetupTeam(s,t,'team-0'),/disponible/);
 assignSetupTeam(s,t,'team-1');
 assert.deepEqual(t.groups!.map(g=>g.players),[[t.players[0]],[t.players[1]]]);
 undoSetup(t);assert.ok(availableTeams(s,t).includes('team-1'));assert.deepEqual(t.groups![1]!.players,[]);
 selectSetupPlayer(t,t.players[1]!);undoSetup(t);assert.equal(t.setup!.pendingPlayer,undefined);validateState(s);
});
for(let n=2;n<=11;n++)for(const legs of [1,2] as const)test(`Liga sorteada ${n} jugadores / ${legs} vueltas: primera fecha y calendario completo`,()=>{
 const {s,t}=setup(n,false,legs);assignAll(s,t);validateState(s);
 assert.equal(s.matches.length,n*(n-1)/2*legs);
 const first=s.matches.filter(m=>m.round===1);assert.equal(first.length,Math.floor(n/2));
 for(let i=0;i<first.length;i++)assert.deepEqual([first[i]!.home,first[i]!.away],[t.players[i*2],t.players[i*2+1]]);
 for(const r of new Set(s.matches.map(m=>m.round))){const players=s.matches.filter(m=>m.round===r).flatMap(m=>[m.home,m.away]);assert.equal(players.length,new Set(players).size);}
 const pairs=new Map<string,number>();for(const m of s.matches){const key=[m.home,m.away].sort().join(':');pairs.set(key,(pairs.get(key)??0)+1);assert.equal(m.homeTeam,t.fixedTeams[m.home]);assert.equal(m.awayTeam,t.fixedTeams[m.away]);}
 assert.ok([...pairs.values()].every(n=>n===legs));assert.equal(leagueReady(t,s.matches),false);
 for(const m of s.matches)saveResult(s,m.id,score(1,0));assert.equal(leagueReady(t,s.matches),true);
 assert.throws(()=>finishSetup(s,t),/Asigná/);assert.throws(()=>startSetup(s,t,'manual'),/jugados/);
});
test('Dos grupos: A B A B, tablas separadas y semifinales cruzadas con equipos fijos',()=>{
 const {s,t}=setup(6,true);assignAll(s,t);
 assert.deepEqual(t.groups!.map(g=>g.players),[[t.players[0],t.players[2],t.players[4]],[t.players[1],t.players[3],t.players[5]]]);
 assert.equal(s.matches.length,6);assert.equal(new Set(s.matches.map(m=>m.round)).size,3);
 for(const m of s.matches){assert.ok(t.groups!.some(g=>g.id===m.groupId&&g.players.includes(m.home)&&g.players.includes(m.away)));saveResult(s,m.id,t.players.indexOf(m.home)<t.players.indexOf(m.away)?score(1,0):score(0,1));}
 assert.equal(leagueReady(t,s.matches),true);assert.deepEqual(groupTables(t,s.matches).map(g=>g.rows[0]!.points),[6,6]);
 t.seeds=qualify(s,t);syncBracket(s,t);
 assert.deepEqual(bracket(t,s.matches)[0]!.map(x=>[x.home,x.away]),[[t.players[0],t.players[3]],[t.players[1],t.players[2]]]);
 for(const m of [...s.matches.filter(m=>m.phase==='copa')])saveResult(s,m.id,score(2,0));
 const final=s.matches.find(m=>m.phase==='copa'&&m.round===2)!;assert.equal(final.homeTeam,t.fixedTeams[final.home]);
 saveResult(s,final.id,score(1,0));assert.equal(t.status,'finalizado');validateState(s);
});
test('Empates de grupo requieren decisión y no permiten ignorar una mejor posición',()=>{
 const {s,t}=setup(6,true);assignAll(s,t);for(const m of s.matches)saveResult(s,m.id,score(0,0));
 assert.throws(()=>qualify(s,t),/empatadas/);assert.deepEqual(qualify(s,t,t.players.slice(0,4)),t.players.slice(0,4));
 assert.throws(()=>qualify(s,t,[t.players[1]!,t.players[0]!,t.players[3]!,t.players[2]!]),/grupo/);
 const game=s.matches.find(m=>m.home===t.players[0]||m.away===t.players[0])!;
 saveResult(s,game.id,game.home===t.players[0]?score(2,0):score(0,2));
 assert.throws(()=>qualify(s,t,[t.players[2]!,t.players[1]!,t.players[4]!,t.players[3]!]),/puntos/);
});
test('Retiro recalcula ambos lados de todos sus partidos sin borrar el historial',()=>{
 const {s,t}=setup(4);assignAll(s,t);const played=s.matches.find(m=>m.home===t.players[0]||m.away===t.players[0])!;
 saveResult(s,played.id,score(3,1));const history=appearances(s).length;
 withdrawPlayer(s,t,t.players[0]!);assert.equal(officialTable(t,s.matches).length,3);
 assert.ok(officialTable(t,s.matches).every(r=>r.p===0&&r.points===0&&r.gf===0));
 assert.equal(appearances(s).length,history);assert.equal(played.status,'finalizado');
 assert.ok(s.matches.filter(m=>m.home===t.players[0]||m.away===t.players[0]).every(m=>m.status!=='pendiente'));
 assert.throws(()=>saveResult(s,played.id,score(2,0)),/retiro/);
 for(const m of s.matches.filter(m=>m.status==='pendiente'))saveResult(s,m.id,score(0,0));
 assert.equal(leagueReady(t,s.matches),true);resolveLeagueOrder(s,t,t.players.slice(1));assert.equal(t.champion,t.players[1]);validateState(s);
});
test('Retiro en grupos solo recalcula el grupo afectado',()=>{
 const {s,t}=setup(8,true);assignAll(s,t);for(const m of s.matches)saveResult(s,m.id,score(0,0));
 withdrawPlayer(s,t,t.players[0]!);const tables=groupTables(t,s.matches);
 assert.ok(tables[0]!.rows.every(r=>r.p===2));assert.ok(tables[1]!.rows.every(r=>r.p===3));assert.equal(leagueReady(t,s.matches),true);validateState(s);
});
test('Copias y edición no permiten repetir equipos ni modificar equipos fijos',()=>{
 const {s,t}=setup();assignAll(s,t);const copy=structuredClone(s);copy.tournaments[0]!.fixedTeams[t.players[1]!]=t.fixedTeams[t.players[0]!]!;assert.throws(()=>validateState(copy),/repetir/);
 s.matches[0]!.homeTeam='team-5';assert.throws(()=>saveResult(s,s.matches[0]!.id,score(1,0)),/fijados/);assert.throws(()=>validateState(s),/fijos/);
});
test('Vista por fechas reúne A y B, ordena fechas numéricamente y separa la copa',()=>{
 const {s,t}=setup(6,true);assignAll(s,t);
 const matches=[...s.matches].reverse();matches.push({...matches[0]!,id:'cup',phase:'copa',round:1});
 const dates=calendarSections(matches);
 assert.deepEqual(dates.map(d=>[d.phase,d.round]),[['liga',1],['liga',2],['liga',3],['copa',1]]);
 assert.ok(dates.slice(0,3).every(d=>d.matches.length===2&&new Set(d.matches.map(m=>m.groupId)).size===2));
});
test('Copa con preparación manual conserva los equipos en las rondas siguientes',()=>{
 const {s,t}=setup(4);t.format='copa';t.setup!.mode='manual';assignAll(s,t);
 for(const m of [...s.matches])saveResult(s,m.id,score(1,0));
 const final=s.matches.find(m=>m.round===2)!;
 assert.equal(final.homeTeam,t.fixedTeams[final.home]);assert.equal(final.awayTeam,t.fixedTeams[final.away]);
 assert.throws(()=>withdrawPlayer(s,t,final.home),/cuadro/);validateState(s);
});
test('Preparación rechaza listas insuficientes sin borrar partidos ni asignaciones',()=>{
 const {s,t}=setup(6);assignAll(s,t);s.lists[0]!.entries[0]!.active=false;
 const before=JSON.stringify(s);assert.throws(()=>startSetup(s,t,'ruleta'),/equipo activo/);assert.equal(JSON.stringify(s),before);
});
