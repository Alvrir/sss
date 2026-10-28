import {initialState,type State} from '../domain/types';
import {validateState} from '../domain/validation';

let pending:Promise<IDBDatabase>|undefined;
function database(){
 if(!pending)pending=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open('match-roulette',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>{pending=undefined;reject(request.error);};
 });
 return pending;
}
export async function loadState():Promise<State>{
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
  let result:State;let failure:unknown;
  const get=store.get('current');
  get.onsuccess=()=>{try{result=get.result??initialState();validateState(result);if(!get.result)store.put(result,'current');}catch(e){failure=e;tx.abort();}};
  tx.oncomplete=()=>resolve(result);
  tx.onabort=tx.onerror=()=>reject(failure??tx.error??new Error('No se pudo abrir el almacenamiento local.'));
 });
}
export async function persist(state:State,previous?:State){
 validateState(state);const db=await database();
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');let failure:unknown;
  const get=store.get('current');
  get.onsuccess=()=>{
   if(previous&&JSON.stringify(get.result)!==JSON.stringify(previous)){failure=new Error('Los datos cambiaron en otra pestaña. Recargá antes de continuar.');tx.abort();return;}
   store.put(state,'current');
  };
  tx.oncomplete=()=>resolve();
  tx.onabort=tx.onerror=()=>reject(failure??tx.error??new Error('No se guardaron los datos. Revisá el espacio disponible.'));
 });
}
