import {openPersonalWhatsApp} from '../services/personal-whatsapp';
import {useEffect,useState} from 'react';
import {useApp} from '../services/store';
import {supabase} from '../services/supabase';
import {guardianPhone} from '../utils/guardian-contact.mjs';
import {Button,Field,Panel} from './ui';
export default function TeacherWhatsApp(){
 const {user,notify}=useApp();const [phone,setPhone]=useState(''),[busy,setBusy]=useState(true),[error,setError]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;void supabase!.from('teacher_contact_settings').select('whatsapp_phone').eq('user_id',user!.id).maybeSingle().then(r=>{if(!active)return;if(r.error){setError('تعذر تحميل رقمك. أعد فتح الحساب.');setFailed(true)}else setPhone(r.data?.whatsapp_phone||'');setBusy(false)});return()=>{active=false}},[user?.id]);
 const save=async()=>{setError('');if(phone&&!guardianPhone(phone)){setError('أدخل رقم جوال صحيحًا مع رمز الدولة أو يبدأ بـ05 للسعودية.');return}setBusy(true);const r=await supabase!.from('teacher_contact_settings').upsert({user_id:user!.id,whatsapp_phone:phone?guardianPhone(phone):''});setBusy(false);if(r.error)setError('تعذر حفظ رقم واتساب');else notify('تم حفظ رقم واتساب حسابك')};
 return <Panel><h2>واتساب المعلم</h2><p>احفظ رقمك للتعريف بك في رسالة التقرير. تُفتح المحادثة من حساب واتساب المسجّل على جهازك؛ تأكد أنه حسابك قبل الإرسال.</p><Field label="رقم واتساب الخاص بي"><input type="tel" dir="ltr" placeholder="05xxxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>{error&&<p role="alert">{error}</p>}<Button variant="gold" disabled={busy||failed} onClick={()=>void save()}>حفظ رقم واتساب</Button><Button onClick={()=>{if(!openPersonalWhatsApp())notify('اسمح بفتح واتساب في المتصفح')}}>فتح واتساب / تسجيل حسابي</Button></Panel>
}
