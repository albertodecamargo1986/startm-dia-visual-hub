const loadedCustomFonts = new Set<string>();

export async function loadCustomFont(file: File): Promise<string> {
  const fontName = file.name.replace(/\.[^.]+$/, '');

  if (loadedCustomFonts.has(fontName)) return fontName;

  const arrayBuffer = await file.arrayBuffer();
  const fontFace = new FontFace(fontName, arrayBuffer);
  const loaded = await fontFace.load();
  document.fonts.add(loaded);
  loadedCustomFonts.add(fontName);

  return fontName;
}

export function getCustomFontNames(): string[] {
  return Array.from(loadedCustomFonts);
}
