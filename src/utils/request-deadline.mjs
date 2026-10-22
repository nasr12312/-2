export async function withRequestDeadline(run,{timeoutMs=20000,signal:upstream}={}){
 const controller=new AbortController();let timer,rejectDeadline;
 const stopped=new Promise((_,reject)=>{rejectDeadline=reject});
 const stop=error=>{if(controller.signal.aborted)return;controller.abort(error);rejectDeadline(error)};
 const abort=()=>stop(upstream?.reason||Object.assign(new Error('Request aborted'),{code:'request_aborted'}));
 timer=setTimeout(()=>stop(Object.assign(new Error('Request confirmation timed out'),{code:'request_timeout'})),timeoutMs);
 upstream?.addEventListener('abort',abort,{once:true});if(upstream?.aborted)abort();
 try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw controller.signal.reason;return run(controller.signal)}),stopped])}
 finally{clearTimeout(timer);upstream?.removeEventListener('abort',abort)}
}
export function deadlineFetch(fetcher,timeoutMs=25000){return (input,init)=>withRequestDeadline(signal=>fetcher(input,{...init,signal}),{timeoutMs,signal:init?.signal||input?.signal})}
export function evaluationErrorMessage(error,action='الحفظ'){
 const code=error?.code||'',message=String(error?.message||'');
 if(code==='request_timeout'||/abort|timeout|timed out/i.test(message))return 'انتهت مهلة تأكيد '+action+'. بقيت بياناتك في البطاقة؛ حدّث السجل للتحقق ثم أعد المحاولة.';
 if(code==='42501')return 'لا توجد صلاحية لهذا الإجراء على الطالب. حدّث شعبك أو تواصل مع المشرف.';
 if(code==='23505')return 'تعارض مع سجل محفوظ. حدّث السجل ثم عدّل تقييم اليوم نفسه.';
 if(code==='PGRST116')return 'لم يُعثر على السجل أو تعذر تأكيد الإجراء. حدّث قائمة التقييمات.';
 if(['PGRST301','PGRST303','401'].includes(code))return 'انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أعد المحاولة.';
 if(code==='23514')return 'راجع التقدير واليوم والآيات المدخلة ثم أعد الحفظ.';
 if(message==='راجع السورة ونطاق الآيات وموضع الوصول.')return 'صحّح السورة والآيات في السجل السابق، ثم احفظ التقييم مجددًا.';
 return 'تعذر تأكيد '+action+'. بقيت بياناتك في البطاقة؛ تحقق من الاتصال وأعد المحاولة.';
}
