import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw } from 'lucide-react';

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const defaultFilters: Filters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 };

const filterConfig = [
  { key: 'brightness' as const, label: 'Brilho', min: 0, max: 200 },
  { key: 'contrast' as const, label: 'Contraste', min: 0, max: 200 },
  { key: 'saturation' as const, label: 'Saturação', min: 0, max: 200 },
  { key: 'grayscale' as const, label: 'P&B', min: 0, max: 100 },
  { key: 'sepia' as const, label: 'Sépia', min: 0, max: 100 },
  { key: 'blur' as const, label: 'Desfoque', min: 0, max: 10 },
];

const aspectOptions = [
  { label: 'Livre', value: undefined },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:5', value: 16 / 5 },
];

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onApply: (file: File) => void;
  onUseOriginal: () => void;
  aspectRatio?: number;
}

export const ImageEditor = ({ open, onOpenChange, imageSrc, onApply, onUseOriginal, aspectRatio }: ImageEditorProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspectRatio);

  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setFilters(defaultFilters);
      setSelectedAspect(aspectRatio);
    }
  }, [open, aspectRatio]);

  const cssFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      sx = completedCrop.x * scaleX;
      sy = completedCrop.y * scaleY;
      sw = completedCrop.width * scaleX;
      sh = completedCrop.height * scaleY;
    }

    canvas.width = sw;
    canvas.height = sh;
    ctx.filter = cssFilter;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
        onApply(file);
        onOpenChange(false);
      }
    }, 'image/jpeg', 0.92);
  }, [completedCrop, cssFilter, onApply, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Imagem</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="crop" className="space-y-3">
          <TabsList>
            <TabsTrigger value="crop">Recorte</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {aspectOptions.map(a => (
                <Button key={a.label} size="sm" variant={selectedAspect === a.value ? 'default' : 'outline'}
                  onClick={() => { setSelectedAspect(a.value); setCrop(undefined); }}>
                  {a.label}
                </Button>
              ))}
            </div>
            <div className="flex justify-center bg-muted/30 rounded-lg p-2 max-h-[50vh] overflow-auto">
              <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={selectedAspect}>
                <img ref={imgRef} src={imageSrc} alt="Edit" style={{ filter: cssFilter, maxHeight: '45vh' }} crossOrigin="anonymous" />
              </ReactCrop>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="flex justify-center bg-muted/30 rounded-lg p-2 max-h-[40vh] overflow-auto">
              <img src={imageSrc} alt="Preview" style={{ filter: cssFilter, maxHeight: '35vh' }} />
            </div>
            <div className="space-y-3">
              {filterConfig.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">{f.label}</span>
                  <Slider min={f.min} max={f.max} step={1} value={[filters[f.key]]}
                    onValueChange={([v]) => setFilters(prev => ({ ...prev, [f.key]: v }))} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-10 text-right">{filters[f.key]}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)}>
                <RotateCcw className="h-3 w-3 mr-1" />Resetar Filtros
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onUseOriginal(); onOpenChange(false); }}>Usar Original</Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
