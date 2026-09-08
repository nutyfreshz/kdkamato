import {buildFreeProgram, validateFreeProgram} from './engine.mjs';
const goals=['MUSCLE_GAIN','FAT_LOSS','RECOMPOSITION','GENERAL_FITNESS'];
const focuses=['BALANCED','CHEST','BACK','ARMS','LEGS','REPOSTURE'];
const exps=['BEGINNER','INTERMEDIATE','EXPERIENCED'];
const eqs=['FULL_GYM','LIMITED_GYM','HOME_BASIC']; const durs=[45,60,75,90]; const dayss=[2,3,4,5,6];
const limits={45:16,60:20,75:24,90:28};
let errors=[], maxPlannedExcess=0, maxActualOverPlanned=0, profiles=0;
function mk(focus,goal,exp,eq,dur,days){return buildFreeProgram({goal,weight_kg:82,height_cm:178,age_years:35,sex:'MALE',training_experience:exp,training_days_per_week:days,equipment_profile:eq},{average_steps:8000,cardio_minutes_per_week:60},{session_duration_min:dur,priority_muscles:{primary:focus,secondary:[]}})}
for(const goal of goals)for(const focus of focuses)for(const exp of exps)for(const eq of eqs)for(const dur of durs)for(const days of dayss){
 profiles++; const p=mk(focus,goal,exp,eq,dur,days); const v=validateFreeProgram(p); if(!v.ok) errors.push(['validate',focus,exp,eq,dur,days,v.errors]);
 const w=p.weekly_volume; for(const m of ['CHEST','BACK','QUADS','HAMSTRINGS','SHOULDERS','BICEPS','TRICEPS']) if((w[m]??0)<=0) errors.push(['zero-essential',m,focus,exp,eq,dur,days]);
 if(days===6 && (w.CORE??0)<=0) errors.push(['ppl-core-zero',focus,exp,eq,dur]);
 if(focus==='REPOSTURE'){for(const slot of ['POSTURE_ACCESSORY','EXTERNAL_ROTATION','LOWER_TRAP']) if(!p.training_items.some(x=>x.movement_slot===slot)) errors.push(['reposture-role',slot,exp,eq,dur,days]);}
 const planned=p.goal_snapshot.decision_trace.planned_direct_sets; const planSum=Object.values(planned).reduce((a,b)=>a+b,0); const capacity=limits[dur]*days; maxPlannedExcess=Math.max(maxPlannedExcess,planSum-capacity); if(planSum>capacity) errors.push(['plan-cap',focus,exp,eq,dur,days,planSum,capacity]);
 for(const [m,a] of Object.entries(w)){const over=a-(planned[m]??0);maxActualOverPlanned=Math.max(maxActualOverPlanned,over); if(over>2) errors.push(['actual-over-plan',m,focus,exp,eq,dur,days,a,planned[m]??0]);}
}
for(const exp of exps)for(const eq of eqs)for(const dur of durs)for(const days of dayss){const b=mk('BALANCED','MUSCLE_GAIN',exp,eq,dur,days); for(const focus of ['CHEST','BACK','ARMS','LEGS','REPOSTURE']){const p=mk(focus,'MUSCLE_GAIN',exp,eq,dur,days); if(focus==='CHEST' && p.weekly_volume.CHEST<=b.weekly_volume.CHEST) errors.push(['focus-gain',focus,exp,eq,dur,days]); if(focus==='BACK' && p.weekly_volume.BACK<=b.weekly_volume.BACK) errors.push(['focus-gain',focus,exp,eq,dur,days]); if(focus==='ARMS' && (p.weekly_volume.BICEPS+p.weekly_volume.TRICEPS)<=((b.weekly_volume.BICEPS??0)+(b.weekly_volume.TRICEPS??0))) errors.push(['focus-gain',focus,exp,eq,dur,days]); if(focus==='LEGS' && (p.weekly_volume.QUADS+p.weekly_volume.HAMSTRINGS+(p.weekly_volume.CALVES??0))<=((b.weekly_volume.QUADS??0)+(b.weekly_volume.HAMSTRINGS??0)+(b.weekly_volume.CALVES??0))) errors.push(['focus-gain',focus,exp,eq,dur,days]); if(focus==='REPOSTURE' && ((p.weekly_volume.BACK??0)+(p.weekly_volume.SHOULDERS??0)+(p.weekly_volume.ROTATOR_CUFF??0)+(p.weekly_volume.LOWER_TRAP??0))<=((b.weekly_volume.BACK??0)+(b.weekly_volume.SHOULDERS??0))) errors.push(['focus-gain',focus,exp,eq,dur,days]);}}
console.log(JSON.stringify({profiles,errors:errors.length,error_sample:errors.slice(0,30),maxPlannedExcess,maxActualOverPlanned},null,2)); if(errors.length) process.exit(1);
