'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { type Prospect } from './supabase';
import { createBrowserSupabase } from './supabase-browser';

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false });
    setProspects((data as Prospect[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { prospects, loading, refetch: fetch };
}
