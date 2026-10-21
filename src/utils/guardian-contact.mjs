export function guardianPhone(value='') {
 const digits=String(value).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[\s()+-]/g,'');
 const phone=digits.startsWith('00')?digits.slice(2):/^05\d{8}$/.test(digits)?'966'+digits.slice(1):digits;
 return /^[1-9]\d{7,14}$/.test(phone)?phone:'';
}
export function safeResourceUrl(value='') {
 try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}
}
export function guardianMessage({student,school,title,summary,academic,behavioral,recommendation,records=[]}) {
 return [school,title,'ولي أمر الطالب: '+student,summary,academic&&'ملاحظات أكاديمية: '+academic,behavioral&&'ملاحظات سلوكية: '+behavioral,...records.slice(0,8).map(r=>[r.date,r.track,r.grade,r.feedback].filter(Boolean).join(' • ')),recommendation&&'المتابعة المطلوبة: '+recommendation,'للاطلاع على السجل والتقارير: https://gherasquran.com/'].filter(Boolean).join('\n\n');
}
export function whatsappReportUrl(phone,message){const normalized=guardianPhone(phone);return normalized?'https://wa.me/'+normalized+'?text='+encodeURIComponent(message):''}
