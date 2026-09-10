'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { ProcessingOverlay } from '../processing-overlay';

const PREFIX = 'kdkamato.lab.v1.';
const ALLOWED_TOOLS = new Set([
  'exercise-fit',
  'squat-geometry',
  'physique-goal',
  'v-taper',
  'ffmi',
  'knee-to-wall',
  'ape-index',
  'femur-tibia',
]);

const TOOL_MEASUREMENT_KEYS = {
  'squat-geometry': ['femur', 'tibia'],
  'physique-goal': ['shoulder', 'waist'],
  'v-taper': ['shoulder', 'waist'],
  'ffmi': ['height', 'weight', 'bodyFat'],
  'knee-to-wall': ['kneeWallLeft', 'kneeWallRight'],
  'ape-index': ['height', 'armSpan'],
  'femur-tibia': ['femur', 'tibia'],
};

function measurementKeysFor(toolKey, resultCode) {
  if (toolKey === 'exercise-fit') {
    if (String(resultCode || '').startsWith('C1_BENCH_')) return ['height', 'armSpan'];
    if (resultCode === 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY') return ['height', 'armSpan', 'femur', 'tibia'];
    if (String(resultCode || '').startsWith('C1_SQUAT_')) return ['femur', 'tibia'];
    return ['height', 'armSpan', 'femur', 'tibia'];
  }
  return TOOL_MEASUREMENT_KEYS[toolKey] || [];
}

function collectMeasurements(toolKey, resultCode) {
  const values = {};
  try {
    for (const key of measurementKeysFor(toolKey, resultCode)) {
      const value = window.sessionStorage.getItem(`${PREFIX}${key}`);
      if (value !== null) values[key] = value;
    }
  } catch (_) {}
  return values;
}

function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message || 'Save failed');
  return 'Save failed';
}

function itemName(item) {
  return item?.metadata?.display_name || item?.exercise_key || '';
}

function classifyProgramOutcome(toolKey, resultCode, outcome, beforeItems) {
  const isSquatC1 = toolKey === 'exercise-fit' && String(resultCode || '').startsWith('C1_SQUAT_');
  if (!outcome || !isSquatC1) return { kind: 'CONTEXT_ONLY' };

  if (outcome.status === 'UPDATED') {
    const oldByItem = new Map((beforeItems || []).map((item) => [String(item.item_id), item]));
    const changes = (Array.isArray(outcome.changes) ? outcome.changes : []).map((change) => {
      const previous = oldByItem.get(String(change?.item_id || ''));
      return {
        from: itemName(previous),
        to: change?.exercise_name || change?.exercise_key || '',
      };
    }).filter((change) => change.from || change.to);
    return { kind: 'UPDATED', programVersion: outcome.new_program_version, changes };
  }

  if (outcome.reason === 'PROGRAM_ALREADY_ALIGNED') return { kind: 'ALREADY_FIT', desired: outcome.desired_exercises || [] };
  if (outcome.reason === 'DIRECTIONAL_MARGIN_BELOW_AUTO_THRESHOLD' || outcome.reason === 'DIRECTIONAL_SIGNAL_REQUIRED') {
    return { kind: 'NOT_ENOUGH_EVIDENCE' };
  }
  if (outcome.reason === 'ACTUAL_RESPONSE_CONFLICT_CURRENT_CONFIRMED' || outcome.reason === 'ACTUAL_RESPONSE_CONFLICT_TARGET_DEPRIORITIZED') {
    return { kind: 'REAL_RESPONSE_OVERRIDES', reason: outcome.reason };
  }
  if (outcome.reason === 'ACTIVE_PROGRAM_NOT_FOUND') return { kind: 'NO_PROGRAM' };
  return { kind: 'NO_CHANGE' };
}

export function LabSaveResult({ language='th', result, metric, meaning, use, watch, resultCode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const physicalMode = searchParams?.get('consult') === '1';
  const toolKey = useMemo(() => pathname?.split('/').filter(Boolean).at(-1) || '', [pathname]);
  const [authState, setAuthState] = useState('checking');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [programOutcome, setProgramOutcome] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setAuthState(data.session?.user ? 'authenticated' : 'anonymous');
    }).catch(() => { if (alive) setAuthState('anonymous'); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setSaved(false);
    setProgramOutcome(null);
    setError('');
  }, [toolKey, result, metric, resultCode]);

  if (!ALLOWED_TOOLS.has(toolKey)) return null;

  if (authState === 'checking') {
    return <div className="lab-save-account"><small>{language === 'en' ? 'Checking account…' : 'กำลังตรวจบัญชี…'}</small></div>;
  }

  if (authState !== 'authenticated') {
    return <div className="lab-save-account">
      <Link className="lab-next" href={physicalMode ? '/login?physical=1' : '/login'}>{language === 'en' ? 'LOGIN TO SAVE TO YOUR ACCOUNT' : 'เข้าสู่ระบบเพื่อบันทึกผลไว้ในบัญชี'} <b>→</b></Link>
    </div>;
  }

  async function save() {
    if (busy || saved) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        schema_version: 'LAB_RESULT_V1',
        tool_key: toolKey,
        source: 'KDKAMATO_LAB_RESULT_CONTRACT_V1',
        language,
        measurements: collectMeasurements(toolKey, resultCode),
        output: {
          result: result ?? null,
          metric: metric ?? null,
          meaning: meaning ?? null,
          use: use ?? null,
          watch: watch ?? null,
          result_code: resultCode ?? null,
        },
      };

      const supabase = createClient();
      let beforeItems = [];
      const isSquatC1 = toolKey === 'exercise-fit' && String(resultCode || '').startsWith('C1_SQUAT_');
      if (isSquatC1) {
        const { data: beforeProgram } = await supabase.from('programs')
          .select('program_id')
          .eq('status', 'ACTIVE')
          .maybeSingle();
        if (beforeProgram?.program_id) {
          const { data } = await supabase.from('training_program_items')
            .select('item_id,exercise_key,metadata')
            .eq('program_id', beforeProgram.program_id)
            .eq('movement_slot', 'QUAD_COMPOUND');
          beforeItems = data || [];
        }
      }

      const { data: resultId, error: saveError } = await supabase.rpc('save_my_lab_result', {
        p_tool_key: toolKey,
        p_result_payload: payload,
        p_measured_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;

      let rawOutcome = null;
      if (resultId) {
        const { data: savedRow } = await supabase.from('lab_results')
          .select('result_payload')
          .eq('result_id', resultId)
          .maybeSingle();
        rawOutcome = savedRow?.result_payload?._system?.program_outcome || null;
      }

      setProgramOutcome(classifyProgramOutcome(toolKey, resultCode, rawOutcome, beforeItems));
      setSaved(true);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  return <div className="lab-save-account">
    <button type="button" className="share-result" onClick={save} disabled={busy || saved}>
      {saved
        ? (language === 'en' ? 'SAVED TO ACCOUNT' : 'บันทึกไว้ในบัญชีแล้ว')
        : busy
          ? (language === 'en' ? 'CHECKING PROGRAM…' : 'กำลังเช็ก Program…')
          : (language === 'en' ? 'SAVE TO MY ACCOUNT' : 'บันทึกผลไว้ในบัญชี')}
    </button>

    {saved && programOutcome?.kind === 'UPDATED' && <div className="notice" style={{ marginTop: 12 }}>
      <strong>{language === 'en' ? `PROGRAM UPDATED · v${programOutcome.programVersion}` : `Program อัปเดตแล้ว · เวอร์ชัน ${programOutcome.programVersion}`}</strong>
      <p>{language === 'en' ? 'Your new Exercise Fit result changed only the relevant Squat exercise.' : 'ผล Exercise Fit นี้ทำให้ Program ปรับเฉพาะท่า Squat ที่เกี่ยวข้อง'}</p>
      {programOutcome.changes?.map((change, index) => <p key={`${change.from}-${change.to}-${index}`} style={{ margin: '4px 0' }}><strong>{change.from || '—'} → {change.to || '—'}</strong></p>)}
      <p>{language === 'en' ? 'Other exercises, training volume, and nutrition stayed unchanged.' : 'ท่าอื่น ปริมาณการฝึก และโภชนาการยังเหมือนเดิม'}</p>
      <Link className="lab-next" href="/program">{language === 'en' ? 'VIEW UPDATED PROGRAM' : 'ดู Program ที่อัปเดต'} <b>→</b></Link>
    </div>}

    {saved && programOutcome?.kind === 'ALREADY_FIT' && <div className="notice" style={{ marginTop: 12 }}>
      <strong>{language === 'en' ? 'YOUR PROGRAM ALREADY MATCHES THIS LAB RESULT' : 'Program ของคุณตรงกับผล LAB อยู่แล้ว'}</strong>
      <p>{language === 'en' ? 'The current Squat exercise set is already aligned with this result, so no change was needed.' : 'กลุ่มท่า Squat ใน Program ปัจจุบันสอดคล้องกับผลที่วัดได้อยู่แล้ว จึงไม่จำเป็นต้องเปลี่ยน'}</p>
    </div>}

    {saved && programOutcome?.kind === 'NOT_ENOUGH_EVIDENCE' && <div className="notice" style={{ marginTop: 12 }}>
      <strong>{language === 'en' ? 'SAVED · PROGRAM NOT CHANGED' : 'บันทึกผลแล้ว · Program ยังไม่เปลี่ยน'}</strong>
      <p>{language === 'en' ? 'The measured direction is still too close to neutral for an automatic exercise change. This result remains available as context for future decisions.' : 'ค่าที่วัดได้ยังอยู่ใกล้ช่วงกึ่งกลางเกินไปสำหรับการเปลี่ยนท่าอัตโนมัติ ผลนี้ยังถูกเก็บไว้ใช้ประกอบการตัดสินใจครั้งต่อไป'}</p>
    </div>}

    {saved && programOutcome?.kind === 'REAL_RESPONSE_OVERRIDES' && <div className="notice" style={{ marginTop: 12 }}>
      <strong>{language === 'en' ? 'PROGRAM KEPT FROM REAL TRAINING RESPONSE' : 'Program ยังไม่เปลี่ยน เพราะผลการฝึกจริงของคุณมีน้ำหนักมากกว่าผลจาก LAB'}</strong>
      <p>{programOutcome.reason === 'ACTUAL_RESPONSE_CONFLICT_TARGET_DEPRIORITIZED'
        ? (language === 'en' ? 'LAB suggested an option that your prior training response had already deprioritized, so it was not added back automatically.' : 'LAB แนะนำท่าที่ข้อมูลการฝึกก่อนหน้าของคุณเคยลด priority ไว้ ระบบจึงไม่ใส่กลับอัตโนมัติ')
        : (language === 'en' ? 'LAB suggested a different direction, but your current exercise has already shown a good real-world fit, so the Program was preserved.' : 'LAB แนะนำอีกทาง แต่ท่าปัจจุบันมีผลตอบสนองจากการฝึกจริงที่ดีอยู่แล้ว ระบบจึงเก็บท่าเดิมไว้')}</p>
      <small>{language === 'en' ? 'Real training response has higher authority than LAB prediction.' : 'เมื่อผลจาก LAB กับการฝึกจริงไม่ตรงกัน ระบบจะเชื่อผลการฝึกจริงก่อน'}</small>
    </div>}

    {saved && programOutcome?.kind === 'NO_PROGRAM' && <div className="notice" style={{ marginTop: 12 }}>
      <strong>{language === 'en' ? 'LAB RESULT SAVED' : 'บันทึกผล LAB แล้ว'}</strong>
      <p>{language === 'en' ? 'You do not have an Active Program yet. This result will remain in your account and can inform Program creation.' : 'ตอนนี้คุณยังไม่มี Active Program ผลนี้จะถูกเก็บไว้ในบัญชีและใช้เป็นข้อมูลประกอบตอนสร้าง Program'}</p>
      <Link className="lab-next" href="/program/start">{language === 'en' ? 'CREATE PROGRAM' : 'สร้าง Program'} <b>→</b></Link>
    </div>}

    {saved && (programOutcome?.kind === 'CONTEXT_ONLY' || programOutcome?.kind === 'NO_CHANGE') && <small>
      {language === 'en' ? 'This Lab result is saved to your account and can be reused as context. It did not automatically change your Program.' : 'ผล LAB นี้ถูกบันทึกไว้ในบัญชีแล้ว และใช้เป็นข้อมูลประกอบได้ โดยไม่ได้เปลี่ยน Program อัตโนมัติ'}
    </small>}

    {saved && physicalMode && <div className="cta-row" style={{ marginTop: 12 }}>
      <Link className="btn primary" href="/physical-consult">{language === 'en' ? 'BACK TO PHYSICAL CONSULT' : 'กลับ Physical Consult Session'}</Link>
    </div>}

    {error && <small className="warning">{error}</small>}
    {busy && <ProcessingOverlay title={language === 'en' ? 'Saving result and checking Program…' : 'กำลังบันทึกผลและเช็ก Program…'} detail={language === 'en' ? 'Saving this result, then checking whether the Active Program should change.' : 'กำลังบันทึกผล แล้วตรวจว่ามีเหตุผลพอให้ Active Program เปลี่ยนหรือไม่'} />}
  </div>;
}