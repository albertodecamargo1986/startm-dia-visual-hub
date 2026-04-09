import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const ClientProfile = () => {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    cpf_cnpj: profile?.cpf_cnpj ?? '',
    company_name: profile?.company_name ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id);
    if (error) toast.error('Erro ao salvar.');
    else toast.success('Perfil atualizado!');
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Meu Perfil</h2>
      <Card className="p-6 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div><label className="text-sm text-muted-foreground block mb-1">Nome completo</label>
            <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Email</label>
            <Input value={profile?.email ?? ''} disabled /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Telefone</label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">CPF/CNPJ</label>
            <Input value={form.cpf_cnpj} onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))} /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Empresa</label>
            <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </form>
      </Card>
    </div>
  );
};

export default ClientProfile;
