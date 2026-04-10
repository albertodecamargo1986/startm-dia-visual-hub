import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LabelProject {
  id: string;
  name: string;
  status: string;
  label_shape: string;
  width_mm: number;
  height_mm: number;
  canvas_json: any;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useLabelProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<LabelProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('label_projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setProjects(data as unknown as LabelProject[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (params: { name: string; label_shape: string; width_mm: number; height_mm: number }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('label_projects')
      .insert({ ...params, user_id: user.id, canvas_json: {} } as any)
      .select()
      .single();
    if (error) { toast.error('Erro ao criar projeto'); return null; }
    await fetchProjects();
    return data as unknown as LabelProject;
  };

  const saveProject = async (id: string, canvas_json: any) => {
    const { error } = await supabase
      .from('label_projects')
      .update({ canvas_json } as any)
      .eq('id', id);
    if (error) toast.error('Erro ao salvar');
    return !error;
  };

  const saveVersion = async (id: string, canvas_json: any) => {
    // Get current max version
    const { data: versions } = await supabase
      .from('label_project_versions')
      .select('version')
      .eq('project_id', id)
      .order('version', { ascending: false })
      .limit(1);
    const nextVersion = ((versions as any)?.[0]?.version || 0) + 1;
    await supabase.from('label_project_versions').insert({
      project_id: id,
      version: nextVersion,
      snapshot: canvas_json,
    } as any);
    toast.success(`Versão ${nextVersion} salva`);
  };

  const deleteProject = async (id: string) => {
    await supabase.from('label_projects').delete().eq('id', id);
    await fetchProjects();
  };

  return { projects, loading, createProject, saveProject, saveVersion, deleteProject, refetch: fetchProjects };
}

export function useAutoSave(projectId: string | null, getCanvasJson: () => any, intervalMs = 12000) {
  const lastJson = useRef<string>('');
  const dirty = useRef(false);

  const markDirty = useCallback(() => { dirty.current = true; }, []);

  useEffect(() => {
    if (!projectId) return;
    const timer = setInterval(async () => {
      if (!dirty.current) return;
      const json = getCanvasJson();
      const jsonStr = JSON.stringify(json);
      if (jsonStr === lastJson.current) return;
      lastJson.current = jsonStr;
      dirty.current = false;
      await supabase.from('label_projects').update({ canvas_json: json } as any).eq('id', projectId);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [projectId, getCanvasJson, intervalMs]);

  return { markDirty };
}
