import {guardianPhone} from './guardian-contact.mjs';
export function personalWhatsAppUrl(phone='',message='',mobile=false){
 if(!phone)return 'https://web.whatsapp.com/';
 const normalized=guardianPhone(phone);if(!normalized)return '';
 return mobile?'https://wa.me/'+normalized+'?text='+encodeURIComponent(message):'https://web.whatsapp.com/send?phone='+normalized+'&text='+encodeURIComponent(message);
}
export function createWhatsAppLauncher(openWindow){
 let account=null;
 return {open(url){if(!/^https:\/\/(web\.whatsapp\.com|wa\.me)\//.test(url))return false;
  try{if(account&&!account.closed){account.location.href=url;account.focus();return true}}catch{account=null}
  account=openWindow(url,'gheras-personal-whatsapp');if(!account)return false;
  try{account.opener=null;account.focus()}catch{}return true;
 }};
}
