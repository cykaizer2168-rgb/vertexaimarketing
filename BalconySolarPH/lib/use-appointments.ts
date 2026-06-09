'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createBrowserSupabase } from './supabase-browser';
import type { Appointment } from './supabase';

export type ApptWithLead = Appointment & { leads?: { name: string | null } | null };

export function useAppointments() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [appointments, setAppointments] = useState<ApptWithLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, leads(name)')
      .order('scheduled_at', { ascending: true });
    setAppointments((data as ApptWithLead[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { appointments, loading, refetch: fetch };
}
