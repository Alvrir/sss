import React,{useState} from 'react';
import type {Tournament} from '../domain/types';
import {useStore} from '../data/store';
import {availableTeams,selectSetupPlayer,assignSetupTeam,finishSetup,undoSetup} from '../domain/tournamentSetup';
import {leagueSchedule} from '../domain/engine';
import {Wheel} from './Wheel';
import {Button,Card,Select,Txt} from './kit';

export function TournamentSetup({t}:{t:Tournament}){
 const {state,change,busy}=useStore();const [spinning,setSpinning]=useState(false);
 const [manualPlayer,setManualPlayer]=useState(''),[manualTeam,setManualTeam]=useState('');
 const setup=t.setup!;const blocked=busy||spinning;
 const playerName=(id:string)=>state.players.find(p=>p.id===id)?.name??id;
 const teamName=(id?:string)=>state.teams.find(p=>p.id===id)?.name??'Sin equipo';
 const remaining=state.players.filter(p=>t.players.includes(p.id)&&!setup.order.includes(p.id)&&p.id!==setup.pendingPlayer);
 const teamIds=availableTeams(state,t);const teams=state.teams.filter(team=>teamIds.includes(team.id));
 const position=setup.order.length;
 const destination=t.groups?`${position<2?'Cabeza de':'Integrante de'} ${t.groups[position%2]!.name}`:t.format==='copa'?`Semilla ${position+1}`:`Fecha 1 · ${position===t.players.length-1&&t.players.length%2?'descansa':`partido ${Math.floor(position/2)+1}, jugador ${position%2?'B':'A'}`}`;
 const target=(s:typeof state)=>s.tournaments.find(x=>x.id===t.id)!;
 const pickPlayer=(id:string)=>void change(s=>selectSetupPlayer(target(s),id));
 const pickTeam=(id:string)=>void change(s=>assignSetupTeam(s,target(s),id));
 const finished=setup.order.length===t.players.length;
 return <>
  <Card><Txt>Organizar el torneo · {setup.order.length}/{t.players.length}</Txt>
   <Select label="Modo de selección" value={setup.mode} options={[{id:'manual',name:'Manual'},{id:'ruleta',name:'Ruleta'}]} onChange={v=>{if(!blocked)void change(s=>{target(s).setup!.mode=v==='manual'?'manual':'ruleta';});}}/>
   {!finished&&<Txt>{destination}</Txt>}
   <Txt muted>Cada selección se guarda. Los jugadores y equipos asignados dejan de estar disponibles.</Txt>
  </Card>
  {!finished&&<Card>{setup.pendingPlayer?<>
   <Txt>Jugador: {playerName(setup.pendingPlayer)}</Txt>
   {setup.mode==='ruleta'?<Wheel key={`team-${position}`} items={teams} animate={state.settings.animations} label="2. Sortear su equipo" disabled={blocked} onBusy={setSpinning} onResult={pickTeam}/>:<>
    <Select label="Equipo fijo" value={manualTeam} options={teams} onChange={setManualTeam}/>
    <Button title="Asignar equipo" disabled={blocked||!teamIds.includes(manualTeam)} onPress={()=>{pickTeam(manualTeam);setManualTeam('');}}/>
   </>}
   {!teams.length&&<Txt>No quedan equipos disponibles. Revisá los equipos activos de la lista en el catálogo.</Txt>}
  </>:setup.mode==='ruleta'?<Wheel key={`player-${position}`} items={remaining} animate={state.settings.animations} label="1. Sortear jugador" disabled={blocked} onBusy={setSpinning} onResult={pickPlayer}/>:<>
   <Select label="Jugador" value={manualPlayer} options={remaining} onChange={setManualPlayer}/>
   <Button title="Elegir jugador" disabled={blocked||!remaining.some(p=>p.id===manualPlayer)} onPress={()=>{pickPlayer(manualPlayer);setManualPlayer('');}}/>
  </>}</Card>}
  <Card><Txt>Asignaciones</Txt>{(t.groups??[{id:'liga',name:t.format==='copa'?'Orden de siembra':'Orden de la primera fecha',players:setup.order}]).map(g=><React.Fragment key={g.id}>
   <Txt>{g.name}</Txt>{g.players.map((id,i)=><Txt key={id}>{i+1}. {playerName(id)} · {teamName(t.fixedTeams[id])}</Txt>)}
  </React.Fragment>)}
   <Button title="Deshacer última selección" secondary disabled={blocked||(!setup.order.length&&!setup.pendingPlayer)} onPress={()=>void change(s=>undoSetup(target(s)))}/>
  </Card>
  {finished&&<Card><Txt>Todo listo para generar los partidos</Txt>
   {t.format!=='copa'&&leagueSchedule(t).filter(m=>m.round===1).map(m=><Txt key={`${m.home}-${m.away}`}>{m.groupId?`Grupo ${m.groupId} · `:''}{playerName(m.home)} vs {playerName(m.away)}</Txt>)}
   <Txt muted>Se generarán todas las fechas, manteniendo estos equipos. Con cantidad impar habrá un descanso por fecha.</Txt>
   <Button title={t.format==='copa'?'Confirmar y crear cuadro':'Confirmar y generar todas las fechas'} disabled={blocked} onPress={()=>void change(s=>finishSetup(s,target(s)))}/>
  </Card>}
 </>;
}
