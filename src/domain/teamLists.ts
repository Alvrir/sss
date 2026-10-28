import {ensure,uid,type State} from './types.ts';

export function createTeamList(s:State,gameId:string,name:string,text:string){
 const names=text.split(';').map(n=>n.trim()).filter(Boolean);
 const key=(n:string)=>n.normalize('NFC').toLocaleLowerCase('es');
 ensure(names.length>0,'Escribí los equipos separados por ;.');
 ensure(new Set(names.map(key)).size===names.length,'Hay equipos repetidos en la lista.');
 ensure(s.games.some(g=>g.id===gameId),'Elegí un videojuego.');
 const entries=names.map(name=>{
  let team=s.teams.find(t=>t.gameId===gameId&&key(t.name)===key(name));
  if(!team){team={id:uid(),gameId,name,kind:'club'};s.teams.push(team);}
  return {teamId:team.id,active:true};
 });
 const list={id:uid(),gameId,name,description:'',entries};s.lists.push(list);return list.id;
}

export function installTeamLists(s:State){
 if(s.settings.teamListPresets?.includes('top12-pes6'))return false;
 const game=s.games.find(g=>g.id==='pes6'||g.name.toLowerCase().replace(/\s/g,'')==='pes6');
 if(!game)return false;
 if(!s.lists.some(l=>l.gameId===game.id&&l.name==='TOP 12 PES6'))createTeamList(s,game.id,'TOP 12 PES6','Inter;AC Milan;Barcelona;Real Madrid;Manchester United;Arsenal;Juventus;Bayern Múnich;Olympique Lyon;Valencia');
 s.settings.teamListPresets=[...(s.settings.teamListPresets??[]),'top12-pes6'];return true;
}
