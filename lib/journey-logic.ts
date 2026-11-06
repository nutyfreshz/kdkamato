// Read-only progress evidence. A logged change is not a body composition measurement.
export type CheckIn = {entry_date:string;body_weight_kg:number|null;training_completed:boolean|null;training_status:string|null;recovery_status:string|null;training_adherence_status:string|null;nutrition_adherence_status:string|null;new_issue:boolean|null};
export type Log = {log_id:string;entry_date:string;program_id?:string;item_id?:string;exercise_key:string;set_entries:unknown;control_status:string|null;issue_status:string|null};
export type Exercise = {item_id?:string;training_day?:number;sets?:number;exercise_key:string;metadata:{display_name?:string}|null};
export type JourneyData = {today:string;windowDays?:number;nutrition?:import('./progress-metrics').NutritionDay[];nutritionTarget?:import('./progress-metrics').NutritionTarget|null;nutritionAvailable?:boolean;nutritionTargetAvailable?:boolean;goal:string;daysPerWeek:number|null;plannedMinutes:number|null;programVersion:number|null;checkins:CheckIn[];logs:Log[];exercises:Exercise[];historyAvailable:boolean;exerciseNamesAvailable?:boolean;trainingProfileAvailable?:boolean};
export type Point = {date:string;value:number;label:string};
export type Lift = {key:string;name:string;first:Point;last:Point;firstReps:number;lastReps:number;history:{date:string;load:number;reps:number;rir:number|null;control:string|null}[];outcome:'UP'|'DOWN'|'SAME'|'MIXED'};
const shift=(day:string,delta:number)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
const fmt=(n:number)=>String(Math.round(n*10)/10);
const recovery:Record<string,number>={POOR:1,OK:2,GOOD:3};
const words:Record<string,string>={POOR:'ฟื้นไม่ดี',OK:'พอใช้',GOOD:'ดี',BETTER:'ดีขึ้น',SAME:'ใกล้เคียงเดิม',WORSE:'แย่ลง'};
export function recordedFirstSet(v:unknown){
 if(!Array.isArray(v))return null;
 const sets=v.filter((x:unknown)=>!!x&&typeof x==='object'&&Number((x as Record<string,unknown>).set)===1);
 if(sets.length!==1)return null;
 const s=sets[0];
 if(s.reps==null||String(s.reps).trim()===''||s.load_kg!=null&&String(s.load_kg).trim()==='')return null;
 const load=s.load_kg==null?null:Number(s.load_kg),reps=Number(s.reps);
 const rir=s.rir==null||String(s.rir).trim()===''?null:Number(s.rir);
 if(load!==null&&(!Number.isFinite(load)||load<0)||!Number.isInteger(reps)||reps<1)return null;
 return {load,reps,rir:rir!==null&&Number.isFinite(rir)&&rir>=0?rir:null};
}
export function firstSet(v:unknown){const s=recordedFirstSet(v);return s&&s.load!==null?{...s,load:s.load}:null;}
export function buildJourney(d:JourneyData){
 const windowDays=[7,28,30,90].includes(d.windowDays??30)?(d.windowDays??30):30;
 const begin=shift(d.today,1-windowDays),recent=shift(d.today,-6);
 const checks=d.checkins.filter(x=>x.entry_date>=begin&&x.entry_date<=d.today).slice().sort((a,b)=>a.entry_date.localeCompare(b.entry_date));
 const logs=d.historyAvailable?[...new Map(d.logs.filter(x=>x.entry_date>=begin&&x.entry_date<=d.today).map(x=>[x.log_id,x])).values()].sort((a,b)=>a.entry_date.localeCompare(b.entry_date)||a.log_id.localeCompare(b.log_id)):[];
 // Ambiguous same-day weights are omitted rather than choosing an arbitrary record.
 const dailyWeights=new Map<string,number[]>();
 for(const c of checks){const v=c.body_weight_kg;if(v==null||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<=0)continue;dailyWeights.set(c.entry_date,[...(dailyWeights.get(c.entry_date)||[]),Number(v)]);}
 const weights:Point[]=[...dailyWeights].filter(([,values])=>new Set(values).size===1).map(([date,values])=>({date,value:values[0],label:fmt(values[0])+' กก.'}));
 const first=weights[0],last=weights.at(-1);
 const weight=weights.length>=2&&last?{first,last,delta:Math.round((last.value-first.value)*10)/10}:null;
 const loggedDates=new Set(logs.map(x=>x.entry_date));
 const recoveryPoints:Point[]=checks.filter(x=>x.recovery_status&&recovery[x.recovery_status]).map(x=>({date:x.entry_date,value:recovery[x.recovery_status!],label:words[x.recovery_status!]}));
 const trainingPoints:Point[]=checks.filter(x=>['WORSE','SAME','BETTER'].includes(x.training_status||'')).map(x=>({date:x.entry_date,value:({WORSE:1,SAME:2,BETTER:3} as Record<string,number>)[x.training_status!],label:words[x.training_status!]}));
 const itemNames=new Map(d.exercises.filter(x=>x.item_id).map(x=>[x.item_id!,{key:x.exercise_key,name:(x.metadata?.display_name||x.exercise_key)+(x.training_day?' · วันฝึก '+x.training_day:'')}]));
 const exNames=new Map(d.exercises.map(x=>[x.exercise_key,x.metadata?.display_name||x.exercise_key]));
 const exerciseData=new Map<string,{exerciseKey:string;name:string;days:Map<string,Lift['history'][number][]>}>();
 for(const log of logs){
  const s=firstSet(log.set_entries);
  if(!s||!log.program_id||!log.item_id||d.exerciseNamesAvailable===false||!exNames.has(log.exercise_key))continue;
  if(log.issue_status&&log.issue_status!=='NONE')continue;
  const item=itemNames.get(log.item_id);if(item&&item.key!==log.exercise_key)continue;
  const key=[log.program_id,log.item_id,log.exercise_key].join(':'),group=exerciseData.get(key)||{exerciseKey:log.exercise_key,name:item?.name||exNames.get(log.exercise_key)||log.exercise_key,days:new Map()};
  group.days.set(log.entry_date,[...(group.days.get(log.entry_date)||[]),{date:log.entry_date,...s,control:log.control_status}]);exerciseData.set(key,group);
 }
 const lifts:Lift[]=[];
 for(const [key,group] of exerciseData){
  const history=[...group.days.values()].filter(v=>v.length===1).map(v=>v[0]).sort((a,b)=>a.date.localeCompare(b.date));
  if(history.length<2)continue;
  const a=history[0],b=history[history.length-1],ld=b.load-a.load,rd=b.reps-a.reps;
  // Same program item, set number, recorded control, and effort. Unknown effort is not confirmed progression.
  const comparable=a.control!==null&&a.control===b.control&&['GOOD','OK'].includes(a.control)&&a.rir!==null&&b.rir!==null&&a.rir===b.rir;
  const outcome:Lift['outcome']=!comparable?'MIXED':ld>=0&&rd>=0&&(ld>0||rd>0)?'UP':ld<=0&&rd<=0&&(ld<0||rd<0)?'DOWN':ld===0&&rd===0?'SAME':'MIXED';
  lifts.push({key,name:group.name,first:{date:a.date,value:a.load,label:fmt(a.load)+' กก. × '+a.reps},last:{date:b.date,value:b.load,label:fmt(b.load)+' กก. × '+b.reps},firstReps:a.reps,lastReps:b.reps,history,outcome});
 }
 // Surface declines before improvements, so a positive exercise cannot hide a contrary signal.
 const rank={DOWN:0,MIXED:1,UP:2,SAME:3};
 lifts.sort((a,b)=>rank[a.outcome]-rank[b.outcome]||b.history.length-a.history.length);
 const weekCount=Math.ceil(windowDays/7);
 const weeks=Array.from({length:weekCount},(_,i)=>{const start=[begin,shift(d.today,1-(weekCount-i)*7)].sort().at(-1)!,end=shift(d.today,-(weekCount-i-1)*7),weeklyLogs=logs.filter(x=>x.entry_date>=start&&x.entry_date<=end);return {start,end,days:new Set(weeklyLogs.map(x=>x.entry_date)).size,checkins:checks.filter(x=>x.entry_date>=start&&x.entry_date<=end).length}});
 const latestRecovery=recoveryPoints.at(-1),recentRecovery=recoveryPoints.filter(p=>p.date>=recent);
 const poor=recentRecovery.slice(-3).filter(p=>p.value===1).length>=2;
 const currentRecoveryPoor=!!latestRecovery&&latestRecovery.date>=recent&&latestRecovery.value===1;
 const worseningRecovery=!!latestRecovery&&latestRecovery.date>=recent&&latestRecovery.value<(recoveryPoints[0]?.value??latestRecovery.value);
 const decliningLift=lifts.find(x=>x.outcome==='DOWN');
 const positiveLift=lifts.find(x=>x.outcome==='UP'&&x.last.date>=recent)||lifts.find(x=>x.outcome==='UP');
 const workoutIssues=logs.filter(x=>x.entry_date>=recent&&x.issue_status&&x.issue_status!=='NONE');
 const poorControl=logs.some(x=>x.entry_date>=recent&&x.control_status==='POOR');
 const lastTraining=trainingPoints.at(-1);
 const reportedWorse=!!lastTraining&&lastTraining.date>=recent&&lastTraining.value===1;
 const newIssue=checks.some(x=>x.entry_date>=recent&&x.new_issue===true);
 const latestDate=[...checks.map(x=>x.entry_date),...logs.map(x=>x.entry_date)].sort().at(-1);
 const stale=!!latestDate&&latestDate<recent;
 let state:'IMPROVING'|'MIXED'|'INSUFFICIENT'|'REVIEW'='INSUFFICIENT',heading='ข้อมูลยังไม่พอให้สรุปความก้าวหน้า',detail="บันทึกผลต่อเพื่อให้มีข้อมูลเปรียบเทียบมากขึ้น",main='—',unit="ข้อมูลยังไม่พอ";
 if(poor||newIssue||workoutIssues.length){state='REVIEW';heading=workoutIssues.length?"มีอาการระหว่างฝึกที่ควรตรวจสอบ":poor?'ควรดูการฟื้นตัวก่อนเพิ่มความหนัก':'มีปัญหาใหม่ที่ควรทบทวน';detail=workoutIssues.length?"ในช่วง 7 วันล่าสุดมีบันทึกว่าเจ็บหรือไม่สบายขณะฝึก ควรตรวจรายละเอียดก่อนเพิ่มความหนัก":poor?"รายงานการฟื้นตัว 3 ครั้งล่าสุดในช่วง 7 วัน มีอย่างน้อย 2 ครั้งที่ระบุว่าฟื้นไม่ดี":"มีปัญหาใหม่ในเช็กอินช่วง 7 วันล่าสุด ควรตรวจรายละเอียดก่อนปรับแผน";main='ทบทวน';unit='รายงานช่วง 7 วันล่าสุด';}
 else if(stale){state='MIXED';heading="ยังไม่มีข้อมูลล่าสุดสำหรับสรุปผลตอนนี้";detail='ไม่มีการบันทึกในช่วง 7 วันล่าสุด';main=latestDate!;unit='วันที่บันทึกล่าสุด';}
 else if(decliningLift||worseningRecovery||currentRecoveryPoor||reportedWorse||poorControl){state='MIXED';heading="ควรดูผลฝึกและการฟื้นตัวร่วมกัน";detail=poorControl?"ช่วง 7 วันล่าสุดมีบันทึกว่าคุมท่าได้ไม่ดี ควรดูรายละเอียดร่วมกับผลฝึก":decliningLift?"ผลเซตแรกของบางท่าลดลง จึงยังสรุปไม่ได้ว่าผลฝึกโดยรวมดีขึ้น":worseningRecovery||currentRecoveryPoor?"ควรติดตามการฟื้นตัวล่าสุดร่วมกับผลด้านอื่น ก่อนสรุปภาพรวม":'ผลการฝึกล่าสุดที่รายงานแย่ลง';main='ติดตาม';unit='ตรวจทั้งผลฝึกและการฟื้นตัว';}
 else if(d.goal==='FAT_LOSS'&&weight&&weight.delta<0&&weight.last.date>=recent){state='IMPROVING';heading='น้ำหนักที่บันทึกลดลง';detail="เทียบน้ำหนักครั้งแรกกับล่าสุดในช่วงนี้ ตัวเลขยังไม่ใช่ค่าเฉลี่ยแนวโน้มหรือหลักฐานยืนยันว่าไขมันลด";main=fmt(weight.delta);unit='กก. จากจุดแรกถึงล่าสุด';}
 else if(d.goal==='MUSCLE_GAIN'&&recoveryPoints.length>=2&&recoveryPoints[0].value===1&&latestRecovery?.value===3&&latestRecovery.date>=recent){state='IMPROVING';heading='การฟื้นตัวที่รายงานดีขึ้น';detail="คุณรายงานจากฟื้นไม่ดีเป็นฟื้นตัวดี ข้อมูลนี้ยังยืนยันไม่ได้ว่ากล้ามเพิ่มหรือผลฝึกพ้นช่วงชะงักแล้ว";main='ดีขึ้น';unit="การฟื้นตัวที่คุณรายงาน";}
 else if((d.goal==='MUSCLE_GAIN'||d.goal==='RECOMPOSITION')&&positiveLift&&positiveLift.last.date>=recent){state='IMPROVING';heading='ท่าเดิมทำได้มากขึ้น';detail=`${positiveLift.name}: เทียบเซตแรกเมื่อรายงานแรงที่เหลือและการคุมท่าเท่ากัน ผลนี้ยังยืนยันการเพิ่มกล้ามไม่ได้`;const delta=positiveLift.last.value-positiveLift.first.value;const reps=positiveLift.lastReps-positiveLift.firstReps;main=delta&&reps?'+'+fmt(delta)+' กก. / +'+fmt(reps)+' ครั้ง':'+'+fmt(delta||reps);unit=delta&&reps?'เพิ่มทั้งน้ำหนักและจำนวนครั้ง':delta?'กก. · น้ำหนักเซตแรก':'ครั้ง · ที่น้ำหนักเท่าเดิม';}
 else if(d.goal==='GENERAL_FITNESS'&&weeks.filter(w=>w.days>0).length>=3&&weeks.at(-1)!.days>0){state='IMPROVING';heading='มีบันทึกการฝึกในหลายสัปดาห์';detail="มีบันทึกอย่างน้อย 3 สัปดาห์ รวมสัปดาห์ล่าสุด แต่ยังยืนยันไม่ได้ว่าฝึกครบตามแผน";main=String(loggedDates.size);unit='วันที่มีบันทึกท่าฝึก';}
 else if(weights.length>=2||loggedDates.size>=2||recoveryPoints.length>=2){state='MIXED';heading='มีข้อมูลเปรียบเทียบ แต่ยังสรุปผลไม่ได้';detail="ข้อมูลยังไม่พอสำหรับสรุปว่าผลเป็นไปตามเป้าหมาย";if(weight){main=(weight.delta>0?'+':'')+fmt(weight.delta);unit='กก. ที่บันทึก';}}
 const proof:string[]=[];
 for(const issue of workoutIssues.slice(-3))proof.push(issue.entry_date+' · '+(exNames.get(issue.exercise_key)||issue.exercise_key)+' · '+(issue.issue_status==='PAIN'?'รายงานอาการเจ็บ':'รายงานความไม่สบายระหว่างฝึก'));
 if(poorControl)proof.push('มีบันทึกว่าควบคุมท่าได้ไม่ดี ในช่วง 7 วันล่าสุด');
 if(weight)proof.push('น้ำหนัก '+fmt(weight.first.value)+' → '+fmt(weight.last.value)+' กก. ('+weight.first.date+' ถึง '+weight.last.date+')');
 if(d.historyAvailable)proof.push(`มีบันทึกท่าฝึก ${logs.length} รายการ ใน ${loggedDates.size} วัน จำนวนนี้ยังไม่ได้ยืนยันว่าฝึกครบทุกครั้งตามแผน`);
 else proof.push("ยังโหลดประวัติท่าฝึกไม่ได้ จึงยังสรุปผลรายท่าไม่ได้");
 for(const l of [decliningLift,positiveLift].filter((v):v is Lift=>!!v))proof.push(l.name+': '+l.first.label+' → '+l.last.label+' ('+l.first.date+' ถึง '+l.last.date+')');
 if(recoveryPoints.length>=2&&latestRecovery)proof.push('การฟื้นตัวที่รายงาน: '+recoveryPoints[0].label+' → '+latestRecovery.label+' ('+recoveryPoints[0].date+' ถึง '+latestRecovery.date+')');
 if(!checks.length&&!logs.length)proof.unshift('ยังไม่มีข้อมูลให้เปรียบเทียบในช่วง '+begin+' ถึง '+d.today);
 const limits=["น้ำหนักที่เปลี่ยนยังใช้ยืนยันการเปลี่ยนไขมันหรือกล้ามเนื้อไม่ได้"];
 if(!d.historyAvailable)limits.unshift("ยังโหลดประวัติการฝึกไม่ได้ จึงยังแสดงแนวโน้มรายท่าไม่ได้");
 if(d.exerciseNamesAvailable===false)limits.unshift("ยังโหลดรายการท่าฝึกไม่ได้ จึงยังเปรียบเทียบผลรายท่าไม่ได้");
 if(d.trainingProfileAvailable===false)limits.push('อ่านข้อมูลเวลาตามแผนไม่ได้');
 if(weights.length<2)limits.push("มีน้ำหนักที่ใช้ได้ไม่ถึง 2 วัน จึงยังคำนวณความเปลี่ยนแปลงไม่ได้");
 if(d.goal==='RECOMPOSITION')limits.push("น้ำหนักคงที่และฝึกดีขึ้นใช้ประกอบการติดตามผลได้ แต่ยังยืนยันไม่ได้ว่าไขมันลดหรือกล้ามเพิ่ม");
 if(logs.some(l=>{const s=recordedFirstSet(l.set_entries);return s&&s.load===null;}))limits.push("ท่าที่ไม่ระบุน้ำหนักยกยังเปิดดูประวัติได้ แต่ยังไม่ถูกใช้สรุปว่าความแข็งแรงเพิ่ม");
 if(d.plannedMinutes)limits.push(d.plannedMinutes+' นาทีเป็นเวลาตามแผน ไม่ใช่เวลาฝึกจริง');
 if(logs.length>=5000)limits.push("ระบบแสดงประวัติได้สูงสุด 5,000 รายการ ข้อมูลที่เห็นจึงอาจไม่ครอบคลุมทุกวันที่บันทึก");
 limits.push("เทียบเฉพาะเซต 1 ของท่าเดิมในโปรแกรมเดิม โดยไม่ใช้รายการวันที่ซ้ำ หากแรงที่เหลือหรือการคุมท่าต่างกัน จะยังสรุปผลไม่ได้");
 const next=workoutIssues.length?['เปิดบันทึกเพื่อดูว่าท่าใดมีอาการเจ็บหรือไม่สบาย','ทบทวนปัญหาที่บันทึกก่อนตัดสินใจเพิ่มความหนัก','บันทึกว่าปัญหายังเกิดซ้ำหรือไม่ในการฝึกครั้งถัดไป']:poor||newIssue?['ทบทวนปัญหาหรือการฟื้นตัวก่อนเพิ่มความหนัก','บันทึกการฟื้นตัวหลังการฝึกครั้งถัดไป','หากยังฟื้นตัวไม่ดีต่อเนื่อง ให้ทบทวนการพักและแผนฝึก']:stale?['บันทึกผลการฝึกหรือเช็กอินปัจจุบันก่อนตัดสินใจปรับแผน','เทียบกับประวัติเดิมหลังมีข้อมูลล่าสุด']:decliningLift||worseningRecovery||currentRecoveryPoor||reportedWorse||poorControl?['ตรวจท่าที่ผลลดลงและการฟื้นตัวร่วมกัน',"ฝึกตามแผนในระดับที่ทำไหว แล้วบันทึกน้ำหนักที่ยก จำนวนครั้ง และแรงที่เหลือ",'ดูว่าผลลดลงต่อเนื่องหรือเป็นเพียงครั้งเดียว']:state==='IMPROVING'&&unit.startsWith('การฟื้นตัว')?['บันทึกการฟื้นตัวหลังฝึกครั้งถัดไป เพื่อดูว่ายังอยู่ระดับดีหรือไม่',"เทียบเซตแรกของท่าเดิมในโปรแกรมเดิม พร้อมบันทึกแรงที่เหลือและการคุมท่า","ติดตามผลหลายครั้งก่อนสรุปว่าพ้นช่วงที่ผลฝึกหยุดพัฒนาแล้ว"]:d.goal==='FAT_LOSS'?['ชั่งน้ำหนักภายใต้เงื่อนไขใกล้เคียงเดิมเพื่อเทียบครั้งถัดไป','ติดตามผลท่าหลักและการฟื้นตัวควบคู่กับน้ำหนัก','เก็บข้อมูลเพิ่มก่อนปรับอาหารหรือความหนักฝึก']:d.goal==='GENERAL_FITNESS'?['เลือกวันฝึกตามแผนที่ทำได้จริงในสัปดาห์หน้า',"บันทึกท่าที่ทำหลังฝึก เพื่อติดตามความสม่ำเสมอ",'เช็กอินการฟื้นตัวเพื่อประเมินว่าแผนยังเหมาะกับชีวิตประจำวัน']:d.goal==='RECOMPOSITION'?["บันทึกน้ำหนักและจำนวนครั้งของท่าเดิม โดยเปรียบเทียบเมื่อเหลือแรงใกล้เคียงกัน",'ชั่งน้ำหนักด้วยเงื่อนไขเดิม โดยไม่ใช้ตัวเลขนี้ยืนยันการเปลี่ยนไขมัน','ติดตามการฟื้นตัวก่อนปรับแผน']:["บันทึกน้ำหนักที่ยก จำนวนครั้ง และแรงที่เหลือของเซตแรกในท่าหลัก",'เทียบผลท่าเดิมในโปรแกรมเดิมครั้งถัดไป','ติดตามการฟื้นตัวควบคู่กัน ก่อนเพิ่มความหนัก'];
 return {windowDays,state,heading,detail,main,unit,featuredLiftKey:(decliningLift||positiveLift)?.key,latestRecovery,checkpointDate:shift(d.today,7),weight,weights,recoveryPoints,trainingPoints,lifts,weeks,proof,limits,next,begin,end:d.today,latestDate,stale,checkinCount:checks.length,loggedDays:loggedDates.size,reportedSessions:checks.filter(x=>x.training_completed===true).length,logs,checks};
}
