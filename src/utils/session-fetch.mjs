// A stale screen must never submit student data as the public API role.
export function sessionFetch(fetcher,baseUrl,publicKey,onExpired=()=>{}){
 const origin=new URL(baseUrl).origin;
 return async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  const headers=new Headers(init?.headers||(typeof input==='object'&&'headers' in input?input.headers:undefined));
  const method=String(init?.method||(typeof input==='object'&&'method' in input?input.method:'GET')).toUpperCase();
  const publicRead=method==='GET'&&url.pathname==='/rest/v1/platform_presentation';
  const protectedRequest=url.origin===origin&&url.pathname.startsWith('/rest/v1/')&&!publicRead;
  const token=(headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const expired=()=>{onExpired();return new Response(JSON.stringify({code:'session_expired',message:'انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أعد المحاولة.'}),{status:401,headers:{'content-type':'application/json'}})};
  if(protectedRequest&&(!token||token===publicKey))return expired();
  const response=await fetcher(input,init);
  if(protectedRequest&&response.status===401)onExpired();
  return response;
 };
}
