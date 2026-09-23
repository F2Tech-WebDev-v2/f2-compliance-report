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
  const url = lockedSlug
    ? `${ADMIN_URL_BASE}?customers=${encodeURIComponent(lockedSlug)}`
    : ADMIN_URL_BASE;

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
