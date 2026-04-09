import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { SiteSetting } from '@/types';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => { const { data } = await supabase.from('site_settings').select('*'); return (data ?? []) as SiteSetting[]; },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach(s => { map[s.key] = s.value ?? ''; });
      setValues(map);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      for (const s of settings ?? []) {
        if (values[s.key] !== (s.value ?? '')) {
          await supabase.from('site_settings').update({ value: values[s.key] }).eq('key', s.key);
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-settings'] }); queryClient.invalidateQueries({ queryKey: ['site-settings'] }); toast.success('Configurações salvas!'); },
  });

  const labels: Record<string, string> = {
    whatsapp_number: 'WhatsApp (número)', whatsapp_message: 'Mensagem padrão WhatsApp',
    email_contato: 'Email de contato', endereco: 'Endereço',
    telefone_alberto: 'Telefone Alberto', telefone_felipe: 'Telefone Felipe',
    instagram_url: 'Instagram URL', facebook_url: 'Facebook URL',
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Configurações</h2>
      <Card className="p-6 bg-card border-border space-y-4">
        {settings?.filter(s => !s.key.startsWith('pagseguro')).map(s => (
          <div key={s.key}>
            <label className="text-sm text-muted-foreground block mb-1">{labels[s.key] || s.key}</label>
            <Input value={values[s.key] ?? ''} onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))} />
          </div>
        ))}
        <Button onClick={() => save.mutate()}>Salvar Configurações</Button>
      </Card>
    </div>
  );
};

export default AdminSettings;
