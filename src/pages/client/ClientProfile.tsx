import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageUploadWithEditor } from '@/components/ui/image-upload-with-editor';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const emptyAddress: AddressData = { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' };

const ClientProfile = () => {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    cpf_cnpj: profile?.cpf_cnpj ?? '',
    company_name: profile?.company_name ?? '',
  });

  const [address, setAddress] = useState<AddressData>(emptyAddress);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        cpf_cnpj: profile.cpf_cnpj ?? '',
        company_name: profile.company_name ?? '',
      });
      const da = (profile as any).default_address as AddressData | null;
      if (da) setAddress({ ...emptyAddress, ...da });
    }
  }, [profile]);

  const initials = (profile?.full_name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleCepBlur = async () => {
    const cep = address.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch { /* ignore */ }
  };

  const handleAvatarReady = useCallback(async (file: File) => {
    if (!profile) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.user_id}/avatar.${ext}`;
    await supabase.storage.from('customer-files').upload(path, file, { upsert: true, cacheControl: '3600' });
    const { data: { publicUrl } } = supabase.storage.from('customer-files').getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    toast.success('Avatar atualizado!');
  }, [profile, updateProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { error } = await supabase.from('profiles').update({
      ...form,
      default_address: address as any,
    } as any).eq('id', profile.id);

    if (error) toast.error('Erro ao salvar.');
    else toast.success('Perfil atualizado!');
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error('Erro ao enviar email de reset.');
    else toast.success('Email de redefinição de senha enviado!');
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Meu Perfil</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-xs">
          <p className="font-display text-lg mb-2">{profile?.full_name}</p>
          <ImageUploadWithEditor
            onImageReady={handleAvatarReady}
            currentUrl={profile?.avatar_url || undefined}
            aspectRatio={1}
            maxSizeMB={2}
            placeholder="Alterar foto de perfil"
            className="h-20"
          />
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Nome completo</label>
            <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Email</label>
            <Input value={profile?.email ?? ''} disabled />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Telefone</label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">CPF/CNPJ</label>
            <Input value={form.cpf_cnpj} onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Empresa</label>
            <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
          </div>

          <h3 className="font-display text-lg pt-4">Endereço Padrão</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-sm text-muted-foreground block mb-1">CEP</label>
              <Input value={address.cep} onChange={e => setAddress(p => ({ ...p, cep: e.target.value }))} onBlur={handleCepBlur} placeholder="00000-000" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-muted-foreground block mb-1">Rua</label>
              <Input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Número</label>
              <Input value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-muted-foreground block mb-1">Complemento</label>
              <Input value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Bairro</label>
              <Input value={address.neighborhood} onChange={e => setAddress(p => ({ ...p, neighborhood: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Cidade</label>
              <Input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Estado</label>
              <Input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} maxLength={2} />
            </div>
          </div>

          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </form>
      </Card>

      {/* Security */}
      <Card className="p-6 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Segurança</h3>
        <Button variant="outline" onClick={handleResetPassword}>
          <KeyRound className="h-4 w-4 mr-2" />Alterar Senha
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Um email será enviado para redefinir sua senha.</p>
      </Card>
    </div>
  );
};

export default ClientProfile;
