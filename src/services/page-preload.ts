// Warm only the page the user points to, without starting database requests.
const cached=new Map<string,Promise<unknown>>();
export function preloadSchoolPage(page:string){
 const loaders:Record<string,()=>Promise<unknown>>={
  quran:()=>import('../pages/SchoolQuran'),memorization:()=>import('../pages/SchoolQuran'),recitation:()=>import('../pages/SchoolQuran'),
  messages:()=>import('../pages/SchoolCommunication'),parents:()=>import('../pages/FamilyFollowups'),
  students:()=>import('../pages/TeacherWorkspace'),management:()=>import('../pages/TeacherWorkspace'),
  reports:()=>import('../pages/SchoolReports'),homework:()=>import('../pages/SchoolHomework'),
  dashboard:()=>import('../pages/SchoolPages'),review:()=>import('../pages/SchoolPages'),plans:()=>import('../pages/SchoolPlans'),
  leaderboard:()=>import('../pages/SchoolPages'),notifications:()=>import('../pages/SchoolPages'),
  reader:()=>import('../pages/Maqraa'),certificates:()=>import('../pages/SchoolCertificates')
 };
 if(!cached.has(page)&&loaders[page])cached.set(page,loaders[page]().catch(()=>{cached.delete(page)}));
}
