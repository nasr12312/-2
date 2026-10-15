export const recitationStatuses:string[];
export function recitationStatusLabel(grade?:string):string;
export function recitationStatusTargets(students:import('../types').Student[],evaluations:import('../types').QuranEvaluation[],options:{week:number;day:number;track:string;status:string;bulk?:boolean}):import('../types').Student[];
export function isRecitationStatus(e:{grade?:string}|null|undefined):boolean;
export function numericEvaluationScore(e:{grade?:string;scores?:number[]}):number|null;
export function conciseAssignment(text?:string):string;
export function conciseCheckpoint(text?:string):string;
