import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Plus, Trash2, Palette,
  ChevronRight, X, ArrowLeft, Check,
} from 'lucide-react';
import { LABEL_SHAPES, getFormatsForShape } from '@/lib/label-formats';
import {
  TEMPLATE_CATEGORIES, getTemplatesByCategory,
} from '@/lib/label-templates';
import { format } from 'date-fns';
import { useLabelFilters } from '@/hooks/use-label-filters';
import { FormatFiltersBar } from '@/components/label-editor/filters/FormatFiltersBar';
import { TemplateFiltersBar } from '@/components/label-editor/filters/TemplateFiltersBar';

import {
  LabelToolbar, LabelLeftPanel, LabelPropertiesPanel,
  LabelStatusBar, LabelTopBar,
  PrintPreviewDialog, SaveAsDialog, ShortcutsDialog, AddToCartDialog,
  loadGoogleFont, SHAPE_VISUALS,
} from '@/components/label-editor';
import { LabelEditorProvider, useLabelEditor } from '@/contexts/LabelEditorContext';

// ── Inner component that consumes context ──
const LabelEditorInner = () => {
  const ctx = useLabelEditor();
  const {
    formatFilters, filteredFormats,
    updateFormatFilter, resetFormatFilters, activeFormatFilterCount,
    templateFilters, filteredTemplates,
    updateTemplateFilter, toggleTemplateTag,
    resetTemplateFilters, activeTemplateFilterCount,
  } = useLabelFilters();

  return (
    <TooltipProvider delayDuration={300}>
      <input ref={ctx.imageInputRef} type="file" accept="image/*" className="hidden" onChange={ctx.handleImageUpload} />

      {/* ── WIZARD VIEW (no project open) ── */}
      <div style={{ display: ctx.currentProject ? 'none' : undefined }}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {ctx.showOnboarding && (
            <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={ctx.dismissOnboarding}><X className="h-4 w-4" /></Button>
              <h3 className="font-semibold text-sm mb-3">Bem-vindo ao Editor de Etiquetas!</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '1', title: 'Escolha o formato', desc: 'Selecione a forma e o tamanho da etiqueta' },
                  { step: '2', title: 'Personalize', desc: 'Adicione textos, imagens e escolha cores' },
                  { step: '3', title: 'Salve e peça', desc: 'Salve o projeto e adicione ao carrinho' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">{item.step}</div>
                    <div><p className="text-xs font-medium">{item.title}</p><p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">Editor de Etiquetas</h1>
            <p className="text-muted-foreground text-sm mt-1">Crie etiquetas personalizadas de forma fácil e profissional</p>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Wizard steps indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {['Formato', 'Tamanho', 'Nome', 'Modelo'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      ctx.wizardStep === i ? 'bg-primary text-primary-foreground' :
                      ctx.wizardStep > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {ctx.wizardStep > i ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${ctx.wizardStep === i ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                    {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              {/* Step 0: Shape */}
              {ctx.wizardStep === 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-center mb-4">Qual o formato da sua etiqueta?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {LABEL_SHAPES.map(s => {
                      const vis = SHAPE_VISUALS[s.id];
                      return (
                        <button key={s.id} onClick={() => { ctx.setSelectedShape(s.id); ctx.setSelectedFormat(null); ctx.setWizardStep(1); }}
                          className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            ctx.selectedShape === s.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}>
                          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${vis?.color || ''} flex items-center justify-center transition-transform group-hover:scale-105`}>
                            <svg viewBox="0 0 100 100" className="w-14 h-14 text-foreground/70">{vis?.svg}</svg>
                          </div>
                          <span className="text-sm font-medium">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 1: Size */}
              {ctx.wizardStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => ctx.setWizardStep(0)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Escolha o tamanho</h2>
                  </div>
                  <div className="mb-4">
                    <FormatFiltersBar
                      filters={formatFilters}
                      activeFilterCount={activeFormatFilterCount}
                      onUpdate={updateFormatFilter}
                      onReset={resetFormatFilters}
                      totalResults={filteredFormats.length}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(filteredFormats.length > 0 ? filteredFormats : ctx.availableFormats).map(f => {
                      const isSquare = f.widthMm === f.heightMm;
                      const maxPrev = 60;
                      const prevW = maxPrev;
                      const prevH = isSquare ? maxPrev : (f.heightMm / f.widthMm) * maxPrev;
                      const shapeStyle: React.CSSProperties = {
                        width: prevW, height: prevH,
                        borderRadius: f.shape === 'round' ? '50%' : (f.shape === 'rounded-square' || f.shape === 'rounded-rectangle') ? 8 : 2,
                      };
                      return (
                        <button key={f.id} onClick={() => { ctx.setSelectedFormat(f); ctx.setWizardStep(2); }}
                          className={`group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            ctx.selectedFormat?.id === f.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}>
                          <div className="flex items-center justify-center h-16">
                            <div style={shapeStyle} className="border-2 border-foreground/20 bg-muted/50 transition-transform group-hover:scale-110" />
                          </div>
                          <span className="text-sm font-semibold">{f.label}</span>
                          <span className="text-xs text-muted-foreground">{f.widthMm}×{f.heightMm}mm</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Name */}
              {ctx.wizardStep === 2 && (
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => ctx.setWizardStep(1)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Dê um nome ao projeto</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 text-primary">{SHAPE_VISUALS[ctx.selectedShape]?.svg}</svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{LABEL_SHAPES.find(s => s.id === ctx.selectedShape)?.label}</p>
                        <p className="text-xs text-muted-foreground">{ctx.selectedFormat?.label} ({ctx.selectedFormat?.widthMm}×{ctx.selectedFormat?.heightMm}mm)</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nome do projeto</label>
                      <Input value={ctx.projectName} onChange={e => ctx.setProjectName(e.target.value)} placeholder="Ex: Etiqueta Natal 2025" className="mt-1" autoFocus />
                    </div>
                    <Button className="w-full" size="lg" onClick={() => ctx.setWizardStep(3)}>
                      Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Template */}
              {ctx.wizardStep === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => ctx.setWizardStep(2)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Comece com um modelo ou do zero</h2>
                  </div>
                  <div className="mb-4">
                    <Button variant="outline" className="w-full mb-4 h-14 text-base" onClick={ctx.handleNewProject} disabled={!ctx.selectedFormat}>
                      <Plus className="h-5 w-5 mr-2" />Começar do Zero (canvas em branco)
                    </Button>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Ou escolha um modelo pronto</p>
                  <div className="mb-4">
                    <TemplateFiltersBar
                      filters={templateFilters}
                      activeFilterCount={activeTemplateFilterCount}
                      onUpdate={updateTemplateFilter}
                      onToggleTag={toggleTemplateTag}
                      onReset={resetTemplateFilters}
                      totalResults={filteredTemplates.length}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredTemplates.map(t => {
                      const colors = ctx.getTemplateColors(t);
                      return (
                        <button key={t.id} onClick={async () => {
                          ctx.applyTemplate(t);
                        }} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-md transition-all group">
                          <div className="w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden relative bg-muted">
                            <div className="w-full h-full flex gap-0.5">
                              {colors.map((c, i) => (<div key={i} className="flex-1" style={{ backgroundColor: c }} />))}
                            </div>
                          </div>
                          <span className="text-xs font-medium truncate w-full text-center">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.description}</span>
                        </button>
                      );
                    })}
                  </div>
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-8">
                      <span className="text-2xl block mb-2">🎨</span>
                      <span className="text-sm text-muted-foreground">Nenhum template encontrado</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {ctx.projects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Meus Projetos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ctx.projects.map(p => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => ctx.loadProject(p)}>
                    <CardContent className="p-4 flex gap-3">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                          <Palette className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{LABEL_SHAPES.find(s => s.id === p.label_shape)?.label || p.label_shape} • {p.width_mm / 10}×{p.height_mm / 10}cm</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.updated_at), 'dd/MM/yy HH:mm')}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Excluir projeto?')) ctx.deleteProject(p.id);
                      }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── EDITOR VIEW (project open) ── */}
      <div style={{ display: ctx.currentProject ? undefined : 'none' }} className="flex flex-col h-[calc(100vh-140px)]">
        <PrintPreviewDialog open={ctx.showPrintPreview} onOpenChange={ctx.setShowPrintPreview} canvasRef={ctx.fabricRef} format={ctx.selectedFormat} />

        <LabelTopBar
          projectName={ctx.projectName}
          shapeLabel={ctx.currentShapeLabel}
          sizeLabel={ctx.currentSizeLabel}
          currentProjectId={ctx.currentProject?.id || ''}
          onBack={ctx.closeProject}
          onNameChange={ctx.setProjectName}
          onSave={ctx.handleSave}
          onSaveVersion={ctx.handleSaveVersion}
          onPrintPreview={() => ctx.setShowPrintPreview(true)}
          onAddToCart={() => ctx.setShowAddToCart(true)}
        />

        <div className="flex flex-1 min-h-0 relative">
          <LabelToolbar
            activeTool={ctx.activeTool}
            drawingMode={ctx.drawingMode}
            showLeftPanel={ctx.showLeftPanel}
            onSelectTool={() => { ctx.toggleDrawingMode(false); ctx.fabricRef.current?.discardActiveObject(); ctx.fabricRef.current?.renderAll(); }}
            onAddText={() => { ctx.toggleDrawingMode(false); ctx.addText(); }}
            onAddCurvedText={() => { ctx.toggleDrawingMode(false); ctx.addCurvedText(); }}
            onAddShape={(type) => { ctx.toggleDrawingMode(false); ctx.addShape(type); }}
            onToggleDrawing={() => ctx.toggleDrawingMode(!ctx.drawingMode)}
            onOpenImagePicker={() => { ctx.toggleDrawingMode(false); ctx.imageInputRef.current?.click(); }}
            onToggleLeftPanel={() => ctx.setShowLeftPanel(!ctx.showLeftPanel)}
            onShowShortcuts={() => ctx.setShowShortcuts(true)}
          />

          {ctx.showLeftPanel && (
            <LabelLeftPanel
              bgColor={ctx.bgColor}
              widthMm={ctx.selectedFormat?.widthMm ?? 50}
              heightMm={ctx.selectedFormat?.heightMm ?? 50}
              canvas={ctx.fabricRef.current}
              selectedObject={ctx.selectedObject}
              onHistoryCapture={ctx.pushHistory}
              onBgColorChange={ctx.handleBgColorChange}
              onApplyTemplate={ctx.applyTemplate}
              onAddDecorative={ctx.addDecorative}
              onAddSvgElement={ctx.addSvgElement}
              layers={ctx.layers}
              editingLayerName={ctx.editingLayerName}
              layerNameDraft={ctx.layerNameDraft}
              onClose={() => ctx.setShowLeftPanel(false)}
              onSelectLayer={ctx.selectLayer}
              onToggleLayerVisibility={ctx.toggleLayerVisibility}
              onToggleLayerLock={ctx.toggleLayerLock}
              onMoveLayerUp={ctx.moveLayerUp}
              onMoveLayerDown={ctx.moveLayerDown}
              onStartEditLayerName={(id, name) => { ctx.setEditingLayerName(id); ctx.setLayerNameDraft(name); }}
              onLayerNameDraftChange={ctx.setLayerNameDraft}
              onFinishEditLayerName={(layer) => { ctx.renameLayer(layer, ctx.layerNameDraft); ctx.setEditingLayerName(null); }}
            />
          )}

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-auto p-4" ref={ctx.containerRef} style={{ backgroundColor: '#3a3a3a' }}>
              <div className="relative shadow-2xl ring-1 ring-white/20" id="canvas-wrapper" style={{ margin: 'auto' }}>
                <div className="absolute inset-0" style={ctx.gridOverlayStyle} />
                <div ref={ctx.canvasHostRef} />
              </div>
            </div>

            <LabelStatusBar
              historyIdx={ctx.historyIdx}
              historyLength={ctx.historyLength}
              zoom={ctx.zoom}
              snapEnabled={ctx.snapEnabled}
              showGrid={ctx.showGrid}
              shapeLabel={ctx.currentShapeLabel}
              sizeLabel={ctx.currentSizeLabel}
              layerCount={ctx.layers.length}
              onUndo={ctx.undo}
              onRedo={ctx.redo}
              onZoomIn={ctx.zoomIn}
              onZoomOut={ctx.zoomOut}
              onToggleSnap={() => ctx.setSnapEnabled(!ctx.snapEnabled)}
              onToggleGrid={() => ctx.setShowGrid(!ctx.showGrid)}
            />
          </div>

          <LabelPropertiesPanel
            drawingMode={ctx.drawingMode}
            selectedObject={ctx.selectedObject}
            brushColor={ctx.brushColor}
            brushWidth={ctx.brushWidth}
            bgColor={ctx.bgColor}
            shapeLabel={ctx.currentShapeLabel}
            sizeLabel={ctx.currentSizeLabel}
            layerCount={ctx.layers.length}
            onBrushColorChange={ctx.setBrushColor}
            onBrushWidthChange={ctx.setBrushWidth}
            onEraseLastDrawing={ctx.eraseLastDrawing}
            onToggleDrawingOff={() => ctx.toggleDrawingMode(false)}
            onBgColorChange={ctx.handleBgColorChange}
            onUpdateObjectProp={ctx.updateObjectProp}
            onAlignObject={ctx.alignObject}
            onBringForward={ctx.bringForward}
            onSendBackward={ctx.sendBackward}
            onDuplicate={ctx.duplicateObj}
            onDelete={ctx.deleteSelected}
            onRebuildCurvedText={ctx.rebuildCurvedText}
            fabricRenderAll={ctx.fabricRenderAll}
          />
        </div>

        <SaveAsDialog
          open={ctx.showSaveAsDialog}
          onOpenChange={ctx.setShowSaveAsDialog}
          saveAsName={ctx.saveAsName}
          onNameChange={ctx.setSaveAsName}
          onSave={ctx.handleSaveAsNew}
        />

        <ShortcutsDialog open={ctx.showShortcuts} onOpenChange={ctx.setShowShortcuts} />

        <AddToCartDialog
          open={ctx.showAddToCart}
          onOpenChange={ctx.setShowAddToCart}
          projectName={ctx.currentProject?.name || ''}
          format={ctx.selectedFormat}
          cartQuantity={ctx.cartQuantity}
          cartFinishing={ctx.cartFinishing}
          onQuantityChange={ctx.setCartQuantity}
          onFinishingChange={ctx.setCartFinishing}
          onAddToCart={ctx.handleAddToCart}
        />
      </div>
    </TooltipProvider>
  );
};

// ── Wrapper with Provider ──
const LabelEditor = () => (
  <LabelEditorProvider>
    <LabelEditorInner />
  </LabelEditorProvider>
);

export default LabelEditor;
