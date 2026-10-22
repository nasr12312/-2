export function cleanReportFooter(html){
 return String(html).replace(/<footer>([\s\S]*?)<\/footer>/gi,(full,content)=>'<footer>'+content.replace(/<p>النتائج من السجلات المحفوظة\.[\s\S]*?<\/p>/g,'').replace(/توقيع المعلم: \.{3,}\s*•\s*اعتماد المشرف: \.{3,}/g,'')+'</footer>');
}
