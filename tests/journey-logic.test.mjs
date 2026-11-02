import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildJourney,recordedFirstSet} from '../lib/journey-logic.ts';
const check=(entry_date,extra={})=>({entry_date,body_weight_kg:null,training_completed:null,training_status:null,recovery_status:null,training_adherence_status:null,nutrition_adherence_status:null,new_issue:false,...extra});
const log=(entry_date,load=20,reps=10,extra={})=>({log_id:entry_date,entry_date,exercise_key:'SQUAT',program_id:'p1',item_id:'i1',set_entries:[{set:1,load_kg:load,reps,rir:2}],control_status:'GOOD',issue_status:'NONE',...extra});
const input=(extra={})=>({today:'2026-11-02',goal:'MUSCLE_GAIN',daysPerWeek:3,plannedMinutes:45,programVersion:1,historyAvailable:true,exercises:[{exercise_key:'SQUAT',metadata:{display_name:'Squat'}}],checkins:[],logs:[],...extra});
test('empty user stays insufficient',()=>assert.equal(buildJourney(input()).state,'INSUFFICIENT'));
test('one weight cannot establish a trend',()=>assert.notEqual(buildJourney(input({checkins:[check('2026-11-01',{body_weight_kg:80})]})).state,'IMPROVING'));
test('fat loss cannot hide declining performance',()=>assert.notEqual(buildJourney(input({goal:'FAT_LOSS',checkins:[check('2026-10-10',{body_weight_kg:85}),check('2026-11-01',{body_weight_kg:82})],logs:[log('2026-10-10',30),log('2026-11-01',20)]})).state,'IMPROVING'));
test('rising lift cannot hide worsening recovery',()=>assert.notEqual(buildJourney(input({checkins:[check('2026-10-10',{recovery_status:'GOOD'}),check('2026-11-01',{recovery_status:'POOR'})],logs:[log('2026-10-10'),log('2026-11-01',25)]})).state,'IMPROVING'));
test('program replacements are not comparable',()=>assert.equal(buildJourney(input({logs:[log('2026-10-10'),log('2026-11-01',25,10,{program_id:'p2',item_id:'i2'})]})).lifts.length,0));
test('a missing set one must not substitute a different set',()=>assert.equal(buildJourney(input({logs:[log('2026-10-10'),log('2026-11-01',25,10,{set_entries:[{set:2,load_kg:25,reps:10}]})]})).lifts.length,0));
test('two adjacent dates do not prove consistent training',()=>assert.notEqual(buildJourney(input({goal:'GENERAL_FITNESS',logs:[log('2026-10-31'),log('2026-11-01')]})).state,'IMPROVING'));
test('stale data does not claim current improvement',()=>assert.notEqual(buildJourney(input({logs:[log('2026-10-06'),log('2026-10-08',25)]})).state,'IMPROVING'));
test('bad recovery separated by missing recovery is retained',()=>assert.equal(buildJourney(input({checkins:[check('2026-10-27',{recovery_status:'POOR'}),check('2026-10-28'),check('2026-10-29'),check('2026-11-01',{recovery_status:'POOR'})]})).state,'REVIEW'));
test('RPC unavailable does not imply zero workouts',()=>{const r=buildJourney(input({historyAvailable:false}));assert.equal(r.state,'INSUFFICIENT');assert.ok(r.limits.some(x=>x.includes('History')));});
test('rep-only progress is expressed as reps, not zero kg',()=>{const r=buildJourney(input({logs:[log('2026-10-10',20,8),log('2026-11-01',20,12)]}));assert.equal(r.main,'+4');assert.match(r.unit,/ครั้ง/);});
test('future and old data are excluded',()=>assert.equal(buildJourney(input({logs:[log('2026-10-05'),log('2026-11-03')]})).loggedDays,0));
test('same date duplicates do not create a trend',()=>assert.ok(buildJourney(input({checkins:[check('2026-11-01',{body_weight_kg:80}),check('2026-11-01',{body_weight_kg:79})]})).weights.length<2));
test('invalid weights cannot be accepted',()=>assert.ok(buildJourney(input({checkins:[check('2026-10-10',{body_weight_kg:0}),check('2026-11-01',{body_weight_kg:80})]})).weights.every(p=>p.value>0)));
test('increased effort must not prove progression',()=>assert.notEqual(buildJourney(input({logs:[log('2026-10-10'),log('2026-11-01',25,10,{set_entries:[{set:1,load_kg:25,reps:10,rir:0}]})]})).state,'IMPROVING'));

test('a single recent poor recovery cannot be hidden by progress',()=>assert.notEqual(buildJourney(input({checkins:[check('2026-11-01',{recovery_status:'POOR'})],logs:[log('2026-10-10'),log('2026-11-01',25)]})).state,'IMPROVING'));
test('recent new issue asks for review',()=>assert.equal(buildJourney(input({checkins:[check('2026-11-01',{new_issue:true})],logs:[log('2026-10-10'),log('2026-11-01',25)]})).state,'REVIEW'));
test('failed exercise query does not invent missing history',()=>assert.equal(buildJourney(input({exerciseNamesAvailable:false,logs:[log('2026-10-10'),log('2026-11-01',25)]})).lifts.length,0));
test('unknown recovery does not create a zero point',()=>assert.equal(buildJourney(input({checkins:[check('2026-11-01',{recovery_status:'UNKNOWN'})]})).recoveryPoints.length,0));
test('home training with null load never invents kilograms',()=>assert.equal(buildJourney(input({logs:[log('2026-10-10',null),log('2026-11-01',null)]})).lifts.length,0));
if(process.env.JOURNEY_SNAPSHOT){
 const cases=JSON.parse(readFileSync(process.env.JOURNEY_SNAPSHOT,'utf8')).sort((a,b)=>a.demo.localeCompare(b.demo));
 const expected=[{count:63,days:10,main:'-1.9'},{count:88,days:14,main:'+6'},{count:70,days:11,main:'+6'},{count:36,days:6,main:'6'},{count:91,days:14,main:'ดีขึ้น'},{count:54,days:9,main:'9'}];
 for(let i=0;i<cases.length;i++)test('live snapshot DEMO-0'+(i+1)+' agrees with source counts and supported story',()=>{const r=buildJourney(cases[i].input);assert.equal(r.logs.length,expected[i].count);assert.equal(r.loggedDays,expected[i].days);assert.equal(r.main,expected[i].main);assert.equal(r.checkinCount,7);assert.equal(r.state,'IMPROVING');if(i===2)assert.ok(r.limits.some(s=>s.includes('ไม่ยืนยันว่าไขมันลด')));if(i===5)assert.ok(r.limits.includes('45 นาทีเป็นเวลาตามแผน ไม่ใช่เวลาฝึกจริง'));});
}
test('seven-day review window excludes the eighth day',()=>{const r=buildJourney(input({checkins:[check('2026-10-26',{new_issue:true}),check('2026-11-01',{recovery_status:'GOOD'})],logs:[log('2026-10-10'),log('2026-11-01',25)]}));assert.notEqual(r.state,'REVIEW');});
test('the seventh day is included in the review window',()=>assert.equal(buildJourney(input({checkins:[check('2026-10-27',{new_issue:true})]})).state,'REVIEW'));
test('recent workout pain cannot be hidden by another improving lift',()=>{const r=buildJourney(input({logs:[log('2026-10-10'),log('2026-11-01',25),log('2026-11-02',10,10,{log_id:'pain',exercise_key:'ROW',item_id:'i2',issue_status:'PAIN'})]}));assert.equal(r.state,'REVIEW');assert.ok(r.proof.some(x=>x.includes('2026-11-02')));});
test('recent poor control is shown even without a check-in',()=>assert.notEqual(buildJourney(input({logs:[log('2026-10-10'),log('2026-11-01',25),log('2026-11-02',25,10,{log_id:'poor-control',item_id:'i2',control_status:'POOR'})]})).state,'IMPROVING'));
test('a fresh positive lift is selected before a stale positive lift',()=>{const r=buildJourney(input({logs:[log('2026-10-06'),log('2026-10-07',25),log('2026-10-08',26),log('2026-10-10',20,10,{item_id:'i2'}),log('2026-11-01',25,10,{item_id:'i2'})]}));assert.equal(r.state,'IMPROVING');assert.match(r.featuredLiftKey,/i2/);});

test('bodyweight reps stay inspectable without inventing a load',()=>assert.deepEqual(recordedFirstSet([{set:1,load_kg:null,reps:12,rir:3}]),{load:null,reps:12,rir:3}));
test('duplicate set one is ambiguous, not arbitrary evidence',()=>assert.equal(recordedFirstSet([{set:1,load_kg:20,reps:8},{set:1,load_kg:25,reps:8}]),null));
test('blank effort is unavailable rather than a claimed zero RIR',()=>assert.equal(recordedFirstSet([{set:1,load_kg:20,reps:8,rir:''}]).rir,null));
