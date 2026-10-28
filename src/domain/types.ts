export type ID = string;
export interface Player { id: ID; name: string; alias: string; color: string; active: boolean; createdAt: string }
export interface Game { id: ID; name: string }
export interface Team { id: ID; gameId: ID; name: string; realName?: string; country?: string; kind: 'club'|'selección'; rating?: number; clubId?: string }
export interface TeamList { id: ID; gameId: ID; name: string; description: string; entries: {teamId: ID; active: boolean}[] }
export type Format = 'liga'|'copa'|'mixto';
export type Criterion = 'points'|'gd'|'gf'|'w';
export interface TournamentGroup { id:string; name:string; players:ID[] }
export interface TournamentSetup { mode:'manual'|'ruleta'; order:ID[]; pendingPlayer?:ID; complete:boolean }
export interface Rules { win: number; draw: number; loss: number; criteria: Criterion[]; leagueLegs: 1|2; cupLegs: 1|2; finalSingle: boolean; thirdPlace: boolean; qualifiers: number }
export interface Tournament { groups?:TournamentGroup[]; groupQualifiers?:number; setup?:TournamentSetup; retired?:ID[]; id: ID; name: string; gameId: ID; date: string; season: string; players: ID[]; format: Format; manual: boolean; rules: Rules; listId?: ID; assignment: 'fijo'|'manual'|'aleatorio'; fixedTeams: Record<ID,ID>; seeds?: ID[]; leagueOrder?: ID[]; champion?: ID; runnerUp?: ID; status: 'activo'|'finalizado' }
export interface Score { home: number; away: number; extraHome: number; extraAway: number; penaltiesHome?: number; penaltiesAway?: number; manualWinner?: ID }
export interface Match { groupId?:string; id: ID; gameId: ID; tournamentId?: ID; phase: 'amistoso'|'liga'|'copa'|'tercero'; round: number; order: number; home: ID; away: ID; homeTeam?: ID; awayTeam?: ID; date: string; status: 'pendiente'|'finalizado'|'cancelado'; score?: Score; winner?: ID; official: boolean; tieId?: string; leg: 1|2; createdAt: string; updatedAt: string }
export interface State { version: 1; players: Player[]; games: Game[]; teams: Team[]; lists: TeamList[]; tournaments: Tournament[]; matches: Match[]; settings: {teamListPresets?: string[]; animations: boolean; playerPresets: {name: string; ids: ID[]}[]} }
export interface Standing { playerId: ID; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; points: number; rank: number; tied: boolean }
export const defaultRules: Rules = { win:3, draw:1, loss:0, criteria:['points','gd','gf','w'], leagueLegs:1, cupLegs:1, finalSingle:true, thirdPlace:false, qualifiers:4 };
export function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
let idFactory: (()=>string)|undefined;
export function configureIds(factory:()=>string){idFactory=factory;}
export function uid(): ID { return idFactory?idFactory():globalThis.crypto.randomUUID(); }
export function initialState(): State { return {version:1,players:['Alva','Rusio','Maiky','Lucho','Román','Ken'].map((name,i)=>({id:`player-${i+1}`,name,alias:'',color:['#B8FF65','#57C7FF','#FFB35C','#A99BFF','#FF749C','#69E2C2'][i]!,active:true,createdAt:new Date().toISOString()})),games:[{id:'pes6',name:'PES 6'},{id:'ef25',name:'eFootball 2025'},{id:'fc26',name:'EA Sports FC 26'}],teams:[],lists:[],tournaments:[],matches:[],settings:{animations:true,playerPresets:[]}}; }
