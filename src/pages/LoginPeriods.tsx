import { useEffect, useState } from 'react';
import { authFetch } from '../auth/session';
import { env } from '../env';
import { useLockedCustomerSlug } from '../api/brand';

/**
 * IT-F2-416 c/45a44b0f — Login Periods tab. Ported from f2-admin's
 * Angular compliance-report.component.ts (view_mode='login_periods'
 * branch). Shows per-user first login → last login span with
 * customer/scanners context. Uses the same exhibit-b row source and
 * projects the LAST_LOGIN + EARLIEST_DATE columns.
 */
export function LoginPeriods() {
  const lockedSlug = useLockedCustomerSlug();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // c/5f81ecb7 — scope to the branded customer when on a customer domain.
        const qs = lockedSlug ? `?customer=${encodeURIComponent(lockedSlug)}` : '';
        const res = await authFetch(`${env.AUTH_BASE}/rest/admin/agreements/exhibit-b${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const raw: any[] = Array.isArray(body?.rows) ? body.rows : [];
        // Project per-user span. Sort most-recent last login first.
        const projected = raw
          .filter((r) => r.LAST_LOGIN || r.EARLIEST_DATE)
          .map((r) => ({
            user_id: r.USER_ID || r.USER_ID_INTERNAL,
            name: [r.SUBSCRIBERS_FIRST_NAME, r.SUBSCRIBERS_LAST_NAME].filter(Boolean).join(' '),
            email: r.SUBSCRIBERS_EMAIL_ADDRESS || '',
            customer: r.CUSTOMER || '',
            scanners: r.SCANNERS || '',
            first_signed: r.EARLIEST_DATE || '',
            last_login: r.LAST_LOGIN || '',
          }))
          .sort((a, b) => String(b.last_login).localeCompare(String(a.last_login)));
        if (!cancelled) setRows(projected);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lockedSlug]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#e5e7eb' }}>Login Periods</h2>
        {lockedSlug && (
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 12 }}>
            Customer: <code style={{ padding: '2px 6px', background: '#0a0e27', border: '1px solid #374151', borderRadius: 3, color: '#e5e7eb' }}>{lockedSlug}</code>
          </span>
        )}
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} user${rows.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 13 }}>Error: {err}</div>}
      <div style={{ overflow: 'auto', border: '1px solid #374151', borderRadius: 4 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead style={{ background: '#111827', color: '#9ca3af', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
            <tr>
              <th style={th}>User ID</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Customer</th>
              <th style={th}>Scanners</th>
              <th style={th}>First Signed</th>
              <th style={th}>Last Login</th>
            </tr>
          </thead>
          <tbody style={{ color: '#e5e7eb' }}>
            {rows.map((r, i) => (
              <tr key={r.user_id || i} style={{ borderTop: '1px solid #1f2937' }}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.user_id || '—'}</td>
                <td style={td}>{r.name || '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.email || '—'}</td>
                <td style={td}>{r.customer || '—'}</td>
                <td style={td}>{r.scanners || '—'}</td>
                <td style={td}>{r.first_signed ? String(r.first_signed).slice(0, 16) : '—'}</td>
                <td style={td}>{r.last_login ? String(r.last_login).slice(0, 16) : '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No users with login history.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #374151', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'top' };
