export function trackLabEvent(event, payload = {}) {
  if (typeof window === 'undefined') return;
  const safePayload = { ...payload };
  // Never attach raw anthropometric measurements here.
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...safePayload });
}
