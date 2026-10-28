import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/domain/types.ts';
import {createTeamList,installTeamLists} from '../src/domain/teamLists.ts';
import {validateState} from '../src/domain/validation.ts';

test('La lista PES6 se instala una vez y conserva cambios del usuario',()=>{
 const s=initialState();createTeamList(s,'pes6','Otra lista','Inter;Otro equipo');
 assert.equal(installTeamLists(s),true);
 const list=s.lists.find(l=>l.name==='TOP 12 PES6')!;
 assert.equal(list.entries.length,10);
 assert.equal(s.teams.filter(t=>t.name==='Inter').length,1);
 list.entries.pop();assert.equal(installTeamLists(s),false);
 assert.equal(list.entries.length,9);assert.equal(s.lists.length,2);validateState(s);
});
test('Equipos manuales eliminan espacios y rechazan repetidos antes de guardar',()=>{
 const s=initialState();const id=createTeamList(s,'pes6','Manual',' Inter ; Barcelona ; ; Arsenal ');
 assert.equal(s.lists.find(l=>l.id===id)!.entries.length,3);
 const before=JSON.stringify(s);
 assert.throws(()=>createTeamList(s,'pes6','Inválida','Valencia; valencia'),/repetidos/);
 assert.throws(()=>createTeamList(s,'pes6','Vacía',' ; '),/Escribí/);
 assert.equal(JSON.stringify(s),before);validateState(s);
});
