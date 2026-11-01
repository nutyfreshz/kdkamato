// KDKAMATO Success Journey. Read-only, evidence-based transformation.
export type CheckIn={entry_date:string;body_weight_kg:number|null;training_completed:boolean|null;training_status:string|null;recovery_status:string|null;training_adherence_status:string|null;nutrition_adherence_status:string|null;new_issue:boolean|null};
export type Log={log_id:string;entry_date:string;exercise_key:string;set_entries:unknown;control_status:string|null;issue_status:string|null};
export type Exercise={exercise_key:string;metadata:{display_name?:string}|null};
export type JourneyData={today:string;goal:string;daysPerWeek:number|null;plannedMinutes:number|null;programVersion:number|null;checkins:CheckIn[];logs:Log[];exercises:Exercise[];historyAvailable:boolean};
export type Point={date:string;value:number;label:string};
export type Lift={key:string;name:string;first:Point;last:Point;firstReps:number;lastReps:number;history:{date:string;load:number;reps:number}[];outcome:string};
const shift=(day:string,delta:number)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
const fmt=(n:number)=>String(Math.round(n*10)/10);
const recovery:Record<string,number>={POOR:1,OK:2,GOOD:3};
const words:Record<string,string>={POOR:'ฟื้นไม่ดี',OK:'พอใช้',GOOD:'ดี',BETTER:'ดีขึ้น',SAME:'ใกล้เคียงเดิม',WORSE:'แย่ลง'};
function firstSet(v:unknown){if(!Array.isArray(v))return null;const s=v.find((x:any)=>Number(x?.set)===1)||v[0];if(!s||s.load_kg==null||s.reps==null)return null;const load=Number(s.load_kg),reps=Number(s.reps);if(!Number.isFinite(load)||load<0||!Number.isInteger(reps)||reps<1)return null;return {load,reps};}
export function buildJourney(d:JourneyData){
const begin=shift(d.today,-27);
const checks=d.checkins.filter(x=>x.entry_date>=begin&&x.entry_date<=d.today).slice().sort((a,b)=>a.entry_date.localeCompare(b.entry_date));
const logs=d.historyAvailable?d.logs.filter(x=>x.entry_date>=begin&&x.entry_date<=d.today).slice().sort((a,b)=>a.entry_date.localeCompare(b.entry_date)||a.log_id.localeCompare(b.log_id)):[];
const weights:Point[]=checks.filter(x=>x.body_weight_kg!=null&&Number.isFinite(Number(x.body_weight_kg))).map(x=>({date:x.entry_date,value:Number(x.body_weight_kg),label:fmt(Number(x.body_weight_kg))+' กก.'}));
const first=weights[0],last=weights[weights.length-1];
const weight=weights.length>=2?{first,last,delta:Math.round((last.value-first.value)*10)/10}:null;
const loggedDates=new Set(logs.map(x=>x.entry_date));
const recoveryPoints:Point[]=checks.filter(x=>x.recovery_status&&recovery[x.recovery_status]).map(x=>({date:x.entry_date,value:recovery[x.recovery_status!],label:words[x.recovery_status!]||x.recovery_status!}));
const trainingPoints:Point[]=checks.filter(x=>x.training_status&&words[x.training_status]).map(x=>({date:x.entry_date,value:({WORSE:1,SAME:2,BETTER:3} as Record<string,number>)[x.training_status!]||0,label:words[x.training_status!]||x.training_status!}));
const exNames=new Map(d.exercises.map(x=>[x.exercise_key,x.metadata?.display_name||x.exercise_key]));
const exerciseData=new Map<string,Map<string,{date:string;load:number;reps:number}>>();
for(const log of logs){const s=firstSet(log.set_entries);if(!s||!exNames.has(log.exercise_key))continue;const perDay=exerciseData.get(log.exercise_key)||new Map();if(!perDay.has(log.entry_date))perDay.set(log.entry_date,{date:log.entry_date,...s});exerciseData.set(log.exercise_key,perDay);}
const lifts:Lift[]=[];
for(const [key,map] of exerciseData){const history=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));if(history.length<2)continue;const a=history[0],b=history[history.length-1],loadDiff=b.load-a.load,repDiff=b.reps-a.reps;const outcome=loadDiff>0&&repDiff>=0||loadDiff>=0&&repDiff>0?'UP':loadDiff===0&&repDiff===0?'SAME':'MIXED';lifts.push({key,name:exNames.get(key)||key,first:{date:a.date,value:a.load,label:fmt(a.load)+' กก. × '+a.reps},last:{date:b.date,value:b.load,label:fmt(b.load)+' กก. × '+b.reps},firstReps:a.reps,lastReps:b.reps,history,outcome});}
lifts.sort((a,b)=>Number(b.outcome==='UP')-Number(a.outcome==='UP')||b.history.length-a.history.length);
const weeks=Array.from({length:4},(_,i)=>{const start=shift(begin,i*7),end=shift(start,6),weeklyLogs=logs.filter(x=>x.entry_date>=start&&x.entry_date<=end);return {start,end,days:new Set(weeklyLogs.map(x=>x.entry_date)).size,checkins:checks.filter(x=>x.entry_date>=start&&x.entry_date<=end).length}});
const poor=checks.slice(-3).filter(x=>x.recovery_status==='POOR').length>=2,positiveLift=lifts.find(x=>x.outcome==='UP');
let state:'IMPROVING'|'MIXED'|'INSUFFICIENT'|'REVIEW'='INSUFFICIENT',heading='ข้อมูลกำลังเริ่มเล่าเรื่องของคุณ',detail='บันทึกต่ออีกระยะเพื่อให้เห็นแนวโน้มที่ตรวจสอบได้',main='—',unit='หลักฐานยังไม่พอ';
if(poor){state='REVIEW';heading='ตอนนี้ควรดูการฟื้นตัวก่อน';detail='การเช็กอินล่าสุดรายงานว่าฟื้นตัวไม่ดีซ้ำ';main='REVIEW';unit='Recovery';}
else if(d.goal==='FAT_LOSS'&&weight&&weight.delta<0){state='IMPROVING';heading='น้ำหนักกำลังเคลื่อนตามเป้าหมาย';detail='น้ำหนักที่บันทึกลดลง ไม่ใช่การยืนยันว่าไขมันลด';main=fmt(weight.delta);unit='กก. จากจุดแรกถึงล่าสุด';}
else if(d.goal==='MUSCLE_GAIN'&&recoveryPoints.length>=2&&recoveryPoints[0].value===1&&recoveryPoints[recoveryPoints.length-1].value===3){state='IMPROVING';heading='การฟื้นตัวที่รายงานดีขึ้น';detail='จากฟื้นไม่ดีเป็นฟื้นตัวดี ยังไม่ใช่หลักฐานว่าหลุด Plateau';main='ดีขึ้น';unit='Recovery · รายงานตนเอง';}
else if((d.goal==='MUSCLE_GAIN'||d.goal==='RECOMPOSITION')&&positiveLift){state='IMPROVING';heading=d.goal==='MUSCLE_GAIN'?'ท่าฝึกบางท่าเริ่มทำได้มากขึ้น':'ผลการฝึกดีขึ้น แม้น้ำหนักอาจใกล้เดิม';detail='เปรียบเทียบเซตแรกของท่าเดิม ไม่ได้ยืนยันการเติบโตของกล้ามเนื้อ';main=fmt(positiveLift.last.value-positiveLift.first.value);unit='กก. · โหลดเซตแรก';}
else if(d.goal==='GENERAL_FITNESS'&&loggedDates.size>=2){state='IMPROVING';heading='มีประวัติการฝึกต่อเนื่อง';detail='พบ Workout Log ในหลายวัน ไม่ใช่จำนวนเซสชันที่ยืนยันแล้ว';main=String(loggedDates.size);unit='วันที่มี Workout Log';}
else if(weights.length>=2||loggedDates.size>=2||recoveryPoints.length>=2){state='MIXED';heading='เริ่มเห็นแนวโน้ม แต่ยังควรติดตาม';detail='ข้อมูลบางด้านยังไม่สอดคล้องพอให้สรุปว่าไปถูกทาง';if(weight){main=(weight.delta>0?'+':'')+fmt(weight.delta);unit='กก. ที่บันทึก';}}
const proof:string[]=[];
if(weight)proof.push('น้ำหนัก '+fmt(weight.first.value)+' → '+fmt(weight.last.value)+' กก. ('+weight.first.date+' ถึง '+weight.last.date+')');
if(d.historyAvailable)proof.push('Workout Log '+logs.length+' รายการ ใน '+loggedDates.size+' วัน ไม่เท่ากับจำนวนเซสชัน');
else proof.push('ระบบอ่านประวัติ Workout Log ยังไม่พร้อม จึงไม่สรุปพัฒนาการรายท่า');
if(positiveLift)proof.push(positiveLift.name+': '+positiveLift.first.label+' → '+positiveLift.last.label);
else if(recoveryPoints.length>=2)proof.push('Recovery ที่รายงาน: '+recoveryPoints[0].label+' → '+recoveryPoints[recoveryPoints.length-1].label);
if(!proof.length)proof.push('ยังไม่มีข้อมูลเพียงพอสำหรับเปรียบเทียบใน 28 วัน');
const limits=['น้ำหนักเปลี่ยนไม่ได้ยืนยันว่าไขมันหรือกล้ามเนื้อเปลี่ยน'];
if(!d.historyAvailable)limits.unshift('ยังอ่าน Workout History ไม่ได้; ไม่แสดงแนวโน้มความแข็งแรง');
if(weights.length<2)limits.push('น้ำหนักมีน้อยกว่า 2 จุด ไม่คำนวณแนวโน้ม');
if(d.goal==='RECOMPOSITION')limits.push('ไม่สามารถยืนยัน Recomposition หากไม่มีข้อมูลองค์ประกอบร่างกาย');
if(d.plannedMinutes)limits.push(d.plannedMinutes+' นาทีเป็นเวลาตามแผน ไม่ใช่เวลาฝึกจริง');
const next=poor?['ลดความเร่งของการเพิ่มน้ำหนักฝึกขณะฟื้นตัวไม่ดี','บันทึก Recovery หลังการฝึกครั้งถัดไป','พิจารณาพักหรือทบทวนโปรแกรมหากยังแย่ต่อเนื่อง']:['บันทึกเซตแรกของท่าหลักหลังฝึก','เช็กอินน้ำหนักหรือการฟื้นตัวตามสะดวก','ติดตามแนวโน้มต่อก่อนปรับแผน'];
return {state,heading,detail,main,unit,weights,recoveryPoints,trainingPoints,lifts:lifts.slice(0,4),weeks,proof,limits,next,checkinCount:checks.length,loggedDays:loggedDates.size,reportedSessions:checks.filter(x=>x.training_completed===true).length,logs,checks};
}