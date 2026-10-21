import {createWhatsAppLauncher,personalWhatsAppUrl} from '../utils/personal-whatsapp.mjs';
const launcher=createWhatsAppLauncher((url,target)=>window.open(url,target));
export function openPersonalWhatsApp(phone='',message=''){
 return launcher.open(personalWhatsAppUrl(phone,message,/Android|iPhone|iPad/i.test(navigator.userAgent)));
}
