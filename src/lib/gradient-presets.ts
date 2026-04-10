import {
  type LabelGradientPreset,
  type GradientPresetCategory,
  GRADIENT_PRESETS,
  GRADIENT_CATEGORIES,
} from './label-gradients';

// Re-export from the canonical source
export { GRADIENT_PRESETS, GRADIENT_CATEGORIES };

// Grouped by category
export const GRADIENTS_BY_CATEGORY = GRADIENT_PRESETS.reduce<Record<string, LabelGradientPreset[]>>(
  (acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  },
  {},
);
