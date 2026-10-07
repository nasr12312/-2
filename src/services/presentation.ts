import {supabase} from './supabase';
import {welcomeDefault,type WelcomeConfig} from '../data/welcome';
export async function getPresentation():Promise<WelcomeConfig>{
 if(!supabase)return {...welcomeDefault};
 const {data,error}=await supabase.from('platform_presentation').select('*').eq('id',true).single();
 if(error||!data)throw Error('تعذر تحميل إعدادات الواجهة');
 return {...welcomeDefault,...data};
}
