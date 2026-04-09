import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  rows?: number;
  placeholder?: string;
}

const pageFields: Record<string, FieldDef[]> = {
  home: [
    { key: 'home_hero_title', label: 'Título do Hero', type: 'text', placeholder: 'Sua mensagem com impacto visual' },
    { key: 'home_hero_subtitle', label: 'Subtítulo do Hero', type: 'textarea', rows: 3, placeholder: 'Adesivos, banners, placas...' },
  ],
  sobre: [
    { key: 'about_intro', label: 'Texto de Introdução', type: 'textarea', rows: 4, placeholder: 'A StartMídia é uma empresa...' },
    { key: 'about_history', label: 'Nossa História', type: 'textarea', rows: 4, placeholder: 'Fundada com o objetivo...' },
    { key: 'about_mission', label: 'Missão', type: 'textarea', rows: 3, placeholder: 'Nossa missão é...' },
  ],
  contato: [
    { key: 'contact_intro', label: 'Texto de Introdução', type: 'textarea', rows: 3, placeholder: 'Solicite um orçamento ou tire suas dúvidas.' },
    { key: 'contact_hours', label: 'Horário de Atendimento', type: 'textarea', rows: 2, placeholder: 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h' },
  ],
  privacidade: [
    { key: 'privacy_content', label: 'Conteúdo Completo da Política de Privacidade', type: 'textarea', rows: 20, placeholder: 'Política de Privacidade...' },
  ],
};

const tabLabels: Record<string, string> = {
  home: 'Home',
  sobre: 'Sobre',
  contato: 'Contato',
  privacidade: 'Privacidade',
};

const AdminPageEditor = () => {
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Initialize from current settings
    const allKeys = Object.values(pageFields).flat().map(f => f.key);
    const init: Record<string, string> = {};
    allKeys.forEach(k => { init[k] = settings[k] ?? ''; });
    setValues(init);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields = pageFields[activeTab];
      for (const field of fields) {
        const val = values[field.key] ?? '';
        // Try update first
        const { data: updated } = await supabase
          .from('site_settings')
          .update({ value: val, updated_at: new Date().toISOString() })
          .eq('key', field.key)
          .select();

        if (!updated?.length) {
          await supabase.from('site_settings').insert({ key: field.key, value: val });
        }
      }
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success(`Página "${tabLabels[activeTab]}" salva com sucesso!`);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Editor de Páginas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {Object.entries(tabLabels).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(pageFields).map(([tab, fields]) => (
          <TabsContent key={tab} value={tab}>
            <Card className="p-6 border-border space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Edite o conteúdo da página "{tabLabels[tab]}". Deixe em branco para usar o texto padrão.
              </p>
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium mb-1 block">{f.label}</label>
                  {f.type === 'text' ? (
                    <Input
                      value={values[f.key] ?? ''}
                      onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  ) : (
                    <Textarea
                      value={values[f.key] ?? ''}
                      onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                      rows={f.rows}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
              <Button onClick={handleSave} disabled={saving} className="mt-4">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar {tabLabels[tab]}
              </Button>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminPageEditor;
