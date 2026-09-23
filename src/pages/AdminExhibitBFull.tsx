import { useLockedCustomerSlug } from '../api/brand';

/**
 * IT-F2-416 c/99b4a765 (Mike 2026-09-23): iframe the full admin
 * compliance-report page inside f2-compliance-report so all its
 * features (36-col NYSE Exhibit B, TSV copy-to-clipboard, pipe-
 * delimited download, per-user pro-access toggle, view-mode switch)
 * are available here without waiting on the ~2300-line Angular port.
 *
 * Companion to the AdminComplianceReportPanel over in
 * f2-user-compliance (IT-F2-400 c/b31091c7) — same iframe target,
 * same customer-slug prefix pattern, different host SPA.
 */

const ADMIN_URL_BASE = 'https://admin.f2-tech.ai/admin/compliance-report';

export function AdminExhibitBFull() {
  const lockedSlug = useLockedCustomerSlug();
  // c/8dee8450 (Mike 2026-09-23) — append ?stroute=1 so the admin app
  // renders in chromeless / standalone mode (auth.service.ts:283
  // reads the stroute query param and hides the sidebar + F2 top
  // title bar). Report content only, no admin chrome bleeding through.
  const qs = new URLSearchParams();
  qs.set('stroute', '1');
  if (lockedSlug) qs.set('customers', lockedSlug);
  const url = `${ADMIN_URL_BASE}?${qs.toString()}`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <iframe
        src={url}
        key={url}
        title="Admin compliance report — Exhibit B / SIP (full)"
        style={{ flex: 1, width: '100%', border: 0, background: 'white' }}
      />
    </div>
  );
}
