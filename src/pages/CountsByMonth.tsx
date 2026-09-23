import { useEffect, useState } from 'react';
import { authFetch } from '../auth/session';
import { env } from '../env';
import { useLockedCustomerSlug } from '../api/brand';

/**
 * IT-F2-416 c/45a44b0f — Counts by Month tab. Ported from f2-admin's
 * Angular compliance-report.component.ts (view_mode='monthly_counts'
 * branch). Fetches the same exhibit-b row set and aggregates by
 * yyyy-mm on client-side.
 */
export function CountsByMonth() {
  const lockedSlug = useLockedCustomerSlug();
  const [rows, setRows] = useState<{ month: string; total: number; pro: number; non_pro: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // c/5f81ecb7 — scope the aggregation to the branded customer's
        // rows so the counts only show that customer's month totals,
        // not fleet-wide.
        const qs = lockedSlug ? `?customer=${encodeURIComponent(lockedSlug)}` : '';
        const res = await authFetch(`${env.AUTH_BASE}/rest/admin/agreements/exhibit-b${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const raw: any[] = Array.isArray(body?.rows) ? body.rows : [];
        // Aggregate by yyyy-mm of EARLIEST_DATE
        const byMonth = new Map<string, { total: number; pro: number; non_pro: number }>();
        for (const r of raw) {
          const iso = String(r.EARLIEST_DATE || r.DATE_AND_TIME_STAMP || '').slice(0, 7);
          if (!iso || !/^\d{4}-\d{2}$/.test(iso)) continue;
          const bucket = byMonth.get(iso) || { total: 0, pro: 0, non_pro: 0 };
          bucket.total += 1;
          if (r.PRO_STATUS === 'Pro') bucket.pro += 1;
          if (r.PRO_STATUS === 'Non-Pro') bucket.non_pro += 1;
          byMonth.set(iso, bucket);
        }
        const sorted = Array.from(byMonth.entries())
          .map(([month, c]) => ({ month, ...c }))
          .sort((a, b) => b.month.localeCompare(a.month));
        if (!cancelled) setRows(sorted);
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
        <h2 style={{ margin: 0, fontSize: 18, color: '#e5e7eb' }}>Counts by Month</h2>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
          {loading ? 'Loading…' : `${rows.length} month${rows.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 13 }}>Error: {err}</div>}
      <div style={{ overflow: 'auto', border: '1px solid #374151', borderRadius: 4 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead style={{ background: '#111827', color: '#9ca3af', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
            <tr>
              <th style={th}>Month</th>
              <th style={th}>Total</th>
              <th style={th}>Pro</th>
              <th style={th}>Non-Pro</th>
            </tr>
          </thead>
          <tbody style={{ color: '#e5e7eb' }}>
            {rows.map((r) => (
              <tr key={r.month} style={{ borderTop: '1px solid #1f2937' }}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.month}</td>
                <td style={td}>{r.total}</td>
                <td style={td}>{r.pro}</td>
                <td style={td}>{r.non_pro}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No months.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #374151' };
const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'top' };
