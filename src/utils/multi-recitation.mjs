const prefix='مقاطع التسميع: ';
export function multiAssignment(segments,surahs){
 if(!segments.length||segments.length>20)return '';
 const clean=[];
 for(const row of segments){const s=surahs.find(s=>s.id===row.surahId);if(!s||!Number.isInteger(row.from)||!Number.isInteger(row.to)||row.from<1||row.to<row.from||row.to>s.ayahs)return '';const item={surahId:s.id,surah:s.name,from:row.from,to:row.to,complete:row.from===1&&row.to===s.ayahs,recommendation:String(row.recommendation||'').trim().slice(0,300)};if(clean.some(r=>r.surahId===item.surahId&&r.from===item.from&&r.to===item.to))return '';clean.push(item)}
 return prefix+JSON.stringify(clean);
}
export function parseMultiAssignment(value){try{if(!value.startsWith(prefix))return [];const rows=JSON.parse(value.slice(prefix.length));return Array.isArray(rows)&&rows.length<=20&&rows.every(r=>Number.isInteger(r.surahId)&&typeof r.surah==='string'&&Number.isInteger(r.from)&&Number.isInteger(r.to)&&r.from>=1&&r.to>=r.from&&typeof r.recommendation==='string')?rows:[]}catch{return []}}
export function multiAssignmentText(value){return parseMultiAssignment(value).map((s,i)=>(i+1)+'. سورة '+s.surah+' • '+(s.complete?'السورة كاملة':'الآيات '+s.from+'–'+s.to)+(s.recommendation?'\nالتوصية: '+s.recommendation:'')).join('\n')}
export function segmentsFromNotes(notes=''){return parseMultiAssignment(notes.split('\n')[1]?.replace(/^المقرر الفعلي: /,'')||'')}
export function humanizeRecitationText(text=''){return String(text??'').replace(/المقرر الفعلي: (مقاطع التسميع: [^\n]+)/g,(_,value)=>'السور والمقاطع التي سُمّعت:\n'+(multiAssignmentText(value)||'يرجى مراجعة المعلم لتوضيح المقاطع.'))}

