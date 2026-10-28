const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unique=values=>[...new Set(values.map(value=>String(value??'').trim()).filter(Boolean))].join('\n');
const baseTrack=record=>record.track.split(' • ')[0];
const dayLabel=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)?new Intl.DateTimeFormat('ar',{weekday:'long',timeZone:'Asia/Riyadh'}).format(new Date(date+'T12:00:00Z'))+'\n'+date:date;

// Keep each lesson once, with its assignment separate from the teacher's notes.
export function conciseStudentReport(student,school,logo,draft){
 const safeLogo=/^(https:\/\/|data:image\/jpeg;base64,)/.test(logo)?logo:'https://gherasquran.com/gheras-logo.png';
 const records=draft.records||[],days=new Map();
 if(draft.fromDate&&draft.toDate){
  const start=new Date(draft.fromDate+'T12:00:00Z'),end=new Date(draft.toDate+'T12:00:00Z');
  // Blank school days are useful in a weekly form, without implying absence.
  if(end-start<=6*86400000)for(const current=new Date(start);current<=end;current.setUTCDate(current.getUTCDate()+1)){
   if(current.getUTCDay()<5)days.set(current.toISOString().slice(0,10),[]);
  }
 }
 let lastDate='';
 for(const record of records){const date=record.date||lastDate;lastDate=date;if(!days.has(date))days.set(date,[]);days.get(date).push(record)}
 const dailyRows=[...days].sort(([a],[b])=>a.localeCompare(b)).flatMap(([date,rows])=>{
  if(!rows.length)return ['<tr>'+[dayLabel(date),'—','لم يُسجّل تسميع','—'].map(value=>'<td>'+escape(value)+'</td>').join('')+'</tr>'];
  return rows.map((r,index)=>{
   const track=[r.enrollment,baseTrack(r)].filter(Boolean).join(' • ');
   const required=r.required||'غير مسجّل';
   const reached=r.status?'—':r.reached??r.assignment??'غير مسجّل';
   const note=r.simpleNote??unique([r.grade,r.notes??r.feedback,r.nextStep]);
   const values=[index===0?dayLabel(date):'',(track?track+': ':'')+required,reached,note];
   return '<tr>'+values.map(value=>'<td>'+escape(value||'—')+'</td>').join('')+'</tr>';
  });
 }).join('');
 const note=unique([draft.summary,draft.academicNotes,draft.recommendation]);
 const date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Riyadh'});
 const period=draft.fromDate&&draft.toDate?'من تاريخ: '+draft.fromDate+'   إلى: '+draft.toDate:draft.periodLabel||'—';
 return `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(draft.title)}</title><style>
 *{box-sizing:border-box}body{font:13px Tahoma,Arial,sans-serif;line-height:1.7;color:#203d32;background:#f1f4f2;margin:0;padding:20px}article{max-width:794px;margin:auto;background:#fff;padding:26px;border:1px solid #d5dfd7}header{display:flex;align-items:center;gap:18px;padding-bottom:12px;border-bottom:2px solid #3c765b}header img{width:110px;max-height:85px;object-fit:contain}header p{margin:0}h1{font-size:21px;margin:3px 0}h2{font-size:15px;margin:16px 0 7px}p{white-space:pre-line;margin:6px 0}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}th,td{border:1px solid #ccd8d0;padding:8px;text-align:right;vertical-align:top;white-space:pre-line;overflow-wrap:anywhere}th{background:#edf4ef;font-weight:bold}.report-meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin:14px 0}.report-meta p{margin:0}.simple-recitation-log th:nth-child(1){width:16%}.simple-recitation-log th:nth-child(2){width:28%}.simple-recitation-log th:nth-child(3){width:28%}.simple-recitation-log th:nth-child(4){width:28%}.home-followup{border:1px solid #ccd8d0;padding:8px 12px}.home-followup p+p{border-top:1px solid #e3e9e5;padding-top:6px}footer{display:flex;justify-content:space-between;gap:18px;border-top:1px solid #ccd8d0;margin-top:16px;padding-top:8px;font-size:12px}.print-control{display:block;margin:0 auto 16px;padding:10px 20px;border:0;background:#285b43;color:white;cursor:pointer}@page{size:A4;margin:12mm}@media print{body{padding:0;background:white}article{border:0;padding:0}.print-control{display:none}tr,header,.report-meta,.home-followup,footer{break-inside:avoid}thead{display:table-header-group}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
 </style><button class="print-control" onclick="window.print()">طباعة التقرير أو حفظه PDF</button><article class="concise-report"><header><img src="${escape(safeLogo)}" alt="شعار المدرسة"><div><p>${escape(school)}</p><h1>${escape(draft.title)}</h1></div></header>
 <div class="report-meta"><p><b>اسم الطالب:</b> ${escape(student.name)}</p><p><b>الصف / الشعبة:</b> ${escape(student.className)}</p><p><b>الأسبوع / الفترة:</b> ${escape(draft.weekLabel||draft.periodLabel||'—')}</p><p>${escape(period)}</p></div>
 <h2>${draft.weekLabel?'سجل التسميع خلال الأسبوع':'سجل التسميع خلال الفترة'}</h2><table class="recitation-log simple-recitation-log"><thead><tr><th>اليوم</th><th>المقرر المطلوب</th><th>أين وصل الطالب</th><th>ملاحظة بسيطة</th></tr></thead><tbody>${dailyRows||'<tr><td colspan="4">لا يوجد تقييم محفوظ لهذه الفترة.</td></tr>'}</tbody></table>
 ${note?`<p class="report-note"><b>ملاحظة:</b> ${escape(note)}</p>`:''}
 <footer><span>معلم القرآن الكريم: ${escape(draft.teacher)}</span><span>تاريخ التقرير: ${date}</span></footer></article></html>`;
}
