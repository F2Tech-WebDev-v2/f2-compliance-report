import { useEffect, useState } from 'react';
import { authFetch } from '../auth/session';
import { env } from '../env';
import { useLockedCustomerSlug } from '../api/brand';

/**
 * IT-F2-416 c/45a44b0f — Users tab. Ported from f2-admin's Angular
 * compliance-report.component.ts (view_mode='users' branch, line
 * ~604). Fetches Exhibit B report via /rest/admin/agreements/exhibit-b
 * and renders the row set as a table.
 *
 * c/5f81ecb7 (Mike 2026-09-23): when the SPA is loaded on a customer-
 * branded domain, hard-lock the customer filter to that customer's
 * slug (hide the free-text input). On the F2 default hub the input
 * stays visible for the (all)-customers view.
 */
export function Users() {
  const lockedSlug = useLockedCustomerSlug();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [typedCustomer, setTypedCustomer] = useState<string>('');
  const customer = lockedSlug || typedCustomer;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // c/d013a78c — correct endpoint is
        // POST /rest/user/data-agreements/admin/exhibit-b with the
        // filter object in the body (customers[] array).
        const filter: any = {};
        if (customer) filter.customers = [customer];
        const res = await authFetch(`${env.AUTH_BASE}/rest/user/data-agreements/admin/exhibit-b`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(filter),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (cancelled) return;
        setRows(Array.isArray(body?.rows) ? body.rows : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#e5e7eb' }}>Users</h2>
        {lockedSlug ? (
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 12 }}>
            Customer: <code style={{ padding: '2px 6px', background: '#0a0e27', border: '1px solid #374151', borderRadius: 3, color: '#e5e7eb' }}>{lockedSlug}</code>
          </span>
        ) : (
          <label style={{ fontSize: 12, color: '#9ca3af', marginLeft: 12 }}>
            Customer:
            <input
              type="text"
              value={typedCustomer}
              onChange={(e) => setTypedCustomer(e.target.value.trim())}
              placeholder="(all)"
              style={{ marginLeft: 6, padding: '4px 8px', background: '#0a0e27', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4, fontSize: 12 }}
            />
          </label>
        )}
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} row${rows.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 13 }}>Error: {err}</div>}
      <div style={{ overflow: 'auto', border: '1px solid #374151', borderRadius: 4 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead style={{ background: '#111827', color: '#9ca3af', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
            <tr>
              <th style={th}>USER_ID</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Customer</th>
              <th style={th}>Pro/Non-Pro</th>
              <th style={th}>Review Status</th>
              <th style={th}>First Signed</th>
              <th style={th}>Last Login</th>
            </tr>
          </thead>
          <tbody style={{ color: '#e5e7eb' }}>
            {rows.map((r, i) => (
              <tr key={r.USER_ID_INTERNAL || r.USER_ID || i} style={{ borderTop: '1px solid #1f2937' }}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.USER_ID || r.USER_ID_INTERNAL || '—'}</td>
                <td style={td}>{[r.SUBSCRIBERS_FIRST_NAME, r.SUBSCRIBERS_LAST_NAME].filter(Boolean).join(' ') || '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.SUBSCRIBERS_EMAIL_ADDRESS || '—'}</td>
                <td style={td}>{r.CUSTOMER || '—'}</td>
                <td style={td}>{r.PRO_STATUS || '—'}</td>
                <td style={td}>{r.REVIEW_STATUS || '—'}</td>
                <td style={td}>{r.EARLIEST_DATE ? String(r.EARLIEST_DATE).slice(0, 16) : '—'}</td>
                <td style={td}>{r.LAST_LOGIN || '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #374151', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'top' };
