import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
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
// Per-tab claim gating is deliberately NOT wired here — the sibling
// f2-compliance-review has 15 fine-grained tabs, but this SPA is 4
// coarser panels all gated by the same Scanners.f2-compliance-report.
// RoleAccess (admin-only). Add claim keys + hasTabClaim filter here
// later if Mike wants per-tab gating on this SPA too.
type TabDef = { path: string; navLabel: string; element: JSX.Element; end?: boolean };
const TABS: TabDef[] = [
  { path: '/',                navLabel: 'Users',           element: <Users />,          end: true },
  { path: '/counts-by-month', navLabel: 'Counts by Month', element: <CountsByMonth /> },
  { path: '/login-periods',   navLabel: 'Login Periods',   element: <LoginPeriods /> },
  { path: '/employees',       navLabel: 'Employees',       element: <Employees /> },
];

export function App() {
  // c/5f81ecb7 (Mike 2026-09-23) — when loaded on a customer-branded
  // domain, prefix the title with the customer name so the auditor
  // sees which customer's report they're looking at. Data scoping is
  // handled inside each page via useLockedCustomerSlug.
  const { brand } = useBrand();
  const brandLabel = brand?.isCustomerBrand && brand?.slug
    ? `${brand.name || brand.slug} — F2 Compliance Report`
    : 'F2 Compliance Report';
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ background: '#1f2937', padding: '12px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/" style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {brandLabel}
        </Link>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
          {TABS.map((t) => (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.end}
              style={({ isActive }) => ({ color: isActive ? '#60a5fa' : '#e5e7eb', textDecoration: 'none' })}
            >
              {t.navLabel}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '16px 20px', width: '100%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Routes>
          {TABS.map((t) => (
            <Route key={t.path} path={t.path} element={t.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: '#6b7280', borderTop: '1px solid #374151' }}>
        F2 Compliance Report — internal use only.
      </footer>
    </div>
  );
}
