import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileIcon, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GuiaMedidas } from '@/components/GuiaMedidas';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  showGuide?: boolean;
  productName?: string;
  productUnit?: string;
  progress?: number;
}

export function FileUploadZone({
  onFileSelect,
  acceptedTypes = ['.pdf', '.ai', '.cdr', '.eps', '.png', '.jpg', '.jpeg', '.webp'],
  maxSizeMB = 50,
  multiple = false,
  showGuide = false,
  productName = 'Produto',
  productUnit,
  progress,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.size <= maxSizeMB * 1024 * 1024);
    setSelectedFiles(prev => multiple ? [...prev, ...arr] : arr);
    onFileSelect(arr);
  }, [maxSizeMB, multiple, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Clique ou arraste arquivos aqui</p>
        <p className="text-xs text-muted-foreground mt-1">
          {acceptedTypes.join(', ').toUpperCase()} — Máx. {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <ul className="space-y-2">
          {selectedFiles.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
              {isImage(file) ? (
                <img src={URL.createObjectURL(file)} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <FileIcon className="h-10 w-10 text-muted-foreground p-2" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFile(i)}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {showGuide && (
        <GuiaMedidas
          productName={productName}
          productUnit={productUnit}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Ruler className="h-4 w-4" /> Guia de Medidas
            </Button>
          }
        />
      )}
    </div>
  );
}
