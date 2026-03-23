import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debug, setDebug] = useState<string>('iniciando');

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        setDebug('checando sessão');
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error('ProtectedRoute getSession error:', error);
          setDebug(`erro: ${error.message}`);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log('ProtectedRoute session:', data.session);
        setDebug(data.session ? 'sessão encontrada' : 'sem sessão');
        setIsAuthenticated(!!data.session);
        setLoading(false);
      } catch (err) {
        console.error('ProtectedRoute erro inesperado:', err);
        setDebug('erro inesperado');
        setIsAuthenticated(false);
        setLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('ProtectedRoute auth change:', session);
      setDebug(session ? 'auth change com sessão' : 'auth change sem sessão');
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="p-6">Carregando... ({debug})</div>;
  }

  if (!isAuthenticated) {
    //return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}