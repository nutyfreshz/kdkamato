'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
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

function collectMeasurements() {
  const values = {};
  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const storageKey = window.sessionStorage.key(i);
      if (!storageKey?.startsWith(PREFIX)) continue;
      const key = storageKey.slice(PREFIX.length);
      values[key] = window.sessionStorage.getItem(storageKey);
    }
  } catch (_) {}
  return values;
}

function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message || 'Save failed');
  return 'Save failed';
}

export function LabSaveResult({ language='th', result, metric, meaning, use, watch, resultCode }) {
  const pathname = usePathname();
  const toolKey = useMemo(() => pathname?.split('/').filter(Boolean).at(-1) || '', [pathname]);
  const [authState, setAuthState] = useState('checking');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
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
    setError('');
  }, [toolKey, result, metric, resultCode]);

  if (!ALLOWED_TOOLS.has(toolKey)) return null;

  if (authState === 'checking') {
    return <div className="lab-save-account"><small>{language === 'en' ? 'Checking account…' : 'กำลังตรวจบัญชี…'}</small></div>;
  }

  if (authState !== 'authenticated') {
    return <div className="lab-save-account">
      <Link className="lab-next" href="/login">{language === 'en' ? 'LOGIN TO SAVE TO YOUR ACCOUNT' : 'เข้าสู่ระบบเพื่อบันทึกผลไว้ในบัญชี'} <b>→</b></Link>
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
        measurements: collectMeasurements(),
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
      const { error: saveError } = await supabase.rpc('save_my_lab_result', {
        p_tool_key: toolKey,
        p_result_payload: payload,
        p_measured_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
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
          ? (language === 'en' ? 'SAVING…' : 'กำลังบันทึก…')
          : (language === 'en' ? 'SAVE TO MY ACCOUNT' : 'บันทึกผลไว้ในบัญชี')}
    </button>
    {saved && <small>{language === 'en' ? 'This validated Lab result can now be reused by your future account history and PRO workflow.' : 'ผล LAB นี้ถูกผูกกับบัญชีแล้ว และนำไปใช้กับ history / PRO workflow ภายหลังได้'}</small>}
    {error && <small className="warning">{error}</small>}
    {busy && <ProcessingOverlay title={language === 'en' ? 'Saving Lab result…' : 'กำลังบันทึกผล LAB…'} detail={language === 'en' ? 'Linking this result to your account.' : 'กำลังผูกผลนี้เข้ากับบัญชีของคุณ'} />}
  </div>;
}
