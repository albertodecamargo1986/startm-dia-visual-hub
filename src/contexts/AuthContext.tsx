import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, RegisterData } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, isAdmin: false, isSuperAdmin: false,
  loading: true, login: async () => {}, register: async () => {},
  logout: async () => {}, signOut: async () => {}, updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    setProfile(data);
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'super_admin') ?? false);
    setIsSuperAdmin(roles?.some(r => r.role === 'super_admin') ?? false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (data: RegisterData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName, phone: data.phone } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', profile.id);
    if (error) { toast.error('Erro ao atualizar perfil'); throw error; }
    setProfile(prev => prev ? { ...prev, ...data } : prev);
    toast.success('Perfil atualizado!');
  };

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null, profile, isAdmin, isSuperAdmin,
      loading, login, register, logout, signOut: logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
