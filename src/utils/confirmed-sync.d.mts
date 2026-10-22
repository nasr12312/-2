export function syncErrorMessage(error:unknown):string;
export function recordingEvaluationSlot(submission:Pick<import('../types').RecitationSubmission,'id'|'studentId'|'track'>&{evaluatedAt?:string},evaluations:import('../types').QuranEvaluation[],termStartDate?:string,date?:string):{track:string;weekId:number;day:number};
export function sameRemoteEvaluation(row:Record<string,unknown>|undefined,payload:Record<string,unknown>):boolean;
export function createConfirmedSync<T>(callbacks:{persist:(job:T)=>Promise<void>;commit:(job:T)=>void;onFailure:(error:unknown)=>void;onState?:(busy:boolean)=>void}):{submit:(job:T)=>Promise<boolean>;retry:()=>Promise<boolean>;clear:()=>void;hasPending:()=>boolean;isRunning:()=>boolean};
export function mergeConfirmedChanges<T>(current:T,before:T,after:T):T;
