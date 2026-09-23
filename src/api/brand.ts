// IT-F2-421 c/5f81ecb7 (Mike 2026-09-23): brand detection so the SPA
// hard-scopes to the customer whose branded domain it's being loaded
// on. Same shape used by f2-user-compliance / f2-gap-up-down /
// OnboardingPanel — fetch /rest/api/brand-config?host=<current> once
// on mount, cache module-level for the session.

import { useEffect, useState } from 'react';

export type Brand = {
  slug: string;
  name?: string;
  isCustomerBrand?: boolean;
};

let _cached: Brand | null | undefined = undefined;
let _inflight: Promise<Brand | null> | null = null;

async function _fetchBrand(): Promise<Brand | null> {
  if (_cached !== undefined) return _cached;
  if (_inflight) return _inflight;
  _inflight = (async () => {
    try {
      const host = window.location.hostname;
      const res = await fetch(`/rest/api/brand-config?host=${encodeURIComponent(host)}`);
      if (!res.ok) { _cached = null; return null; }
      const body = await res.json();
      if (body && typeof body.slug === 'string') {
        _cached = body as Brand;
        return _cached;
      }
      _cached = null;
      return null;
    } catch {
      _cached = null;
      return null;
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

export function useBrand(): { brand: Brand | null; loading: boolean } {
  const [brand, setBrand] = useState<Brand | null>(() => (_cached === undefined ? null : _cached));
  const [loading, setLoading] = useState(_cached === undefined);
  useEffect(() => {
    let cancelled = false;
    _fetchBrand().then((b) => {
      if (cancelled) return;
      setBrand(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  return { brand, loading };
}

// Convenience: the customer slug to scope backend queries to. Returns
// the brand slug when the current host is a customer-branded domain;
// null when this is the F2 default hub (SPA can either default to
// 'f2' or leave the query unscoped — page's choice).
export function useLockedCustomerSlug(): string | null {
  const { brand } = useBrand();
  if (brand?.isCustomerBrand && brand?.slug) return brand.slug;
  return null;
}
