import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Search, Eye, Copy, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportLabelPDF } from '@/lib/label-pdf-export';
import { mmToPx, type LabelFormat } from '@/lib/label-formats';
import { Canvas as FabricCanvas, Circle, Rect } from 'fabric';

interface AdminLabelProject {
  id: string;
  name: string;
  status: string;
  label_shape: string;
  width_mm: number;
  height_mm: number;
  canvas_json: any;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profile?: { full_name: string; email: string } | null;
}

const SHAPE_LABELS: Record<string, string> = {
  round: 'Redondo',
  square: 'Quadrado',
  'rounded-square': 'Quadrado arredondado',
  rectangle: 'Retangular',
  'rounded-rectangle': 'Retangular arredondado',
};

const AdminLabelProjects = () => {
  const [projects, setProjects] = useState<AdminLabelProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shapeFilter, setShapeFilter] = useState('all');
  const [previewProject, setPreviewProject] = useState<AdminLabelProject | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    // Fetch all label projects (admin RLS allows this)
    const { data: projectsData } = await supabase
      .from('label_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!projectsData) { setLoading(false); return; }

    // Fetch profiles for user mapping
    const userIds = [...new Set((projectsData as any[]).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enriched: AdminLabelProject[] = (projectsData as any[]).map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) || null,
    }));

    setProjects(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchShape = shapeFilter === 'all' || p.label_shape === shapeFilter;
    return matchSearch && matchShape;
  });

  // Export PDF for a project
  const handleExportPDF = async (project: AdminLabelProject) => {
    if (!project.canvas_json || Object.keys(project.canvas_json).length === 0) {
      toast.error('Projeto sem conteúdo');
      return;
    }

    setExporting(project.id);
    try {
      // Create offscreen canvas to render the project
      const offCanvas = document.createElement('canvas');
      offCanvas.style.display = 'none';
      document.body.appendChild(offCanvas);

      const fmt: LabelFormat = {
        id: `${project.label_shape}-${project.width_mm}x${project.height_mm}`,
        shape: project.label_shape as any,
        label: `${project.width_mm / 10}×${project.height_mm / 10} cm`,
        widthMm: project.width_mm,
        heightMm: project.height_mm,
      };

      const w = mmToPx(fmt.widthMm);
      const h = mmToPx(fmt.heightMm);

      const fc = new FabricCanvas(offCanvas, { width: w, height: h, backgroundColor: '#ffffff' });

      if (fmt.shape === 'round') {
        fc.clipPath = new Circle({ radius: w / 2, originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
      } else if (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') {
        fc.clipPath = new Rect({ width: w, height: h, rx: mmToPx(3), ry: mmToPx(3), originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
      }

      await fc.loadFromJSON(project.canvas_json);
      fc.renderAll();

      const canvasEl = fc.toCanvasElement(2);

      const blob = await exportLabelPDF({
        format: fmt,
        canvasEl,
        projectName: project.name,
        includeBleed: false,
        includeCutMarks: true,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      fc.dispose();
      document.body.removeChild(offCanvas);

      toast.success('PDF exportado!');
    } catch (e) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  // Clone project for admin editing
  const handleClone = async (project: AdminLabelProject) => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) return;

    const { error } = await supabase
      .from('label_projects')
      .insert({
        name: `${project.name} (cópia admin)`,
        label_shape: project.label_shape,
        width_mm: project.width_mm,
        height_mm: project.height_mm,
        canvas_json: project.canvas_json,
        user_id: currentUser.user.id,
      } as any);

    if (error) {
      toast.error('Erro ao clonar projeto');
    } else {
      toast.success('Projeto clonado para sua conta');
      fetchProjects();
    }
  };

  const stats = {
    total: projects.length,
    thisMonth: projects.filter(p => {
      const d = new Date(p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    shapes: Object.entries(
      projects.reduce((acc, p) => { acc[p.label_shape] = (acc[p.label_shape] || 0) + 1; return acc; }, {} as Record<string, number>)
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Etiquetas dos Clientes</h1>
        <Badge variant="secondary">{filtered.length} projetos</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-xs text-muted-foreground">Neste mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {stats.shapes.slice(0, 2).map(([shape, count]) => (
          <Card key={shape}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{SHAPE_LABELS[shape] || shape}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, cliente ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={shapeFilter} onValueChange={setShapeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os formatos</SelectItem>
            {Object.entries(SHAPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum projeto encontrado.</TableCell></TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{p.profile?.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{p.profile?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{SHAPE_LABELS[p.label_shape] || p.label_shape}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.width_mm / 10}×{p.height_mm / 10}cm</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(p.updated_at), 'dd/MM/yy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewProject(p)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPDF(p)}
                          disabled={exporting === p.id} title="Baixar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleClone(p)} title="Clonar projeto">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewProject} onOpenChange={() => setPreviewProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewProject?.name}</DialogTitle>
          </DialogHeader>
          {previewProject && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Cliente:</span> {previewProject.profile?.full_name || '—'}</div>
                <div><span className="text-muted-foreground">Email:</span> {previewProject.profile?.email || '—'}</div>
                <div><span className="text-muted-foreground">Formato:</span> {SHAPE_LABELS[previewProject.label_shape]}</div>
                <div><span className="text-muted-foreground">Tamanho:</span> {previewProject.width_mm / 10}×{previewProject.height_mm / 10}cm</div>
                <div><span className="text-muted-foreground">Criado:</span> {format(new Date(previewProject.created_at), 'dd/MM/yy HH:mm')}</div>
                <div><span className="text-muted-foreground">Atualizado:</span> {format(new Date(previewProject.updated_at), 'dd/MM/yy HH:mm')}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleExportPDF(previewProject)} disabled={exporting === previewProject.id}>
                  <Download className="h-4 w-4 mr-2" />Baixar PDF
                </Button>
                <Button variant="outline" onClick={() => handleClone(previewProject)}>
                  <Copy className="h-4 w-4 mr-2" />Clonar
                </Button>
              </div>
              {previewProject.canvas_json && Object.keys(previewProject.canvas_json).length > 0 && (
                <div className="border rounded-lg p-2 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Objetos no canvas: {(previewProject.canvas_json as any)?.objects?.length || 0}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLabelProjects;
