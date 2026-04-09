import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Lightbulb, Ruler } from 'lucide-react';

interface GuiaMedidasProps {
  productName: string;
  productUnit?: string;
  trigger: ReactNode;
}

const TAMANHOS: Record<string, { label: string; sizes: string[] }> = {
  m2: { label: 'Metro Quadrado', sizes: ['1,00 x 0,50m', '1,00 x 1,00m', '2,00 x 1,00m', '3,00 x 1,00m', '5,00 x 1,00m'] },
  un: { label: 'Unidade', sizes: ['10x5cm', '20x10cm', '30x20cm', '50x30cm', 'Personalizado'] },
  ml: { label: 'Metro Linear', sizes: ['0,50m', '1,00m', '2,00m', '3,00m', '5,00m'] },
};

export function GuiaMedidas({ productName, productUnit = 'un', trigger }: GuiaMedidasProps) {
  const sizes = TAMANHOS[productUnit] || TAMANHOS['un'];

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Guia de Medidas e Arquivos — {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Formatos Aceitos */}
          <section>
            <h4 className="font-semibold mb-2 text-foreground">Formatos Aceitos</h4>
            <ul className="space-y-1">
              {['PDF (vetorial preferido)', 'AI / CDR / EPS (editáveis)', 'PNG / JPG em 300 DPI'].map(f => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> {f}
                </li>
              ))}
              {['Arquivos abaixo de 72 DPI', 'Capturas de tela / screenshots'].map(f => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </section>

          {/* Resolução */}
          <section>
            <h4 className="font-semibold mb-2 text-foreground">Resolução Mínima</h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Até 1m²: 150 DPI mínimo</li>
              <li>Acima de 1m²: 72 DPI aceitável</li>
              <li>Alta qualidade: sempre 300 DPI</li>
            </ul>
          </section>

          {/* Como Medir */}
          <section>
            <h4 className="font-semibold mb-2 text-foreground">Como Medir</h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li><strong>Largura (L):</strong> medida horizontal em centímetros</li>
              <li><strong>Altura (A):</strong> medida vertical em centímetros</li>
              <li>Inclua <strong>3cm de sangria</strong> em cada lado</li>
            </ul>
          </section>

          {/* Tamanhos Padrão */}
          <section>
            <h4 className="font-semibold mb-2 text-foreground">Tamanhos Padrão ({sizes.label})</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tamanho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.sizes.map(s => (
                  <TableRow key={s}>
                    <TableCell>{s}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Cores */}
          <section>
            <h4 className="font-semibold mb-2 text-foreground">Cores</h4>
            <p className="text-muted-foreground">Use perfil de cor <strong>CMYK</strong> para impressão. RGB pode ter variação de cor na impressão.</p>
          </section>

          {/* Dica */}
          <section className="bg-accent/50 rounded-lg p-3 flex gap-2">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Em caso de dúvida, envie sua arte e nossa equipe irá verificar e retornar em até 2h.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
