import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {ProgressForm} from '@/components/progress-form';
import {CalorieTracker} from '@/components/calorie-tracker';
import {createClient} from '@/lib/supabase/server';
import {hasSupabaseEnv} from '@/lib/supabase/config';
import {trainingCompletion} from '@/lib/progress-metrics';
import type {Exercise,Log} from '@/lib/journey-logic';

const words:Record<string,string>={BETTER:'ดีขึ้น',SAME:'ใกล้เคียงเดิม',WORSE:'แย่ลง',GOOD:'ดี',OK:'พอใช้',POOR:'ฟื้นไม่ดี'};
function bangkokDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export default async function ProgressPage(){
 if(!hasSupabaseEnv())return <AppShell><p className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม</p></AppShell>;
 const db=await createClient();const {data:claims,error:claimError}=await db.auth.getClaims();const uid=claims?.claims?.sub as string|undefined;
 if(!uid||claimError)return <AppShell><h1>เข้าสู่ระบบเพื่อบันทึกความก้าวหน้า</h1><Link href="/login">เข้าสู่ระบบ</Link></AppShell>;
 const today=bangkokDate(),start=new Date(today+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-89);
 const [latest,program,nutrition,history]=await Promise.all([
  db.from('progress_entries').select('entry_date,training_completed,training_status,recovery_status,adherence_status,training_adherence_status,nutrition_adherence_status,new_issue,body_weight_kg,optional_note,program_id').eq('user_id',uid).lte('entry_date',today).order('entry_date',{ascending:false}).limit(5),
  db.from('programs').select('program_id,program_version').eq('user_id',uid).eq('status','ACTIVE').maybeSingle(),
  db.from('nutrition_daily_logs').select('entry_date,calories,target_low,target_high').eq('user_id',uid).gte('entry_date',start.toISOString().slice(0,10)).lte('entry_date',today).order('entry_date',{ascending:false}).limit(90),
  db.rpc('get_my_workout_history',{p_days:30})
 ]);
 const active=program.data;
 const [target,items]=await Promise.all([
  active?db.from('nutrition_targets').select('calorie_low,calorie_high,maintenance_low,maintenance_high').eq('program_id',active.program_id).maybeSingle():Promise.resolve({data:null,error:null}),
  active?db.from('training_program_items').select('item_id,training_day,sets,exercise_key,metadata').eq('program_id',active.program_id):Promise.resolve({data:[],error:null})
 ]);
 const logs=Array.isArray(history.data)?history.data as Log[]:[];
 const completion=trainingCompletion(logs,(items.data||[]) as Exercise[]);
 const rows=latest.data||[];
 return <AppShell>
  <div className="topline">บันทึกและติดตามผล</div><h1>ความก้าวหน้าของคุณ</h1><p>ดูผลฝึก แคลอรี และการฟื้นตัวจากประวัติของบัญชีคุณ</p>
  <section className="card" style={{marginTop:18,borderColor:'rgba(73,215,232,.45)'}}><div className="kicker">ภาพรวมจากข้อมูลที่บันทึก</div><h2>เปรียบเทียบผลในช่วง 7 / 30 / 90 วัน</h2><p>น้ำหนัก · ผลรายท่า · เปอร์เซ็นต์เซตตามแผน · แคลอรี · การฟื้นตัว</p><Link className="btn primary" href="/progress/journey">ดูภาพรวมความก้าวหน้า</Link></section>
  {program.error||latest.error?<p className="notice warning">ยังอ่านข้อมูลเช็กอินหรือโปรแกรมไม่ได้ โปรดลองใหม่ก่อนบันทึก</p>:<div style={{marginTop:18}}><ProgressForm key={today} hasActiveProgram={Boolean(active)} initial={rows.find(x=>x.entry_date===today)??null}/></div>}
  <section className="card day"><h2>ฝึกตามแผนครบกี่เปอร์เซ็นต์</h2><p>เซตฝึกจริงที่บันทึก ÷ เซตทั้งหมดตามแผนของวันฝึกนั้น · ย้อนหลัง 30 วัน</p>{history.error||items.error?<p>ยังอ่านข้อมูลการฝึกไม่ได้</p>:completion.length?<><div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:400,textAlign:'left'}}><thead><tr><th>วันที่</th><th>วันฝึก</th><th>เซตที่บันทึก / ตามแผน</th><th>ครบตามแผน</th></tr></thead><tbody>{completion.slice(0,7).map(c=><tr key={c.date+':'+c.trainingDay}><td>{c.date}</td><td>{c.trainingDay}</td><td>{c.done} / {c.total}</td><td>{c.percent}%</td></tr>)}</tbody></table></div><p>นับเฉพาะรายการในโปรแกรมปัจจุบัน วันที่ไม่มีบันทึกยังยืนยันไม่ได้ว่าฝึกหรือพัก</p></>:<p>ยังไม่มีบันทึกที่เชื่อมกับวันฝึกในโปรแกรมปัจจุบัน</p>}<Link className="btn" href="/program">เปิดแผนและบันทึกการฝึก</Link></section>
  {target.error&&<p className="notice warning">ยังอ่านเป้าหมายพลังงานไม่ได้ โปรดลองใหม่</p>}
  <CalorieTracker today={today} days={nutrition.data||[]} target={target.data} available={!nutrition.error}/>
  {rows.length>0&&<section className="card day"><h2>เช็กอินล่าสุด</h2>{rows.map(x=><div className="exercise" key={x.entry_date}><div><strong>{x.entry_date}</strong><br/><small>ผลฝึกที่รายงาน: {words[x.training_status||'']||'ไม่ได้ระบุ'}</small></div><div>{x.body_weight_kg!=null?`${x.body_weight_kg} กก.`:'ไม่ระบุน้ำหนัก'}<br/><small>การฟื้นตัว: {words[x.recovery_status||'']||'ไม่ได้ระบุ'}</small></div></div>)}</section>}
 </AppShell>;
}
