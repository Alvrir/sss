import type * as SQLite from 'expo-sqlite';
import {initialState,type State} from '../domain/types.ts';
import {validateState} from '../domain/validation.ts';
const tables=['players','games','teams','lists','tournaments','matches'] as const;
export function createRepository(db:SQLite.SQLiteDatabase){
const database=async()=>db;
async function initialize(){const version=await db.getFirstAsync<{user_version:number}>('PRAGMA user_version');if((version?.user_version??0)>1)throw new Error('Esta base fue creada por una versión más nueva. Actualizá la aplicación sin borrar los datos.');await db.execAsync(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS teams(id TEXT PRIMARY KEY,game_id TEXT NOT NULL REFERENCES games(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS lists(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS tournaments(id TEXT PRIMARY KEY,game_id TEXT NOT NULL REFERENCES games(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY,game_id TEXT NOT NULL REFERENCES games(id),tournament_id TEXT REFERENCES tournaments(id),home TEXT NOT NULL REFERENCES players(id),away TEXT NOT NULL REFERENCES players(id),date TEXT NOT NULL,status TEXT NOT NULL,phase TEXT NOT NULL,home_team TEXT REFERENCES teams(id),away_team TEXT REFERENCES teams(id),official INTEGER NOT NULL,payload TEXT NOT NULL,CHECK(home<>away));
 CREATE INDEX IF NOT EXISTS idx_match_date ON matches(status,official,date);
 CREATE INDEX IF NOT EXISTS idx_match_home ON matches(home,game_id,date);
 CREATE INDEX IF NOT EXISTS idx_match_away ON matches(away,game_id,date);
 CREATE INDEX IF NOT EXISTS idx_match_tournament ON matches(tournament_id,phase);
 CREATE INDEX IF NOT EXISTS idx_match_teams ON matches(home_team,away_team);
 PRAGMA user_version=1;`);}
async function loadState():Promise<State>{const db=await database();const marker=await db.getFirstAsync<{value:string}>('SELECT value FROM meta WHERE key=?','settings');if(!marker){const seed=initialState();await persist(seed);return seed;}const s={version:1,settings:JSON.parse(marker.value)} as State;for(const table of tables){const rows=await db.getAllAsync<{payload:string}>(`SELECT payload FROM ${table}`);(s[table] as unknown[])=rows.map(x=>JSON.parse(x.payload));}validateState(s);return s;}
async function persist(s:State,previous?:State):Promise<void>{validateState(s);const db=await database();await db.withExclusiveTransactionAsync(async tx=>{if(!previous){for(const table of [...tables].reverse())await tx.runAsync(`DELETE FROM ${table}`);}for(const table of tables){const old=new Map(previous?.[table].map(x=>[x.id,JSON.stringify(x)])??[]);for(const row of s[table]){const payload=JSON.stringify(row);if(old.get(row.id)===payload)continue;if(table==='teams'||table==='tournaments'){await tx.runAsync(`INSERT INTO ${table}(id,game_id,payload) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET game_id=excluded.game_id,payload=excluded.payload`,row.id,(row as State['teams'][number]).gameId,payload);}else if(table==='matches'){const m=row as State['matches'][number];await tx.runAsync('INSERT INTO matches(id,game_id,tournament_id,home,away,date,status,phase,home_team,away_team,official,payload) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET game_id=excluded.game_id,tournament_id=excluded.tournament_id,home=excluded.home,away=excluded.away,date=excluded.date,status=excluded.status,phase=excluded.phase,home_team=excluded.home_team,away_team=excluded.away_team,official=excluded.official,payload=excluded.payload',m.id,m.gameId,m.tournamentId??null,m.home,m.away,m.date,m.status,m.phase,m.homeTeam??null,m.awayTeam??null,m.official?1:0,payload);}else await tx.runAsync(`INSERT INTO ${table}(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload`,row.id,payload);}}
 if(previous)for(const table of [...tables].reverse()){const ids=new Set(s[table].map(x=>x.id));for(const row of previous[table])if(!ids.has(row.id))await tx.runAsync(`DELETE FROM ${table} WHERE id=?`,row.id);}
 await tx.runAsync('INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value','settings',JSON.stringify(s.settings));});}

return {initialize,loadState,persist};
}
