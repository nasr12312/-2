export const levels=['متفوق','جيد جدًا','جيد','يحتاج متابعة','يحتاج دعمًا مكثفًا'];
export const levelDescriptions=['إتقان المقرر باستقلالية','أداء جيد مع تردد بسيط','أداء مقبول مع بعض التوجيه','يحتاج مراجعة وتثبيت المقرر','يحتاج مساندة وتدرّب إضافي'];
const legacyGrades={'متقدم':'جيد جدًا','متمكن':'جيد','غير مجتاز':'يحتاج متابعة','إعادة التقييم':'يحتاج دعمًا مكثفًا'};
export const gradeLabel=grade=>legacyGrades[grade]||grade;
export const roleNames={teacher:'معلم',supervisor:'مشرف تربوي',parent:'ولي أمر',admin:'مدير المنصة',principal:'مدير المدرسة',student:'طالب'};
export const evaluationKey=(student,week,day,track='الحفظ')=>`${student}-${week}-${day}-${track}`;
export function visibleStudents(user,students){if(['admin','principal','supervisor'].includes(user.role))return students;if(user.role==='teacher')return students.filter(s=>user.classIds.includes(s.classId));return students.filter(s=>user.studentIds.includes(s.id));}
export function dailyRange(from,to,day,days=5){if(!from)return 'مراجعة وتثبيت';const length=to-from+1;const start=from+Math.floor(length*day/days);const end=from+Math.floor(length*(day+1)/days)-1;return `${start}–${end}`;}
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function attendanceRate(rows){if(!rows.length)return 0;return Math.round(rows.filter(a=>['حاضر','متأخر','مستأذن'].includes(a.status)).length/rows.length*100);}
export function gradeQuiz(questions,answers){return questions.reduce((n,q)=>n+(String(answers[q.id]??'').trim()===q.answer.trim()?1:0),0);}
