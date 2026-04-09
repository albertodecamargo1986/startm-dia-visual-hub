import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LogoUploadManager } from '@/components/admin/LogoUploadManager';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { SiteSetting } from '@/types';

const LOGO_KEYS = ['site_logo_url', 'site_logo_footer', 'site_logo_mobile', 'site_logo_favicon'];

const sections = [
  {
    title: 'Contato',
    keys: [
      { key: 'whatsapp_number', label: 'WhatsApp (número)', type: 'text' },
      { key: 'whatsapp_message', label: 'Mensagem padrão WhatsApp', type: 'text' },
      { key: 'email_contato', label: 'Email de contato', type: 'text' },
      { key: 'endereco', label: 'Endereço', type: 'text' },
      { key: 'telefone_alberto', label: 'Telefone Alberto', type: 'text' },
      { key: 'telefone_felipe', label: 'Telefone Felipe', type: 'text' },
    ],
  },
  {
    title: 'Redes Sociais',
    keys: [
      { key: 'instagram_url', label: 'Instagram URL', type: 'text' },
      { key: 'facebook_url', label: 'Facebook URL', type: 'text' },
    ],
  },
  {
    title: 'PagSeguro',
    keys: [
      { key: 'pagseguro_email', label: 'Email PagSeguro', type: 'text' },
      { key: 'pagseguro_token', label: 'Token PagSeguro', type: 'password' },
      { key: 'pagseguro_sandbox', label: 'Modo Sandbox', type: 'toggle' },
    ],
  },
];

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

  const handleLogoSaved = useCallback((urls: Record<string, string>) => {
    setValues(p => ({ ...p, ...urls }));
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const allKeys = [...sections.flatMap(s => s.keys.map(k => k.key)), ...LOGO_KEYS];
      for (const key of allKeys) {
        const existing = settings?.find(s => s.key === key);
        if (existing) {
          if (values[key] !== (existing.value ?? '')) {
            await supabase.from('site_settings').update({ value: values[key] }).eq('key', key);
          }
        } else if (values[key]) {
          await supabase.from('site_settings').insert({ key, value: values[key] });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Configurações salvas!');
    },
  });

  const logoUrls: Record<string, string> = {};
  LOGO_KEYS.forEach(k => { if (values[k]) logoUrls[k] = values[k]; });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Configurações</h2>

      {/* Logo Section */}
      <Card className="p-6 bg-card border-border space-y-4">
        <h3 className="font-display text-lg">Identidade Visual — Logo</h3>
        <Separator />
        <LogoUploadManager currentUrls={logoUrls} onSaved={handleLogoSaved} />
      </Card>

      {sections.map(section => (
        <Card key={section.title} className="p-6 bg-card border-border space-y-4">
          <h3 className="font-display text-lg">{section.title}</h3>
          <Separator />
          {section.keys.map(k => (
            <div key={k.key}>
              <label className="text-sm text-muted-foreground block mb-1">{k.label}</label>
              {k.type === 'toggle' ? (
                <Switch
                  checked={values[k.key] === 'true'}
                  onCheckedChange={v => setValues(p => ({ ...p, [k.key]: v ? 'true' : 'false' }))}
                />
              ) : (
                <Input
                  type={k.type}
                  value={values[k.key] ?? ''}
                  onChange={e => setValues(p => ({ ...p, [k.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </Card>
      ))}

      <Button onClick={() => save.mutate()} className="w-full sm:w-auto"><Save className="h-4 w-4 mr-2" />Salvar Configurações</Button>
    </div>
  );
};

export default AdminSettings;
