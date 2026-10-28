import React,{useState} from 'react';
import {useStore} from '../data/store';
import {defaultRules,ensure,uid,type Tournament} from '../domain/types';
import {startSetup} from '../domain/tournamentSetup';
import {Button,Card,Field,Multi,Select,Sheet,Toggle,Txt} from './kit';
export function TournamentForm({onClose,onCreated,existing}:{onClose:()=>void;onCreated:(id:string)=>void;existing?:Tournament}){
 const {state,change,busy}=useStore();
 const [name,setName]=useState(existing?.name??''),[game,setGame]=useState(existing?.gameId??state.games[0]?.id??'');
 const [date,setDate]=useState(existing?.date.slice(0,10)??new Date().toISOString().slice(0,10)),[season,setSeason]=useState(existing?.season??String(new Date().getFullYear()));
 const [players,setPlayers]=useState(existing?.players??state.players.filter(p=>p.active).map(p=>p.id));
 const [format,setFormat]=useState(existing?.groups?'grupos':existing?.format??'liga');
 const [mode,setMode]=useState<'manual'|'ruleta'>('ruleta'),[rules,setRules]=useState({...defaultRules,...existing?.rules});
 const [perGroup,setPerGroup]=useState(String(existing?.groupQualifiers??2)),[list,setList]=useState(existing?.listId??'');
 const canChangeList=!existing||(!existing.setup?.order.length&&!existing.setup?.pendingPlayer&&!state.matches.some(m=>m.tournamentId===existing.id&&m.status==='finalizado'));
 const update=(value:Partial<typeof rules>)=>setRules({...rules,...value});
 async function save(){const id=existing?.id??uid();const ok=await change(s=>{
  ensure(name.trim()&&game,'Completá nombre y videojuego.');
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date)),'Fecha inválida.');
  if(existing){const target=s.tournaments.find(t=>t.id===id)!;Object.assign(target,{name:name.trim(),date:new Date(date).toISOString(),season});if(canChangeList)target.listId=list||undefined;if(target.groups&&!target.seeds){const q=Number(perGroup);const max=target.setup?.complete?Math.min(...target.groups.map(g=>g.players.filter(p=>!target.retired?.includes(p)).length)):Math.floor(target.players.length/2);ensure(Number.isInteger(q)&&q>=1&&q<=max,'Revisá los clasificados por grupo.');target.groupQualifiers=q;target.rules.qualifiers=q*2;}return;}
  ensure(players.length>=(format==='grupos'?4:2),'Elegí al menos dos jugadores, o cuatro para los dos grupos.');
  const q=format==='grupos'?Number(perGroup):Math.min(rules.qualifiers,players.length);
  if(format==='grupos')ensure(Number.isInteger(q)&&q>=1&&q<=Math.floor(players.length/2),'Revisá los clasificados por grupo.');
  const t:Tournament={id,name:name.trim(),gameId:game,date:new Date(date).toISOString(),season,players:[...players],format:format==='grupos'?'mixto':format as Tournament['format'],manual:false,rules:{...rules,qualifiers:format==='grupos'?q*2:q},listId:list,assignment:'fijo',fixedTeams:{},status:'activo'};
  if(format==='grupos'){t.groups=[{id:'A',name:'Grupo A',players:[]},{id:'B',name:'Grupo B',players:[]}];t.groupQualifiers=q;}
  startSetup(s,t,mode);s.tournaments.push(t);
 });if(ok)onCreated(id);}
 return <Sheet visible title={existing?'Editar torneo':'Nuevo torneo'} onClose={onClose}>
  <Card><Field label="Nombre" value={name} onChange={setName}/><Field label="Fecha de inicio (AAAA-MM-DD)" value={date} onChange={setDate}/><Field label="Temporada" value={season} onChange={setSeason}/>
   {!existing&&<><Select label="Videojuego" value={game} options={state.games} onChange={id=>{setGame(id);setList('');}}/>
    <Multi label="Jugadores" values={players} options={state.players.filter(p=>p.active)} onChange={ids=>{setPlayers(ids);update({qualifiers:Math.min(rules.qualifiers,Math.max(2,ids.length))});}}/>
    <Select label="Formato" value={format} onChange={v=>setFormat(v||'liga')} options={[{id:'liga',name:'Liga'},{id:'grupos',name:'Dos grupos + eliminatorias'},{id:'mixto',name:'Liga + eliminatorias'},{id:'copa',name:'Eliminación directa'}]}/>
    <Select label="Organizar jugadores y equipos" value={mode} onChange={v=>setMode(v==='manual'?'manual':'ruleta')} options={[{id:'ruleta',name:'Ruleta, paso a paso'},{id:'manual',name:'Elección manual'}]}/></>}
   {canChangeList&&<Select label="Lista de equipos" value={list} onChange={setList} options={state.lists.filter(l=>l.gameId===game)}/>}
   <Txt muted>Un equipo diferente por jugador, fijo durante todo el torneo. La lista debe tener suficientes equipos activos.</Txt>
   {!state.lists.some(l=>l.gameId===game)&&<Txt>Primero creá una lista desde «Equipos y listas».</Txt>}
  </Card>
  {existing?.groups&&!existing.seeds&&<Card><Field label="Clasifican por grupo" value={perGroup} onChange={setPerGroup} number/></Card>}
  {!existing&&<Card><Txt>Reglas</Txt>
   {format!=='copa'&&<><Toggle label="Liga / grupos ida y vuelta" value={rules.leagueLegs===2} onChange={v=>update({leagueLegs:v?2:1})}/>
    <Field label="Puntos por victoria" value={String(rules.win)} onChange={v=>update({win:Number(v)})} number/>
    <Field label="Puntos por empate" value={String(rules.draw)} onChange={v=>update({draw:Number(v)})} number/>
    <Field label="Puntos por derrota" value={String(rules.loss)} onChange={v=>update({loss:Number(v)})} number/>
    <Txt muted>Desempate: puntos, diferencia de gol, goles a favor y victorias. Los empates restantes se resuelven explícitamente.</Txt></>}
   {format==='grupos'&&<Field label="Clasifican por grupo" value={perGroup} onChange={setPerGroup} number/>}
   {format==='mixto'&&<Field label="Clasificados a eliminatorias" value={String(rules.qualifiers)} onChange={v=>update({qualifiers:Number(v)})} number/>}
   {format!=='liga'&&<><Toggle label="Eliminatorias ida y vuelta" value={rules.cupLegs===2} onChange={v=>update({cupLegs:v?2:1})}/><Toggle label="Final a partido único" value={rules.finalSingle} onChange={v=>update({finalSingle:v})}/><Toggle label="Tercer puesto" value={rules.thirdPlace} onChange={v=>update({thirdPlace:v})}/></>}
  </Card>}
  <Button title={existing?'Guardar cambios':'Crear y organizar torneo'} disabled={busy} onPress={()=>void save()}/>
 </Sheet>;
}
