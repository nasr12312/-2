// Warm only the page the user points to, without starting database requests.
const cached=new Map<string,Promise<unknown>>();
export function preloadSchoolPage(page:string){
 const loaders:Record<string,()=>Promise<unknown>>={
  achievement:()=>import('../pages/QuickDailyEvaluation'),achievementDetail:()=>import('../pages/StudentAchievements'),quran:()=>import('../pages/QuickDailyEvaluation'),memorization:()=>import('../pages/QuickDailyEvaluation'),recitation:()=>import('../pages/QuickDailyEvaluation'),revision:()=>import('../pages/QuickDailyEvaluation'),
  messages:()=>import('../pages/SchoolCommunication'),parents:()=>import('../pages/FamilyFollowups'),
  students:()=>import('../pages/TeacherWorkspace'),management:()=>import('../pages/TeacherWorkspace'),
  reportDelivery:()=>import('../pages/ReportDelivery'),reports:()=>import('../pages/SchoolReports'),homework:()=>import('../pages/SchoolHomework'),
  dashboard:()=>import('../pages/SchoolPages'),review:()=>import('../pages/SchoolPages'),plans:()=>import('../pages/SchoolPlans'),
  leaderboard:()=>import('../pages/SchoolPages'),notifications:()=>import('../pages/SchoolPages'),
  mushaf:()=>import('../pages/TeacherMushaf'),reader:()=>import('../pages/Maqraa'),certificates:()=>import('../pages/SchoolCertificates')
 };
 if(!cached.has(page)&&loaders[page])cached.set(page,loaders[page]().catch(()=>{cached.delete(page)}));
}
