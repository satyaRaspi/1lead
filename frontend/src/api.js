export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
export async function apiGet(path, token = null) { const headers = token ? { Authorization: `Bearer ${token}` } : {}; const res = await fetch(`${API_BASE}${path}`, { headers }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
export async function apiPost(path, body, token = null) { const headers = body instanceof FormData ? {} : { 'Content-Type': 'application/json' }; if (token) headers.Authorization = `Bearer ${token}`; const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: body instanceof FormData ? body : JSON.stringify(body) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
export async function apiPut(path, body, token = null) { const headers = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = `Bearer ${token}`; const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }

function getTrackingIds() {
  try {
    let visitorId = localStorage.getItem('truflux_visitor_id');
    if (!visitorId) { visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('truflux_visitor_id', visitorId); }
    let sessionId = sessionStorage.getItem('truflux_session_id');
    if (!sessionId) { sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`; sessionStorage.setItem('truflux_session_id', sessionId); }
    return { visitor_id: visitorId, session_id: sessionId };
  } catch (_) { return { visitor_id: '', session_id: '' }; }
}
export async function track(event_type, payload = {}) {
  try {
    const enriched = { ...getTrackingIds(), ...payload, path: window.location.pathname + window.location.search, url: window.location.href, title: document.title, ts: new Date().toISOString() };
    await apiPost('/api/events', { event_type, payload: enriched });
  } catch (e) { console.warn('Tracking failed', e); }
}


export async function apiDelete(path, token = null) { const headers = token ? { Authorization: `Bearer ${token}` } : {}; const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
