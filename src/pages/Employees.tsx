import { useEffect, useState } from 'react';
import { authFetch } from '../auth/session';
import { env } from '../env';
import { useLockedCustomerSlug } from '../api/brand';

/**
 * IT-F2-416 c/45a44b0f — Employees tab. Ported from f2-admin's
 * Angular compliance-report.component.ts (view_mode='employees'
 * branch). Fetches F2 internal employees via
 * /rest/admin/agreements/employees?customer=f2. Read-only in Phase 1;
 * upsert/delete CRUD lands in a follow-up.
 */
type EmployeeRow = {
  user_id?: string;
  customer?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  employer?: string;
  installation_address?: string;
  van?: string;
  cta_nasdaq?: string;
  cta_nyse?: string;
  cta_opra?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: any;
};

export function Employees() {
  const lockedSlug = useLockedCustomerSlug();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // c/5f81ecb7 — on a branded customer domain, use that customer's
  // slug; F2 default hub stays on 'f2' as before.
  const customerSlug = lockedSlug || 'f2';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await authFetch(`${env.AUTH_BASE}/rest/admin/agreements/employees?customer=${encodeURIComponent(customerSlug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (cancelled) return;
        setRows(Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerSlug]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#e5e7eb' }}>Employees ({customerSlug})</h2>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} employee${rows.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 13 }}>Error: {err}</div>}
      <div style={{ overflow: 'auto', border: '1px solid #374151', borderRadius: 4 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead style={{ background: '#111827', color: '#9ca3af', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Employer</th>
              <th style={th}>Installation</th>
              <th style={th}>VAN</th>
              <th style={th}>CTA NASDAQ</th>
              <th style={th}>CTA NYSE</th>
              <th style={th}>CTA OPRA</th>
              <th style={th}>Updated</th>
            </tr>
          </thead>
          <tbody style={{ color: '#e5e7eb' }}>
            {rows.map((r, i) => (
              <tr key={r.user_id || i} style={{ borderTop: '1px solid #1f2937' }}>
                <td style={td}>{[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.email || '—'}</td>
                <td style={td}>{r.employer || '—'}</td>
                <td style={td}>{r.installation_address || '—'}</td>
                <td style={td}>{r.van || '—'}</td>
                <td style={td}>{r.cta_nasdaq || '—'}</td>
                <td style={td}>{r.cta_nyse || '—'}</td>
                <td style={td}>{r.cta_opra || '—'}</td>
                <td style={td}>{r.updated_at ? String(r.updated_at).slice(0, 16) : '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No employees.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
        <b>Phase 1:</b> read-only. Add / edit / delete employee actions come in a follow-up PR (endpoints already exist on f2-admin-service; UI wiring not ported yet).
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #374151', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'top' };
