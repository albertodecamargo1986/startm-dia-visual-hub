import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { CustomerFile } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  in_review: 'bg-blue-500/20 text-blue-400',
};

const ClientFiles = () => {
  const { data: files, isLoading } = useQuery({
    queryKey: ['my-files'],
    queryFn: async () => {
      const { data } = await supabase.from('customer_files').select('*').order('uploaded_at', { ascending: false });
      return (data ?? []) as CustomerFile[];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Meus Arquivos</h2>
      {!files?.length ? (
        <p className="text-muted-foreground">Nenhum arquivo enviado ainda.</p>
      ) : (
        files.map(f => (
          <Card key={f.id} className="p-4 bg-card border-border flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{f.file_name}</p>
              <p className="text-xs text-muted-foreground">{f.file_type} · {((f.file_size ?? 0) / 1024).toFixed(0)} KB</p>
            </div>
            <Badge className={statusColors[f.status ?? 'pending']}>{f.status}</Badge>
          </Card>
        ))
      )}
    </div>
  );
};

export default ClientFiles;
