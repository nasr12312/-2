export function createLatestLoad(load,commit){
 let generation=0,latest=null;
 const superseded=()=>{if(latest)return latest;throw Error('انتهت جلسة المزامنة. أعد تسجيل الدخول.');};
 return {
  run(){const current=++generation;
   const request=Promise.resolve().then(load).then(value=>{if(current!==generation)return superseded();commit(value);return value;},error=>{if(current!==generation)return superseded();throw error;});
   latest=request;return request;
  },
  invalidate(){generation++;latest=null;}
 };
}
