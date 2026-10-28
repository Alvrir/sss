import React,{useEffect,useState} from 'react';
import {Card,Txt} from './kit';
export function OfflineStatus(){
 const [ready,setReady]=useState(false);
 useEffect(()=>{let active=true;if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 return <Card><Txt>{ready?'Lista para usar sin conexión':globalThis.isSecureContext?'Preparando copia sin conexión…':'El modo sin conexión requiere HTTPS o localhost.'}</Txt><Txt muted>Los datos son propios de este navegador. Exportá una copia para trasladarlos a otro dispositivo.</Txt></Card>;
}
