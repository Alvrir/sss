import {notify} from '../ui/notifications';
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Alert,ActivityIndicator,View,Text} from 'react-native';
import type {State} from '../domain/types';
import {loadState,persist} from './database';
interface Store {state:State;change:(fn:(draft:State)=>void)=>Promise<boolean>;restore:(state:State)=>Promise<boolean>;busy:boolean}
const Context=createContext<Store|null>(null);
export function Provider({children}:{children:React.ReactNode}){const [state,setState]=useState<State>();const [error,setError]=useState('');const [busy,setBusy]=useState(false);const current=useRef<State|undefined>(undefined);const locked=useRef(false);useEffect(()=>{loadState().then(s=>{current.current=s;setState(s);}).catch(e=>setError(String(e)));},[]);
 async function write(fn:(s:State)=>State){if(locked.current||!current.current)return false;locked.current=true;setBusy(true);try{const previous=current.current;const next=fn(JSON.parse(JSON.stringify(previous)) as State);await persist(next,previous);current.current=next;setState(next);return true;}catch(e){notify('No se guardaron los cambios',(e as Error).message);return false;}finally{locked.current=false;setBusy(false);}}
 if(!state)return <View style={{flex:1,backgroundColor:'#0A1018',justifyContent:'center',padding:24}}>{error?<Text style={{color:'#FF879D'}}>No se pudo abrir la base de datos. No se borró ningún registro. {error}</Text>:<ActivityIndicator color="#B8FF65"/>}</View>;
 return <Context.Provider value={{state,busy,change:fn=>write(s=>{fn(s);return s;}),restore:s=>write(()=>s)}}>{children}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('Falta Provider');return value;}
