import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImageEditor } from '@/components/ui/image-editor';
import { ImagePlus, X, Pencil, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadWithEditorProps {
  onImageReady: (file: File) => void;
  currentUrl?: string;
  aspectRatio?: number;
  maxSizeMB?: number;
  className?: string;
  placeholder?: string;
}

export const ImageUploadWithEditor = ({
  onImageReady, currentUrl, aspectRatio, maxSizeMB = 5, className, placeholder = 'Clique para selecionar imagem',
}: ImageUploadWithEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const displayUrl = previewUrl || currentUrl;

  const processFile = useCallback((file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Arquivo excede ${maxSizeMB}MB`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem');
      return;
    }
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setEditorOpen(true);
  }, [maxSizeMB]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  }, [processFile]);

  const handleApply = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    onImageReady(file);
  }, [previewUrl, onImageReady]);

  const handleUseOriginal = useCallback(() => {
    if (originalFile) onImageReady(originalFile);
  }, [originalFile, onImageReady]);

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setOriginalFile(null);
  }, [previewUrl]);

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {!displayUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer p-6 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            className,
          )}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{placeholder}</p>
          <p className="text-xs text-muted-foreground">ou arraste e solte aqui</p>
        </div>
      ) : (
        <div className={cn('relative group rounded-lg overflow-hidden border border-border', className)}>
          <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" size="icon" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>
            {previewUrl && (
              <Button type="button" size="icon" variant="secondary" onClick={() => setEditorOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" size="icon" variant="destructive" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {previewUrl && (
        <ImageEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          imageSrc={previewUrl}
          onApply={handleApply}
          onUseOriginal={handleUseOriginal}
          aspectRatio={aspectRatio}
        />
      )}
    </>
  );
};
