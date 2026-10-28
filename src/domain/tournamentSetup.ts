import {ensure,type State,type Tournament,type ID} from './types.ts';
import {activePlayers,leagueSchedule,officialTable,leagueReady,syncBracket} from './engine.ts';

export function availableTeams(s:State,t:Tournament):ID[]{
 const used=new Set(Object.values(t.fixedTeams));
 const list=s.lists.find(l=>l.id===t.listId&&l.gameId===t.gameId);
 return [...new Set(list?.entries.filter(e=>e.active).map(e=>e.teamId)??[])]
  .filter(id=>!used.has(id)&&s.teams.some(team=>team.id===id&&team.gameId===t.gameId));
}
export function startSetup(s:State,t:Tournament,mode:'manual'|'ruleta'){
 ensure(!s.matches.some(m=>m.tournamentId===t.id&&m.status==='finalizado'),'No se puede repetir la preparación con partidos jugados.');
 ensure(!t.retired?.length,'No se puede repetir la preparación después de un retiro.');
 const list=s.lists.find(l=>l.id===t.listId&&l.gameId===t.gameId);
 ensure(list&&new Set(list.entries.filter(e=>e.active).map(e=>e.teamId)).size>=t.players.length,'Elegí una lista con al menos un equipo activo diferente por jugador.');
 s.matches=s.matches.filter(m=>m.tournamentId!==t.id);
 t.seeds=undefined;t.leagueOrder=undefined;t.champion=undefined;t.runnerUp=undefined;t.status='activo';
 t.fixedTeams={};t.assignment='fijo';t.manual=false;
 t.setup={mode,order:[],complete:false};
 t.groups?.forEach(g=>{g.players=[];});
}
export function selectSetupPlayer(t:Tournament,id:ID){
 const setup=t.setup;ensure(setup&&!setup.complete,'La preparación ya terminó.');
 ensure(!setup.pendingPlayer,'Asigná primero el equipo del jugador seleccionado.');
 ensure(t.players.includes(id)&&!setup.order.includes(id),'Ese jugador ya fue seleccionado.');
 setup.pendingPlayer=id;
}
export function assignSetupTeam(s:State,t:Tournament,teamId:ID){
 const setup=t.setup;ensure(setup&&!setup.complete&&setup.pendingPlayer,'Elegí primero un jugador.');
 ensure(availableTeams(s,t).includes(teamId),'Ese equipo no está disponible en la lista.');
 const player=setup.pendingPlayer;
 t.fixedTeams[player]=teamId;
 if(t.groups)t.groups[setup.order.length%2]!.players.push(player);
 setup.order.push(player);setup.pendingPlayer=undefined;
}
export function undoSetup(t:Tournament){
 ensure(t.setup&&!t.setup.complete,'La preparación ya terminó.');
 if(t.setup.pendingPlayer){t.setup.pendingPlayer=undefined;return;}
 const id=t.setup.order.pop();if(!id)return;
 delete t.fixedTeams[id];t.groups?.forEach(g=>{g.players=g.players.filter(p=>p!==id);});
}
export function finishSetup(s:State,t:Tournament){
 const setup=t.setup;ensure(setup&&!setup.complete&&!setup.pendingPlayer&&setup.order.length===t.players.length,'Asigná todos los jugadores y equipos antes de generar las fechas.');
 ensure(!s.matches.some(m=>m.tournamentId===t.id),'El torneo ya tiene partidos.');
 if(t.groups)ensure(t.groups.every(g=>g.players.length>=(t.groupQualifiers??2)),'Revisá la cantidad de clasificados por grupo.');
 setup.complete=true;
 if(t.format==='copa'){t.seeds=[...setup.order];syncBracket(s,t);}
 else s.matches.push(...leagueSchedule(t));
}
export function withdrawPlayer(s:State,t:Tournament,id:ID){
 ensure(!t.setup||t.setup.complete,'Terminá la preparación antes de retirar un jugador.');
 ensure(!t.seeds,'Primero retirá el cuadro eliminatorio para proteger los cruces ya jugados.');
 ensure(activePlayers(t).includes(id),'El jugador no está activo en este torneo.');
 t.retired=[...(t.retired??[]),id];t.leagueOrder=undefined;
 for(const m of s.matches.filter(m=>m.tournamentId===t.id&&(m.home===id||m.away===id))){
  if(m.status==='pendiente'){m.status='cancelado';m.score=undefined;m.winner=undefined;m.updatedAt=new Date().toISOString();}
 }
 t.champion=undefined;t.runnerUp=undefined;t.status='activo';
 if(t.format==='liga'&&leagueReady(t,s.matches)){
  const rows=officialTable(t,s.matches);
  if(!rows[0]?.tied){t.champion=rows[0]?.playerId;t.runnerUp=rows[1]?.playerId;t.status='finalizado';}
 }
}

export function validateTournamentSetup(s:State,t:Tournament){
 const uniqueSubset=(ids:ID[])=>Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>t.players.includes(id));
 if(t.retired)ensure(uniqueSubset(t.retired),'Retiros inválidos.');
 if(t.groups){
  ensure(t.format==='mixto'&&Array.isArray(t.groups)&&t.groups.length===2,'Se requieren dos grupos.');
  ensure(new Set(t.groups.map(g=>g.id)).size===2&&t.groups.every(g=>typeof g.id==='string'&&g.id&&typeof g.name==='string'&&g.name&&uniqueSubset(g.players)),'Grupos inválidos.');
  const members=t.groups.flatMap(g=>g.players);
  ensure(new Set(members).size===members.length,'Un jugador no puede estar en ambos grupos.');
  ensure(Number.isInteger(t.groupQualifiers)&&t.groupQualifiers!>=1&&t.groupQualifiers!<=Math.floor(t.players.length/2),'Clasificados por grupo inválidos.');
  ensure(t.rules.qualifiers===t.groupQualifiers!*2,'Cantidad total de clasificados inválida.');
  if(!t.setup||t.setup.complete)ensure(members.length===t.players.length&&t.groups.every(g=>g.players.length>=t.groupQualifiers!),'Faltan participantes en los grupos.');
 }
 if(t.setup){
  const d=t.setup;
  ensure(['manual','ruleta'].includes(d.mode)&&typeof d.complete==='boolean'&&uniqueSubset(d.order),'Preparación inválida.');
  ensure(!d.pendingPlayer||(t.players.includes(d.pendingPlayer)&&!d.order.includes(d.pendingPlayer)&&!d.complete),'Jugador pendiente inválido.');
  ensure(t.assignment==='fijo'&&t.fixedTeams&&Object.keys(t.fixedTeams).length===d.order.length&&d.order.every(id=>!!t.fixedTeams[id]),'Asignaciones de preparación inválidas.');
  ensure(new Set(Object.values(t.fixedTeams)).size===d.order.length,'No se puede repetir equipo.');
  if(d.complete)ensure(d.order.length===t.players.length,'La preparación está incompleta.');
  else ensure(!s.matches.some(m=>m.tournamentId===t.id)&&!t.seeds&&!t.retired?.length,'No puede haber partidos antes de terminar la preparación.');
  if(t.groups)for(let i=0;i<2;i++)ensure(JSON.stringify(t.groups[i]!.players)===JSON.stringify(d.order.filter((_,n)=>n%2===i)),'El reparto debe alternar los dos grupos.');
 }
}
