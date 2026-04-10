import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CmsImageUploadProps {
  value: string;
  alt?: string;
  onChange: (url: string) => void;
  onAltChange?: (alt: string) => void;
  showAlt?: boolean;
  label?: string;
}

const BUCKET = 'banners'; // reuse public bucket

export const CmsImageUpload = ({ value, alt = '', onChange, onAltChange, showAlt = true, label = 'Imagem' }: CmsImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens são permitidas'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `cms/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 items-start">
        {value ? (
          <div className="relative w-20 h-20 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
            <img src={value} alt={alt} className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange('')} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded border border-dashed border-border flex items-center justify-center bg-muted/30 flex-shrink-0">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="URL da imagem" value={value} onChange={e => onChange(e.target.value)} className="text-sm h-8" />
            <Button type="button" variant="outline" size="sm" className="h-8 flex-shrink-0" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            </Button>
          </div>
          {showAlt && onAltChange && (
            <Input placeholder="Texto alternativo (alt) *" value={alt} onChange={e => onAltChange(e.target.value)} className="text-sm h-8" />
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};
