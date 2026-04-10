import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  type LabelFormat,
  type LabelShape,
  ALL_FORMATS,
  createFormat,
} from '@/lib/label-formats';
import { toast } from 'sonner';

const STORAGE_KEY = 'label_custom_formats';

export function useLabelFormats() {
  const [customFormats, setCustomFormats] = useState<LabelFormat[]>([]);
  const [loading, setLoading] = useState(false);

  // Load custom formats from localStorage (instant) then sync with backend
  useEffect(() => {
    const loadFormats = async () => {
      // 1. Load from localStorage immediately
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setCustomFormats(JSON.parse(stored));
        } catch { /* ignore parse errors */ }
      }

      // 2. Sync with backend if authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('label_custom_formats' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formats: LabelFormat[] = (data as any[]).map((row: any) => ({
            id: row.id,
            label: row.name,
            name: row.name,
            shape: row.shape as LabelShape,
            widthMm: Number(row.width_mm),
            heightMm: Number(row.height_mm),
            widthPx: row.width_px,
            heightPx: row.height_px,
            cornerRadiusMm: row.corner_radius_mm,
            isCustom: true,
            createdAt: row.created_at,
          }));
          setCustomFormats(formats);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formats));
        }
      } finally {
        setLoading(false);
      }
    };

    loadFormats();
  }, []);

  const saveCustomFormat = useCallback(async (
    shape: LabelShape,
    widthMm: number,
    heightMm: number,
    name: string,
    cornerRadiusMm?: number,
  ): Promise<LabelFormat | null> => {
    if (widthMm < 10 || widthMm > 300) {
      toast.error('Largura deve estar entre 10mm e 300mm');
      return null;
    }
    if (heightMm < 10 || heightMm > 300) {
      toast.error('Altura deve estar entre 10mm e 300mm');
      return null;
    }
    if (!name.trim()) {
      toast.error('Digite um nome para o formato');
      return null;
    }

    const newFormat = createFormat(shape, widthMm, heightMm, name, cornerRadiusMm, true);

    // Optimistic update
    const updated = [newFormat, ...customFormats];
    setCustomFormats(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Sync with backend
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      const { error } = await supabase
        .from('label_custom_formats' as any)
        .insert({
          name: newFormat.name ?? newFormat.label,
          shape: newFormat.shape,
          width_mm: newFormat.widthMm,
          height_mm: newFormat.heightMm,
          width_px: newFormat.widthPx,
          height_px: newFormat.heightPx,
          corner_radius_mm: newFormat.cornerRadiusMm,
          user_id: session.session.user.id,
        } as any);

      if (error) {
        toast.error('Erro ao salvar formato no servidor');
      } else {
        toast.success('Formato salvo com sucesso!');
      }
    }

    return newFormat;
  }, [customFormats]);

  const deleteCustomFormat = useCallback(async (formatId: string) => {
    const updated = customFormats.filter((f) => f.id !== formatId);
    setCustomFormats(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      await supabase
        .from('label_custom_formats' as any)
        .delete()
        .eq('id', formatId);
    }

    toast.success('Formato removido');
  }, [customFormats]);

  const renameCustomFormat = useCallback(async (
    formatId: string,
    newName: string,
  ) => {
    const updated = customFormats.map((f) =>
      f.id === formatId ? { ...f, name: newName, label: newName } : f,
    );
    setCustomFormats(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      await supabase
        .from('label_custom_formats' as any)
        .update({ name: newName } as any)
        .eq('id', formatId);
    }
  }, [customFormats]);

  const allFormats = [...ALL_FORMATS, ...customFormats];

  return {
    customFormats,
    allFormats,
    loading,
    saveCustomFormat,
    deleteCustomFormat,
    renameCustomFormat,
  };
}
