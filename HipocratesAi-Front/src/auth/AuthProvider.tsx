import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type DoctorProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  crm: string | null;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  doctor: DoctorProfile | null;
  refreshDoctor: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchDoctorProfile(userId: string): Promise<DoctorProfile | null> {
  console.log('[AuthProvider] fetchDoctorProfile:start', userId);

  const { data, error } = await supabase
    .schema('app')
    .from('doctors')
    .select('id, full_name, email, phone, specialty, crm')
    .eq('id', userId)
    .maybeSingle();

  console.log('[AuthProvider] fetchDoctorProfile:data', data);
  console.log('[AuthProvider] fetchDoctorProfile:error', error);

  if (error) {
    throw error;
  }

  return data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);

  async function refreshDoctor() {
    if (!user?.id) {
      setDoctor(null);
      return;
    }

    try {
      const doctorProfile = await fetchDoctorProfile(user.id);
      setDoctor(doctorProfile);
    } catch (error) {
      console.error('[AuthProvider] refreshDoctor:error', error);
      setDoctor(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setDoctor(null);
    setSession(null);
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        console.log('[AuthProvider] bootstrap:start');

        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error('[AuthProvider] getSession:error', error);
          setSession(null);
          setUser(null);
          setDoctor(null);
          setLoading(false);
          return;
        }

        const currentSession = data.session ?? null;
        const currentUser = currentSession?.user ?? null;

        console.log('[AuthProvider] bootstrap:session', currentSession);
        console.log('[AuthProvider] bootstrap:user', currentUser);

        setSession(currentSession);
        setUser(currentUser);

        // libera a UI imediatamente após confirmar auth
        setLoading(false);

        // perfil médico é complementar; não deve bloquear a agenda
        if (currentUser?.id) {
          fetchDoctorProfile(currentUser.id)
            .then(doctorProfile => {
              if (!active) return;
              setDoctor(doctorProfile);
            })
            .catch(err => {
              if (!active) return;
              console.error('[AuthProvider] bootstrap:doctor:error', err);
              setDoctor(null);
            });
        } else {
          setDoctor(null);
        }
      } catch (err) {
        if (!active) return;
        console.error('[AuthProvider] bootstrap:unexpected', err);
        setSession(null);
        setUser(null);
        setDoctor(null);
        setLoading(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[AuthProvider] onAuthStateChange', _event, newSession);

      const newUser = newSession?.user ?? null;

      setSession(newSession ?? null);
      setUser(newUser);
      setLoading(false);

      if (newUser?.id) {
        fetchDoctorProfile(newUser.id)
          .then(doctorProfile => {
            if (!active) return;
            setDoctor(doctorProfile);
          })
          .catch(err => {
            if (!active) return;
            console.error('[AuthProvider] onAuthStateChange:doctor:error', err);
            setDoctor(null);
          });
      } else {
        setDoctor(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      doctor,
      refreshDoctor,
      signOut,
    }),
    [loading, session, user, doctor]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
