import type {QuranEvaluation} from '../types';
export function evaluationTrack(track:string):string;
export function evaluationClientKey(studentId:string,week:number,day:number,track:string):string;
export function uniqueDailyEvaluations(records:QuranEvaluation[],dateOf?:(row:QuranEvaluation)=>string):QuranEvaluation[];
