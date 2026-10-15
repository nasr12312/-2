export const recitationStatuses=['لم يسمّع','لا يوجد تسميع اليوم','غائب اليوم'];
export function isRecitationStatus(e){return recitationStatuses.includes(e?.grade)}
export function numericEvaluationScore(e){const n=e?.scores?.[0];return !isRecitationStatus(e)&&Number.isFinite(n)&&n>=1&&n<=5?n:null}
export function conciseAssignment(text=''){return text.replace(/سورة (.+?) • وصل إلى الآية (\d+) \(من بداية السورة\)(?: • أتم السورة كاملة)?/g,(_,name,ayah)=>name+' حتى الآية '+ayah)}
export function conciseCheckpoint(text=''){return text.startsWith('مراجعة وتثبيت عند الموضع')?'مراجعة وتثبيت.':text.startsWith('مراجعة عند موضع')?'مراجعة مقطع سابق.':text.startsWith('موضع مسجل حتى الآية')?'الموضع الحالي للطالب.':text.replace('الجديد في هذه المتابعة: من الآية ','الجديد: الآيات ').replace(' إلى الآية ','–')}
