import type {QuranEvaluation} from '../types';
export function followupNotes(existing:string|undefined,input:{mode:string;assignment:string;note:string;assignmentChanged?:boolean},surahs:{id:number;name:string;ayahs:number}[]):string;
export function studentFollowupHistory(records:QuranEvaluation[],studentId:number,dateOf:(row:QuranEvaluation)=>string):QuranEvaluation[];
export function followupEditTarget(rows:QuranEvaluation[],scope:{id:string;studentId:number;week:number;day:number;track:string}):QuranEvaluation|null;
export function followupPassage(surahId:number,from:number,to:number,surahs:{id:number;name:string;ayahs:number}[]):string;
export function followupLabel(mode:string):string;
