const digits=value=>value.replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).trim();
export function parseStudentBatch(text){
 const source=text.replace(/^\uFEFF/,'');const delimiter=source.includes('\t')?'\t':source.split('\n')[0].includes(';')?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&(c===delimiter||c==='\n')){row.push(cell.trim());cell='';if(c==='\n'){rows.push(row);row=[]}}else if(c!=='\r')cell+=c;}
 if(quoted)throw Error('علامات الاقتباس غير مكتملة في الملف');row.push(cell.trim());rows.push(row);
 const data=rows.filter(r=>r.some(Boolean));if(data.length&&/الاسم|اسم الطالب/.test(data[0][0]))data.shift();
 if(!data.length||data.length>200)throw Error('أدخل من 1 إلى 200 طالب في الدفعة');
 const numbers=new Set(),names=new Set();
 return data.map((values,index)=>{const name=values[0].replace(/\s+/g,' ').trim(),number=digits(values[1]||'');let error='';
 if(values.length>2)error='القالب يتكون من عمودين فقط: الاسم والرقم';
 else if(name.length<3||name.length>150)error='راجع اسم الطالب';else if(number&&!/^\d{10}$/.test(number))error='رقم الدخول يجب أن يكون 10 أرقام كاملة';
 else if(number&&numbers.has(number))error='الرقم مكرر في الدفعة';else if(!number&&names.has(name))error='الاسم دون رقم مكرر في الدفعة';
 if(number)numbers.add(number);names.add(name);return {line:index+1,name,number,error};});
}
export function studentBatchConflict(row,students,classroom){
 const match=row.number?students.find(s=>s.national_id===row.number&&s.program_id===classroom.program_id):students.find(s=>s.full_name.trim()===row.name&&s.class_id===classroom.id);
 return match?'يوجد تسجيل مطابق في هذا المسار؛ استخدم النقل أو التعديل بدل إضافته مجددًا':'';
}
