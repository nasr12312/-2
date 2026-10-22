export function withRequestDeadline<T>(run:(signal:AbortSignal)=>PromiseLike<T>,options?:{timeoutMs?:number;signal?:AbortSignal|null}):Promise<T>;
export function deadlineFetch(fetcher:typeof fetch,timeoutMs?:number):typeof fetch;
export function evaluationErrorMessage(error:unknown,action?:string):string;
