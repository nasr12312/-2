import type {QuranEvaluation} from '../types';
export function quickDailyIndex(records:QuranEvaluation[],scope:{week:number;day:number;track:string}):{latest:Map<number,QuranEvaluation>;graded:Map<number,QuranEvaluation>};
