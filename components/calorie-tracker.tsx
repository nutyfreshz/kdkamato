"use client";

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
import {nutritionSummary,type NutritionDay,type NutritionTarget} from '@/lib/progress-metrics';

export function CalorieTracker({today,days,target,available}:{today:string;days:NutritionDay[];target:NutritionTarget|null;available:boolean}) {
 const router=useRouter();
 const [date,setDate]=useState(today),[calories,setCalories]=useState(String(days.find(d=>d.entry_date===today)?.calories??''));
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const stats=nutritionSummary(days);
 const range=(low:unknown,high:unknown)=>low!=null&&high!=null?`${Number(low).toLocaleString('th-TH')}–${Number(high).toLocaleString('th-TH')} กิโลแคลอรี/วัน`:'ยังไม่มีค่าประมาณ';
 const minDate=new Date(today+'T12:00:00Z');minDate.setUTCDate(minDate.getUTCDate()-89);
 function changeDate(value:string){setDate(value);setCalories(String(days.find(d=>d.entry_date===value)?.calories??''));setMessage('');setError('');}
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setMessage('');setError('');
  const submitted=new FormData(event.currentTarget as HTMLFormElement);
  const entryDate=String(submitted.get('entry_date')||'');
  const calorieText=String(submitted.get('calories')||'');
  const value=Number(calorieText);
  if(!calorieText.trim()||!Number.isFinite(value)||value<=0||value>20000){setError('กรอกพลังงานมากกว่า 0 และไม่เกิน 20,000 กิโลแคลอรี');return;}
  if(entryDate<minDate.toISOString().slice(0,10)||entryDate>today){setError('เลือกวันที่ภายใน 90 วันล่าสุด และไม่เกินวันนี้');return;}
  setBusy(true);
  try{const db=createClient();const {data,error:authError}=await db.auth.getClaims();const uid=data?.claims?.sub;if(authError||!uid)throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึก');
   const {error:saveError}=await db.from('nutrition_daily_logs').upsert({user_id:uid,entry_date:entryDate,calories:value},{onConflict:'user_id,entry_date'});
   if(saveError)throw saveError;
   setMessage('บันทึกแล้ว · วันใหม่เพิ่มประวัติ วันเดิมอัปเดตยอดรวม');router.refresh();
  }catch{setError('ยังยืนยันการบันทึกไม่ได้ โปรดโหลดหน้าใหม่เพื่อตรวจยอดก่อนลองอีกครั้ง');}finally{setBusy(false);}
 }
 return <section className="card day" id="calories">
  <div className="kicker">ติดตามแคลอรี · 90 วันล่าสุด</div><h2>วันนี้กินพลังงานเท่าไร</h2>
  <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12}}><div><strong>เป้าหมายจากโปรแกรมปัจจุบัน</strong><p>{range(target?.calorie_low,target?.calorie_high)}</p></div><div><strong>พลังงานรักษาน้ำหนักโดยประมาณ</strong><p>{range(target?.maintenance_low,target?.maintenance_high)}</p></div></div>
  {!target?.calorie_low&&<p>ข้อมูลยังไม่พอสำหรับตั้งเป้าหมาย <Link href="/program/start">ตรวจข้อมูลร่างกายและกิจกรรม</Link> แล้วตรวจเป้าหมายในโปรแกรม คุณยังบันทึกยอดที่กินได้</p>}
  <p>กรอกยอดรวมที่กินทั้งวันจากบันทึกอาหารหรือฉลาก เป็นค่าที่คุณรายงาน ไม่ใช่พลังงานที่ระบบวัดให้</p>
  <form className="form" onSubmit={save}><div className="form-grid"><label>วันที่<input type="date" name="entry_date" required min={minDate.toISOString().slice(0,10)} max={today} value={date} onChange={e=>changeDate(e.target.value)} onInput={e=>changeDate(e.currentTarget.value)}/></label><label>พลังงานรวมทั้งวัน (กิโลแคลอรี)<input type="number" name="calories" required min="1" max="20000" step="any" inputMode="decimal" value={calories} onChange={e=>{setCalories(e.target.value);setMessage('');}} onInput={e=>{setCalories(e.currentTarget.value);setMessage('');}} placeholder="เช่น 2200"/></label></div><button className="btn primary" type="submit" disabled={busy||!available}>{busy?'กำลังบันทึก…':'บันทึกพลังงาน'}</button></form>
  {message&&<p className="notice" role="status">{message}</p>}{error&&<p className="notice warning" role="alert">{error}</p>}
  {!available?<p className="notice warning" role="alert">ยังอ่านประวัติอาหารไม่ได้ โปรดลองใหม่ก่อนบันทึก</p>:<><p>มีบันทึก {stats.recorded} วัน · อยู่ในเป้าหมาย {stats.within} / {stats.comparable} วันที่มีเป้าหมายให้เทียบ{stats.percent!==null?` (${stats.percent}%)`:''}</p><p>วันไม่บันทึกไม่นับเป็น 0 แคลอรี เป้าหมายย้อนหลังใช้ค่าที่เก็บไว้เมื่อบันทึกวันนั้นครั้งแรก</p>{days.length>0&&<details><summary>ดูประวัติพลังงานรายวัน</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:460,textAlign:'left'}}><thead><tr><th>วันที่</th><th>กินจริง</th><th>เป้าหมายของวันนั้น</th><th>เทียบกับเป้าหมาย</th></tr></thead><tbody>{days.map(d=><tr key={d.entry_date}><td>{d.entry_date}</td><td>{Number(d.calories).toLocaleString('th-TH')}</td><td>{d.target_low!=null&&d.target_high!=null?`${d.target_low}–${d.target_high}`:'ยังไม่มี'}</td><td>{d.target_low==null||d.target_high==null?'ยังเทียบไม่ได้':Number(d.calories)<Number(d.target_low)?`ต่ำกว่าขอบล่าง ${Math.round(Number(d.target_low)-Number(d.calories))}`:Number(d.calories)>Number(d.target_high)?`เกินขอบบน ${Math.round(Number(d.calories)-Number(d.target_high))}`:'อยู่ในช่วงเป้าหมาย'}</td></tr>)}</tbody></table></div></details>}</>}
 </section>;
}
