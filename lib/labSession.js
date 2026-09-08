'use client';

import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'kdkamato.lab.v1.';

export function useLabMeasurement(key, fallback = '') {
  const [value, setValueState] = useState('');

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(`${PREFIX}${key}`);
      if (stored !== null) setValueState(stored);
    } catch (_) {}
  }, [key]);

  const setValue = useCallback((next) => {
    setValueState((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next;
      const text = String(resolved ?? '');
      try { window.sessionStorage.setItem(`${PREFIX}${key}`, text); } catch (_) {}
      return text;
    });
  }, [key]);

  return [value, setValue];
}
