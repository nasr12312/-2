export function createLatestLoad<T>(load:()=>Promise<T>,commit:(value:T)=>void):{run:()=>Promise<T>;invalidate:()=>void};
