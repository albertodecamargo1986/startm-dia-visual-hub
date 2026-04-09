import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUploadWithEditor } from '@/components/ui/image-upload-with-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImagePlus, Download, CheckCircle2 } from 'lucide-react';

interface Variation {
  key: string;
  label: string;
  width: number;
  height: number;
  note: string;
  square?: boolean;
}

const VARIATIONS: Variation[] = [
  { key: 'site_logo_url', label: 'Header', width: 200, height: 40, note: 'Fundo transparente' },
  { key: 'site_logo_footer', label: 'Footer', width: 250, height: 50, note: 'Visível em fundo escuro' },
  { key: 'site_logo_mobile', label: 'Menu Mobile', width: 160, height: 32, note: 'Versão compacta' },
  { key: 'site_logo_favicon', label: 'Favicon', width: 32, height: 32, note: 'Recorte quadrado', square: true },
];

type BgOption = 'transparent' | 'white' | 'dark';

interface LogoUploadManagerProps {
  currentUrls: Record<string, string>;
  onSaved: (urls: Record<string, string>) => void;
}

function resizeImage(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  bg: BgOption,
  square?: boolean,
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;

    if (bg === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bg === 'dark') {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    if (square) {
      // center crop to square then resize
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, targetW, targetH);
    } else {
      // contain
      const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (targetW - w) / 2;
      const y = (targetH - h) / 2;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
    }

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export const LogoUploadManager = ({ currentUrls, onSaved }: LogoUploadManagerProps) => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [bgOption, setBgOption] = useState<BgOption>('transparent');
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);

  const generateVariations = useCallback(async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise<void>((r) => { img.onload = () => r(); });

    const newPreviews: Record<string, string> = {};
    const newBlobs: Record<string, Blob> = {};

    for (const v of VARIATIONS) {
      const blob = await resizeImage(img, v.width, v.height, bgOption, v.square);
      newBlobs[v.key] = blob;
      newPreviews[v.key] = URL.createObjectURL(blob);
    }

    URL.revokeObjectURL(url);
    setPreviews(newPreviews);
    setBlobs(newBlobs);
    setGenerated(true);
  }, [bgOption]);

  const handleImageReady = useCallback((file: File) => {
    setSourceFile(file);
    setGenerated(false);
    setPreviews({});
    setBlobs({});
    generateVariations(file);
  }, [generateVariations]);

  const regenerate = useCallback(() => {
    if (sourceFile) generateVariations(sourceFile);
  }, [sourceFile, generateVariations]);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    setProgress(0);
    try {
      const urls: Record<string, string> = {};
      const keys = Object.keys(blobs);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const path = `${key.replace('site_', '')}-${Date.now()}.png`;
        const { error } = await supabase.storage.from('banners').upload(path, blobs[key], { contentType: 'image/png' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path);
        urls[key] = publicUrl;
        setProgress(((i + 1) / keys.length) * 100);
      }
      onSaved(urls);
      toast.success('Todas as variações da logo foram salvas!');
    } catch {
      toast.error('Erro ao salvar variações');
    } finally {
      setSaving(false);
    }
  }, [blobs, onSaved]);

  return (
    <div className="space-y-4">
      {/* Info table */}
      <Card className="p-4 bg-muted/30 border-border">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" />
          Tamanhos gerados automaticamente
        </h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Local</TableHead>
              <TableHead>Dimensão</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VARIATIONS.map(v => (
              <TableRow key={v.key}>
                <TableCell className="font-medium">{v.label}</TableCell>
                <TableCell>{v.width} × {v.height}px</TableCell>
                <TableCell>PNG</TableCell>
                <TableCell className="text-muted-foreground">{v.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Upload */}
      <div>
        <label className="text-sm text-muted-foreground block mb-1">Enviar logo original (alta resolução)</label>
        <ImageUploadWithEditor
          onImageReady={handleImageReady}
          currentUrl={currentUrls.site_logo_url || undefined}
          maxSizeMB={5}
          placeholder="Clique para enviar a logo"
          className="h-32 max-w-xs"
        />
      </div>

      {/* Background option */}
      {sourceFile && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Fundo das variações:</label>
          <Select value={bgOption} onValueChange={(v) => { setBgOption(v as BgOption); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">Transparente (PNG)</SelectItem>
              <SelectItem value="white">Fundo Branco</SelectItem>
              <SelectItem value="dark">Fundo Escuro</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={regenerate}>Regenerar</Button>
        </div>
      )}

      {/* Previews */}
      {generated && Object.keys(previews).length > 0 && (
        <Card className="p-4 border-border space-y-3">
          <h4 className="text-sm font-medium">Pré-visualização das variações</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VARIATIONS.map(v => (
              <div key={v.key} className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{v.label} ({v.width}×{v.height})</p>
                <div
                  className="rounded border border-border flex items-center justify-center p-2"
                  style={{
                    background: v.key.includes('footer') ? '#1a1a2e' : '#f5f5f5',
                    minHeight: 60,
                  }}
                >
                  {previews[v.key] && (
                    <img src={previews[v.key]} alt={v.label} style={{ maxWidth: v.width, maxHeight: v.height }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {saving && <Progress value={progress} className="h-2" />}

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? 'Salvando...' : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Gerar e Salvar Todas as Versões
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Current logos */}
      {!generated && Object.values(currentUrls).some(Boolean) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VARIATIONS.map(v => currentUrls[v.key] ? (
            <div key={v.key} className="space-y-1">
              <p className="text-xs text-muted-foreground">{v.label} atual</p>
              <div className="rounded border border-border flex items-center justify-center p-2 bg-muted/30" style={{ minHeight: 50 }}>
                <img src={currentUrls[v.key]} alt={v.label} className="max-h-10" />
              </div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
};
