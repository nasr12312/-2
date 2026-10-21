export type DailyPreset={entryId:string;assignment?:string;oneClick:boolean;autoNext:boolean};
export function dailyEvaluationKey(teacher:string,classId:string,week:number,day:number,track:string):string;
export function dailyPreset(value?:Partial<DailyPreset>):DailyPreset;
export function nextUnassessedStudent<T extends {id:number}>(roster:T[],currentId:number,assessed:(student:T)=>unknown):number|null;
