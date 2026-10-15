export function checkpointHomework(point,surahs,count=5){
 const surah=surahs.find(s=>s.id===point?.surahId);
 if(!surah||!Number.isInteger(point.ayah)||point.ayah<1||point.ayah>surah.ayahs||!Number.isInteger(count)||count<1||count>30)return null;
 const complete=point.ayah===surah.ayahs,from=complete?1:point.ayah+1,to=complete?surah.ayahs:Math.min(surah.ayahs,from+count-1),kind=complete?'مراجعة':'حفظ';
 const title=kind+' سورة '+surah.name+' • من الآية '+from+' إلى الآية '+to;
 const instructions=['آخر إنجاز محفوظ: سورة '+surah.name+' حتى الآية '+point.ayah+'.','الطالب متأخر عن خطة الشعبة؛ هذا واجبه الفردي بحسب موضعه الفعلي.',complete?'المطلوب مراجعة السورة المكتملة وتثبيتها.':'المطلوب حفظ الآيات '+from+' إلى '+to+'، مع مراجعة ما سبق.','يرجى إرسال تسجيل صوتي واضح للآيات المطلوبة من صفحة المقرأة ليقيّمه المعلم.','الضغط على «تمت المتابعة» يؤكد اطلاع الأسرة فقط؛ إرسال التسجيل لا يعني اعتماد الإنجاز حتى يقيّمه المعلم.'].join('\n');
 return {surahId:surah.id,from,to,kind,title,instructions};
}
export function homeworkRange(title,surahs){const match=title.match(/^(حفظ|مراجعة|تلاوة) سورة (.+?) • من الآية (\d+) إلى الآية (\d+)$/);if(!match)return null;const s=surahs.find(s=>s.name===match[2]),from=Number(match[3]),to=Number(match[4]);return s&&from>=1&&to>=from&&to<=s.ayahs?{surahId:s.id,from,to,track:match[1]==='تلاوة'?'التلاوة':'الحفظ'}:null}
