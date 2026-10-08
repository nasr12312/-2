// Section batches include every active student in that section, even when a
// single-student preview or search filter is selected elsewhere on the page.
export function weeklyReportRoster(students,scope,classId=0,filtered=[]){
 const active=students.filter(s=>s.active!==false);
 if(scope==='all')return active;
 if(scope==='class')return classId?active.filter(s=>s.classId===classId):[];
 const ids=new Set(filtered.map(s=>s.id));return active.filter(s=>ids.has(s.id));
}
