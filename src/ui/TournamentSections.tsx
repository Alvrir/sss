import {calendarSections} from '../domain/calendar';
export {calendarSections} from '../domain/calendar';
import React,{useState} from 'react';
import {ScrollView,View,Text} from 'react-native';
import type {Match,Tournament} from '../domain/types';
import {activePlayers,groupTables} from '../domain/engine';
import {withdrawPlayer} from '../domain/tournamentSetup';
import {useStore} from '../data/store';
import {Button,Card,Txt,confirm,colors} from './kit';
import {MatchCard} from './MatchEditor';

export function TournamentGroups({t,matches}:{t:Tournament;matches:Match[]}){
 const {state}=useStore();
 return <>{groupTables(t,matches).map(g=><Card key={g.id}>
  <Txt>{g.name}</Txt><Txt muted>Clasifican {t.groupQualifiers}. Los empates se señalan en azul.</Txt>
  <ScrollView horizontal><View>
   <View style={{flexDirection:'row'}}>{['Pos','Jugador','PJ','PG','PE','PP','GF','GC','DG','PTS'].map((title,i)=><Text key={title} style={{width:i===1?120:42,color:colors.muted}}>{title}</Text>)}</View>
   {g.rows.map(r=><View key={r.playerId} style={{flexDirection:'row',paddingVertical:10}}>
    {[r.rank,state.players.find(p=>p.id===r.playerId)?.name,r.p,r.w,r.d,r.l,r.gf,r.ga,r.gd,r.points].map((value,i)=><Text key={i} style={{width:i===1?120:42,color:r.tied?colors.blue:colors.text}}>{value}</Text>)}
   </View>)}
  </View></ScrollView>
 </Card>)}</>;
}
export function TournamentCalendar({t,matches,allMatches,limit}:{t:Tournament;matches:Match[];allMatches:Match[];limit:number}){
 const {state}=useStore();const name=(id:string)=>state.players.find(p=>p.id===id)?.name??id;
 return <>{calendarSections(matches).slice(0,limit).map(section=><View key={section.key} style={{gap:14}}>
  <Txt>{section.phase==='liga'?`Fecha ${section.round}`:section.phase==='tercero'?'Tercer puesto':`Copa · Ronda ${section.round}`}</Txt>
  {(section.phase==='liga'&&t.groups?t.groups:[{id:'all',name:'',players:activePlayers(t)}]).map(g=>{
   const games=section.matches.filter(m=>g.id==='all'||g.players.includes(m.home)&&g.players.includes(m.away));
   if(!games.length)return null;
   const full=allMatches.filter(m=>m.phase===section.phase&&m.round===section.round&&m.status!=='cancelado'&&!t.retired?.includes(m.home)&&!t.retired?.includes(m.away));
   const rests=g.players.filter(id=>!t.retired?.includes(id)&&!full.some(m=>m.home===id||m.away===id));
   return <View key={g.id} style={{gap:12}}>{!!g.name&&<Txt>{g.name}</Txt>}
    {games.sort((a,b)=>a.order-b.order).map(m=><MatchCard key={m.id} match={m}/>)}
    {section.phase==='liga'&&rests.length>0&&<Txt muted>Descansa: {rests.map(name).join(', ')}</Txt>}
   </View>;
  })}
 </View>)}</>;
}
export function TournamentParticipants({t}:{t:Tournament}){
 const {state,change,busy}=useStore();const [open,setOpen]=useState(false);
 return <Card><Button title={open?'Ocultar jugadores y equipos':`Jugadores y equipos · ${activePlayers(t).length} activos`} secondary onPress={()=>setOpen(!open)}/>{open&&t.players.map(id=>{
  const p=state.players.find(p=>p.id===id);const retired=t.retired?.includes(id);
  return <View key={id} style={{gap:6}}><Txt>{p?.name} · {state.teams.find(team=>team.id===t.fixedTeams[id])?.name??'Sin equipo fijo'}{retired?' · Retirado':''}</Txt>
   {!retired&&<Button secondary title={`Retirar a ${p?.name}`} disabled={busy} onPress={()=>confirm('Retirar jugador','Todos sus partidos dejarán de contar en la tabla. Los resultados se conservan en el historial y sus pendientes se cancelan. Este retiro no se revierte desde la app.',()=>void change(s=>withdrawPlayer(s,s.tournaments.find(x=>x.id===t.id)!,id)))}/>}
  </View>;
 })}{!!t.seeds&&<Txt muted>Para retirar jugadores, primero revisá y retirá el cuadro eliminatorio.</Txt>}</Card>;
}
