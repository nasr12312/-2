import type {QuranWeek} from '../types';
export const plans:QuranWeek[]=[
 [1,'الإسراء',1,28,'يوسف',1,28],[2,'الإسراء',29,56,'يوسف',29,56],[3,'الإسراء',57,84,'يوسف',57,84],[4,'الإسراء',85,111,'يوسف',85,111],
 [5,'النحل',1,32,'هود',1,31,'إجازة اليوم الوطني'],[6,'النحل',33,64,'هود',32,62],[7,'النحل',65,96,'هود',63,93],[8,'النحل',97,128,'هود',94,123],
 [9,'الحجر',1,33,'يونس',1,36],[10,'الحجر',34,66,'يونس',37,72],[11,'الحجر',67,99,'يونس',73,109],[12,'إبراهيم',1,26,'هود',1,41],
 [13,'إبراهيم',27,52,'هود',42,82,'إجازة الخريف'],[14,'الرعد',1,22,'هود',83,123],[15,'الرعد',23,43,'يوسف',1,56],[16,'مراجعة وتثبيت الحفظ',0,0,'يوسف',57,111],[17,'مراجعة عامة',0,0,'مراجعة عامة',0,0]
].map(([id,memorization,memFrom,memTo,recitation,recFrom,recTo,holiday])=>({id:Number(id),memorization:String(memorization),memFrom:Number(memFrom),memTo:Number(memTo),recitation:String(recitation),recFrom:Number(recFrom),recTo:Number(recTo),holiday:holiday?String(holiday):undefined}));
