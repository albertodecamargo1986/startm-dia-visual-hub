import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { themePresets, fontOptions, colorLabels, ThemeConfig, ThemeColors, defaultThemeConfig } from '@/lib/themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Palette, Sun, Moon, Monitor, Save, RotateCcw, Eye } from 'lucide-react';
import { toast } from 'sonner';

function hslToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const MiniPreview = ({ colors }: { colors: ThemeColors }) => (
  <div
    className="rounded-lg border overflow-hidden h-32 w-full"
    style={{ backgroundColor: `hsl(${colors.background})`, borderColor: `hsl(${colors.border})` }}
  >
    <div className="h-6 flex items-center px-2 gap-1" style={{ backgroundColor: `hsl(${colors['sidebar-background']})` }}>
      <div className="w-8 h-2 rounded" style={{ backgroundColor: `hsl(${colors.primary})` }} />
      <div className="flex-1" />
      <div className="w-4 h-2 rounded" style={{ backgroundColor: `hsl(${colors['sidebar-foreground']})`, opacity: 0.5 }} />
      <div className="w-4 h-2 rounded" style={{ backgroundColor: `hsl(${colors['sidebar-foreground']})`, opacity: 0.5 }} />
    </div>
    <div className="p-2 space-y-1.5">
      <div className="w-16 h-2 rounded" style={{ backgroundColor: `hsl(${colors.foreground})` }} />
      <div className="w-full h-1.5 rounded" style={{ backgroundColor: `hsl(${colors['muted-foreground']})`, opacity: 0.4 }} />
      <div className="flex gap-1 mt-1">
        <div className="rounded px-2 py-1 h-4 w-10" style={{ backgroundColor: `hsl(${colors.primary})` }} />
        <div className="rounded px-2 py-1 h-4 w-10" style={{ backgroundColor: `hsl(${colors.secondary})` }} />
      </div>
      <div className="flex gap-1">
        <div className="rounded h-8 flex-1" style={{ backgroundColor: `hsl(${colors.card})`, border: `1px solid hsl(${colors.border})` }} />
        <div className="rounded h-8 flex-1" style={{ backgroundColor: `hsl(${colors.card})`, border: `1px solid hsl(${colors.border})` }} />
      </div>
    </div>
  </div>
);

const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={hslToHex(value)}
      onChange={(e) => onChange(hexToHsl(e.target.value))}
      className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
    />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-foreground truncate">{label}</p>
      <p className="text-[10px] text-muted-foreground font-mono truncate">{value}</p>
    </div>
  </div>
);

const AdminTheme = () => {
  const { themeConfig, applyTheme, saveTheme } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>(themeConfig);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setConfig(themeConfig);
  }, [themeConfig]);

  const updateConfig = (partial: Partial<ThemeConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    setHasChanges(true);
    applyTheme(updated);
  };

  const updateColor = (key: string, value: string) => {
    const newColors = { ...config.colors, [key]: value };
    updateConfig({ colors: newColors, presetId: 'custom' });
  };

  const selectPreset = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (!preset) return;
    updateConfig({
      presetId: preset.id,
      mode: preset.mode,
      colors: { ...preset.colors },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme(config);
      setHasChanges(false);
      toast.success('Tema salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar tema');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    updateConfig(defaultThemeConfig);
  };

  const modeIcon = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    auto: <Monitor className="h-4 w-4" />,
  };

  const mainColorKeys = ['primary', 'secondary', 'accent', 'background', 'foreground', 'card', 'muted', 'border', 'destructive'] as const;
  const advancedColorKeys = Object.keys(config.colors).filter(k => !mainColorKeys.includes(k as any)) as (keyof ThemeColors)[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-foreground">Aparência</h1>
          <p className="text-muted-foreground text-sm">Personalize as cores, fontes e visual do site</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gap-1">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Salvando...' : 'Salvar Tema'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="paletas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="paletas" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Paletas</TabsTrigger>
          <TabsTrigger value="cores" className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Editor de Cores</TabsTrigger>
          <TabsTrigger value="fontes">Fontes</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="paletas" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {themePresets.map((preset) => {
              const isActive = config.presetId === preset.id;
              return (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/50'}`}
                  onClick={() => selectPreset(preset.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    <MiniPreview colors={preset.colors} />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                      {isActive && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {['primary', 'secondary', 'accent', 'background', 'foreground'].map(k => (
                        <div
                          key={k}
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: `hsl(${preset.colors[k as keyof ThemeColors]})` }}
                          title={colorLabels[k] || k}
                        />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1 self-center">
                        {preset.mode === 'light' ? '☀️' : '🌙'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cores Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mainColorKeys.map(key => (
                  <ColorInput
                    key={key}
                    label={colorLabels[key] || key}
                    value={config.colors[key as keyof ThemeColors]}
                    onChange={(v) => updateColor(key, v)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cores Avançadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {advancedColorKeys.map(key => (
                  <ColorInput
                    key={key}
                    label={colorLabels[key] || key.replace(/-/g, ' ')}
                    value={config.colors[key]}
                    onChange={(v) => updateColor(key, v)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fontes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fonte dos Títulos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={config.fontDisplay} onValueChange={(v) => updateConfig({ fontDisplay: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  className="p-4 rounded-lg border border-border bg-card"
                  style={{ fontFamily: `'${config.fontDisplay}', sans-serif` }}
                >
                  <p className="text-2xl text-foreground">Exemplo de Título</p>
                  <p className="text-lg text-foreground">STARTMÍDIA GRÁFICA</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fonte do Corpo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={config.fontBody} onValueChange={(v) => updateConfig({ fontBody: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  className="p-4 rounded-lg border border-border bg-card space-y-1"
                  style={{ fontFamily: `'${config.fontBody}', sans-serif` }}
                >
                  <p className="text-sm text-foreground">Este é um exemplo de texto com a fonte selecionada.</p>
                  <p className="text-xs text-muted-foreground">Texto secundário para comparação de legibilidade.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview do Tema Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: `hsl(${config.colors.background})` }}>
                {/* Header */}
                <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: `hsl(${config.colors.card})`, borderBottom: `1px solid hsl(${config.colors.border})` }}>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg" style={{ color: `hsl(${config.colors.primary})`, fontFamily: `'${config.fontDisplay}', sans-serif` }}>STARTMÍDIA</span>
                    {['Início', 'Produtos', 'Portfólio', 'Contato'].map(t => (
                      <span key={t} className="text-sm" style={{ color: `hsl(${config.colors.foreground})`, fontFamily: `'${config.fontBody}', sans-serif` }}>{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="rounded px-3 py-1 text-xs" style={{ backgroundColor: `hsl(${config.colors.primary})`, color: `hsl(${config.colors['primary-foreground']})` }}>Entrar</div>
                  </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-8 text-center" style={{ background: `linear-gradient(135deg, hsl(${config.colors.primary}) 0%, hsl(${config.colors.secondary}) 100%)` }}>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: `hsl(${config.colors['primary-foreground']})`, fontFamily: `'${config.fontDisplay}', sans-serif` }}>
                    Gráfica Online Profissional
                  </h2>
                  <p className="text-sm opacity-90" style={{ color: `hsl(${config.colors['primary-foreground']})`, fontFamily: `'${config.fontBody}', sans-serif` }}>
                    Qualidade e agilidade para o seu projeto
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <div className="rounded px-4 py-2 text-sm font-medium" style={{ backgroundColor: `hsl(${config.colors.accent})`, color: `hsl(${config.colors['accent-foreground']})` }}>Ver Produtos</div>
                    <div className="rounded px-4 py-2 text-sm font-medium border" style={{ borderColor: `hsl(${config.colors['primary-foreground']})`, color: `hsl(${config.colors['primary-foreground']})` }}>Orçamento</div>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  {['Cartões de Visita', 'Banners', 'Adesivos'].map(name => (
                    <div key={name} className="rounded-lg p-4" style={{ backgroundColor: `hsl(${config.colors.card})`, border: `1px solid hsl(${config.colors.border})` }}>
                      <div className="h-16 rounded mb-2" style={{ backgroundColor: `hsl(${config.colors.muted})` }} />
                      <p className="text-sm font-medium" style={{ color: `hsl(${config.colors['card-foreground']})`, fontFamily: `'${config.fontBody}', sans-serif` }}>{name}</p>
                      <p className="text-xs mt-1" style={{ color: `hsl(${config.colors['muted-foreground']})` }}>A partir de R$ 49,90</p>
                      <div className="mt-2 rounded px-2 py-1 text-xs text-center" style={{ backgroundColor: `hsl(${config.colors.primary})`, color: `hsl(${config.colors['primary-foreground']})` }}>
                        Ver detalhes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTheme;
