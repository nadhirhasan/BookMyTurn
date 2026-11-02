import { useEffect, useState } from 'react';

export function useFreshness(checkedAt: number | null, error: string | null) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 5000); return () => clearInterval(timer); }, []);
  return { stale: !!error || checkedAt === null || clock - checkedAt > 45000, lastUpdated: checkedAt };
}
