import * as SQLite from 'expo-sqlite';
import {createRepository} from './repository';
import type {State} from '../domain/types';
let pending:Promise<ReturnType<typeof createRepository>>|undefined;
async function repository(){if(!pending)pending=(async()=>{const db=await SQLite.openDatabaseAsync('match-roulette.db');const repo=createRepository(db);await repo.initialize();return repo;})();return pending;}
export async function loadState(){return (await repository()).loadState();}
export async function persist(state:State,previous?:State){return (await repository()).persist(state,previous);}
