import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from './pages/Users';
import { CountsByMonth } from './pages/CountsByMonth';
import { LoginPeriods } from './pages/LoginPeriods';
import { Employees } from './pages/Employees';
import { useBrand } from './api/brand';

// IT-F2-416 c/45a44b0f (Mike answer A on clar a4c24d30, 2026-09-22):
// standalone spin-out of f2-admin's Angular compliance-report panel.
// 4 tabs from the Angular source. React + Vite + bearer-auth via
// f2-members sid-handoff (AuthGate + session.ts inherited from
// f2-compliance-review scaffold). Registered as scanner slug
// `f2-compliance-report` with client=f2.
//
// IT-F2-423 c/49bd5c92 (Mike 2026-09-23): tab selection is a query
// parameter (?tab=<slug>) instead of react-router paths. Matches the
// f2-user-compliance SPA's URL persistence pattern so deep-links +
// hard-refresh land on the correct tab, and works cleanly behind the
// scanner proxy (which routes ANY path under /scans/f2-compliance-
// report to the SPA — react-router path-based routing would need each
// path added to the proxy allowlist).
type TabSlug = 'users' | 'counts-by-month' | 'login-periods' | 'employees';
type TabDef = { slug: TabSlug; navLabel: string; element: JSX.Element };
const TABS: TabDef[] = [
  { slug: 'users',           navLabel: 'Users',           element: <Users /> },
  { slug: 'counts-by-month', navLabel: 'Counts by Month', element: <CountsByMonth /> },
  { slug: 'login-periods',   navLabel: 'Login Periods',   element: <LoginPeriods /> },
  { slug: 'employees',       navLabel: 'Employees',       element: <Employees /> },
];
const DEFAULT_TAB: TabSlug = 'users';

function readTabFromUrl(): TabSlug {
  try {
    const q = new URLSearchParams(window.location.search).get('tab');
    if (q && TABS.some((t) => t.slug === q)) return q as TabSlug;
  } catch { /* SSR / test — fall through */ }
  return DEFAULT_TAB;
}

export function App() {
  // c/5f81ecb7 (Mike 2026-09-23) — when loaded on a customer-branded
  // domain, prefix the title with the customer name so the auditor
  // sees which customer's report they're looking at. Data scoping is
  // handled inside each page via useLockedCustomerSlug.
  const { brand } = useBrand();
  const brandLabel = brand?.isCustomerBrand && brand?.slug
    ? `${brand.name || brand.slug} — F2 Compliance Report`
    : 'F2 Compliance Report';

  // c/49bd5c92 — tab state driven by ?tab=<slug>. Reading the initial
  // value from the URL keeps hard-refresh + deep-links working. When
  // the tab changes we write it back via replaceState (no history
  // spam) and dispatch a popstate so the URL bar stays in sync
  // without a full navigation.
  const [tab, setTab] = useState<TabSlug>(readTabFromUrl);
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (tab === DEFAULT_TAB) url.searchParams.delete('tab');
      else url.searchParams.set('tab', tab);
      const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
      window.history.replaceState(null, '', next);
    } catch { /* best-effort */ }
  }, [tab]);
  const activeTab = TABS.find((t) => t.slug === tab) || TABS[0];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ background: '#1f2937', padding: '12px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/" onClick={() => setTab(DEFAULT_TAB)} style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {brandLabel}
        </Link>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
          {TABS.map((t) => {
            const isActive = t.slug === tab;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTab(t.slug)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: isActive ? '#60a5fa' : '#e5e7eb',
                  textDecoration: 'none',
                }}
              >
                {t.navLabel}
              </button>
            );
          })}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '16px 20px', width: '100%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {activeTab.element}
      </main>
      <footer style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: '#6b7280', borderTop: '1px solid #374151' }}>
        F2 Compliance Report — internal use only.
      </footer>
    </div>
  );
}
