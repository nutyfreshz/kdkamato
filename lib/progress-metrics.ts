import type {Exercise, Log} from './journey-logic';

export type NutritionTarget = {calorie_low:number|string|null;calorie_high:number|string|null;maintenance_low:number|string|null;maintenance_high:number|string|null};
export type NutritionDay = {entry_date:string;calories:number|string;target_low:number|string|null;target_high:number|string|null};
export function journeyWindow(value:unknown):number {return [7,30,90].includes(Number(value))?Number(value):30;}
export function nutritionSummary(days:NutritionDay[]) {
 const recorded=days.filter(d=>Number.isFinite(Number(d.calories))&&Number(d.calories)>0);
 const comparable=recorded.filter(d=>d.target_low!=null&&d.target_high!=null&&Number(d.target_low)>0&&Number(d.target_high)>=Number(d.target_low));
 const within=comparable.filter(d=>Number(d.calories)>=Number(d.target_low)&&Number(d.calories)<=Number(d.target_high));
 return {recorded:recorded.length,comparable:comparable.length,within:within.length,percent:comparable.length?Math.round(100*within.length/comparable.length):null};
}

// Completion means recorded working sets, not exercise quality or verified attendance.
// Only current program item IDs are eligible; a changed program cannot fill today's plan.
export function trainingCompletion(logs:Log[],exercises:Exercise[]) {
 const planned=exercises.filter(e=>e.item_id&&Number.isInteger(e.training_day)&&Number(e.training_day)>0&&Number.isInteger(e.sets)&&Number(e.sets)>0);
 const items=new Map(planned.map(e=>[e.item_id!,e]));
 const days=new Map<string,{date:string;trainingDay:number;logs:Log[]}>();
 for(const log of logs){const item=items.get(log.item_id||'');if(!item||item.exercise_key!==log.exercise_key)continue;const key=log.entry_date+':'+item.training_day;const day=days.get(key)||{date:log.entry_date,trainingDay:item.training_day!,logs:[]};day.logs.push(log);days.set(key,day);}
 return [...days.values()].map(day=>{
  const plan=planned.filter(e=>e.training_day===day.trainingDay);
  const total=plan.reduce((sum,e)=>sum+Number(e.sets),0);
  let done=0;
  for(const item of plan){
   const entries=day.logs.filter(l=>l.item_id===item.item_id);
   if(entries.length!==1||!Array.isArray(entries[0].set_entries))continue;
   const sets=entries[0].set_entries as {set?:unknown;reps?:unknown;load_kg?:unknown}[];
   const valid=sets.filter(s=>s&&Number.isInteger(Number(s.set))&&Number(s.set)>=1&&Number(s.set)<=Number(item.sets)&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0&&(s.load_kg==null||String(s.load_kg).trim()!==''&&Number.isFinite(Number(s.load_kg))&&Number(s.load_kg)>=0));
   done+=valid.filter(s=>sets.filter(other=>other&&Number(other.set)===Number(s.set)).length===1).length;
  }
  return {date:day.date,trainingDay:day.trainingDay,done,total,percent:Math.round(100*done/total)};
 }).sort((a,b)=>b.date.localeCompare(a.date)||a.trainingDay-b.trainingDay);
}
