"use client";

import { useEffect, useState } from "react";

export function useSrdData<T>(loader: () => Promise<T>, deps: unknown[]): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset stale data before the new fetch resolves
    setData(null);
    loader().then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
