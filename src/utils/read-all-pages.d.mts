export function readAllPages<T>(query:()=>{range:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>},pageSize?:number):Promise<{data:T[];error:null}>;
