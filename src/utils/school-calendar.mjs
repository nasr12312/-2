import {academicFocus} from './academic-dates.mjs';
export const schoolDays=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
export function riyadhDate(value=new Date().toISOString()){return new Date(value).toLocaleDateString('sv-SE',{timeZone:'Asia/Riyadh'})}
export function calendarFocus(start='2026-08-23',value=riyadhDate()){const date=riyadhDate(value.length===10?value+'T12:00:00Z':value);const focus=academicFocus(date,start);return {date,...focus,dayName:schoolDays[focus.day]}}
export function dayIndex(text){const n=text.replace(/[أإآ]/g,'ا');return schoolDays.findIndex(d=>n.includes(d.replace(/[أإآ]/g,'ا')))}
const phrases=[
['أداء متميز في المقرر','مستوى رائع يستحق التقدير','نتيجة عالية في متابعة اليوم','إنجاز متقن في هذا التقييم','تميّز واضح في مستوى الأداء','متابعة ممتازة للمقرر'],
['أداء جيد جدًا في المقرر','نتيجة مشجعة في متابعة اليوم','مستوى قريب من الإتقان','تقدم جميل في متابعة المقرر','أداء قوي يستحق التشجيع','متابعة جيدة جدًا لهذا اليوم'],
['أداء جيد في المقرر','نتيجة جيدة يمكن البناء عليها','مستوى جيد يحتاج متابعة منتظمة','خطوة طيبة في رحلة الحفظ','متابعة جيدة مع مجال للتحسن','إنجاز جيد في تقييم اليوم'],
['المقرر يحتاج إلى مزيد من التثبيت','يحتاج الأداء إلى مراجعة إضافية','نوصي بمتابعة المقرر على أجزاء صغيرة','يحتاج هذا المقرر إلى تكرار هادئ','المتابعة المنتظمة تساعد في تحسين النتيجة','نوصي بالتركيز على تثبيت المقرر'],
['لم يتحقق المستوى المطلوب بعد','يحتاج المقرر إلى عناية ومتابعة أقرب','نوصي بخطة مراجعة قصيرة مع المعلم','يحتاج الطالب إلى دعم في هذا المقرر','نبدأ بخطوات صغيرة لتثبيت المطلوب','نوصي بتقسيم المقرر والمتابعة مع المعلم']];
export function feedbackFor(name,score,variant=0){const rank=Math.max(0,Math.min(4,5-score));const first=name.trim().split(' ')[0]||'الطالب';return {writtenFeedback:first+'، '+phrases[rank][Math.abs(variant)%6]+'.',encouragement:score>=4?'أحسنت يا '+first+'، واصل هذا الإنجاز.':'كل محاولة تقرّبك من الإتقان يا '+first+'، ونحن نساندك.',nextStep:score>=4?'حافظ على مراجعة المقرر، ثم تابع المطلوب القادم.':score===3?'راجع المقرر مرة أخرى واستمع إلى تلاوته قبل التسميع.':'قسّم المقرر إلى مقاطع قصيرة، كررها ثم أرسل تسميعًا جديدًا.'}}
export function isFollowed(evaluation,followups){return Boolean(evaluation?.id&&followups.some(f=>f.evaluation_id===evaluation.id&&Date.parse(f.evaluation_version)===Date.parse(evaluation.createdAt)))}
