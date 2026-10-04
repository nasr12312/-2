import {supabase} from './supabase';
export async function manageTeacher(action:string,input:Record<string,unknown>={}){
 if(!supabase)throw Error('قاعدة البيانات غير متاحة');
 const {data,error}=await supabase.functions.invoke('teacher-management',{body:{action,...input}});
 if(error){let message='تعذر تنفيذ الطلب';try{const response=(error as {context?:Response}).context;if(response)message=(await response.json()).error||message}catch{}throw Error(message)}
 if(data?.error)throw Error(data.error);return data;
}
export const numericCode=(value:string)=>value.replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g,'');
