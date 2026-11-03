import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {JourneyDashboard} from '@/components/journey-dashboard';
import {createClient} from '@/lib/supabase/server';
import {hasSupabaseEnv} from '@/lib/supabase/config';
import {journeyWindow} from '@/lib/progress-metrics';
import type {JourneyData,CheckIn,Log,Exercise} from '@/lib/journey-logic';
export const dynamic='force-dynamic';
export const metadata={title:'ความก้าวหน้าของคุณ | KDKAMATO'};
function todayBkk(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function startFrom(day:string,days:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1-days);return d.toISOString().slice(0,10)}
export default async function JourneyPage({searchParams}:{searchParams:Promise<{days?:string}>}){
 const windowDays=journeyWindow((await searchParams).days);
 if(!hasSupabaseEnv())return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม</div></AppShell>;
 const db=await createClient();
 const {data:claims,error:claimError}=await db.auth.getClaims();
 const uid=claims?.claims?.sub as string|undefined;
 if(!uid||claimError)return <AppShell><h1>เข้าสู่ระบบเพื่อดูความก้าวหน้า</h1><Link className="btn primary" href="/login">เข้าสู่ระบบ</Link></AppShell>;
 const today=todayBkk(),start=startFrom(today,windowDays);
 const [baseline,training,program,checkins,history,nutrition]=await Promise.all([
  db.from('user_baseline').select('goal,training_days_per_week').eq('user_id',uid).maybeSingle(),
  db.from('training_profiles').select('session_duration_min').eq('user_id',uid).maybeSingle(),
  db.from('programs').select('program_id,program_version,goal_snapshot').eq('user_id',uid).eq('status','ACTIVE').maybeSingle(),
  db.from('progress_entries').select('entry_date,body_weight_kg,training_completed,training_status,recovery_status,training_adherence_status,nutrition_adherence_status,new_issue').eq('user_id',uid).gte('entry_date',start).lte('entry_date',today).order('entry_date',{ascending:true}).limit(366),
  db.rpc('get_my_workout_history',{p_days:windowDays}),
  db.from('nutrition_daily_logs').select('entry_date,calories,target_low,target_high').eq('user_id',uid).gte('entry_date',start).lte('entry_date',today).order('entry_date',{ascending:false}).limit(90)
 ]);
 if(baseline.error||program.error||checkins.error)return <AppShell><h1>ไม่สามารถอ่านความก้าวหน้าได้</h1><p>โปรดลองใหม่อีกครั้ง ข้อมูลของคุณไม่ได้ถูกแก้ไข</p></AppShell>;
 const active=program.data;
 const items=active?await db.from('training_program_items').select('item_id,training_day,sets,exercise_key,metadata').eq('program_id',active.program_id):{data:[],error:null};
 const targets=active?await db.from('nutrition_targets').select('calorie_low,calorie_high,maintenance_low,maintenance_high').eq('program_id',active.program_id).maybeSingle():{data:null,error:null};
 const historyAvailable=!history.error&&Array.isArray(history.data);
 const goalSnapshot=active?.goal_snapshot as {goal?:string}|null;
 const input:JourneyData={
  today,windowDays,nutrition:nutrition.data||[],nutritionAvailable:!nutrition.error,nutritionTarget:targets.data,nutritionTargetAvailable:!targets.error,goal:String(baseline.data?.goal||goalSnapshot?.goal||''),
  daysPerWeek:baseline.data?.training_days_per_week??null,
  plannedMinutes:training.error?null:training.data?.session_duration_min??null,
  trainingProfileAvailable:!training.error,exerciseNamesAvailable:!items.error,
  programVersion:active?.program_version??null,
  checkins:(checkins.data||[]) as CheckIn[],
  logs:historyAvailable?(history.data as Log[]):[],
  exercises:(items.data||[]) as Exercise[],historyAvailable
 };
 return <AppShell><JourneyDashboard input={input}/></AppShell>;
}