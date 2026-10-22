export function reportReadiness({phone,report,hasEvaluations}){
 if(!phone)return {ready:false,state:'phone',label:'يحتاج رقم ولي أمر'};
 if(report)return {ready:true,state:'ready',label:'نسخة تقرير محفوظة'};
 if(hasEvaluations)return {ready:true,state:'ready',label:'التقييمات محفوظة • يُجهز التقرير عند الإرسال'};
 return {ready:false,state:'report',label:'لا توجد تقييمات محفوظة بعد'};
}
