import { useState, useMemo, useCallback } from 'react';
import { LABEL_TEMPLATES, type LabelTemplate } from '@/lib/label-templates';
import { ALL_FORMATS, type LabelFormat } from '@/lib/label-formats';

export type SortOrder = 'az' | 'za' | 'newest' | 'oldest';
export type PremiumFilter = 'all' | 'free' | 'premium';

export interface TemplateFilters {
  search: string;
  category: string;
  subcategory: string;
  premium: PremiumFilter;
  sortOrder: SortOrder;
  tags: string[];
}

export interface FormatFilters {
  search: string;
  shape: string;
  widthRange: [number, number];
  heightRange: [number, number];
  onlyCustom: boolean;
}

export interface ElementFilters {
  search: string;
  category: string;
}

export const DEFAULT_TEMPLATE_FILTERS: TemplateFilters = {
  search: '',
  category: 'todos',
  subcategory: '',
  premium: 'all',
  sortOrder: 'az',
  tags: [],
};

export const DEFAULT_FORMAT_FILTERS: FormatFilters = {
  search: '',
  shape: 'todos',
  widthRange: [10, 300],
  heightRange: [10, 300],
  onlyCustom: false,
};

export const DEFAULT_ELEMENT_FILTERS: ElementFilters = {
  search: '',
  category: 'todos',
};

export function useLabelFilters() {
  const [templateFilters, setTemplateFilters] =
    useState<TemplateFilters>(DEFAULT_TEMPLATE_FILTERS);
  const [formatFilters, setFormatFilters] =
    useState<FormatFilters>(DEFAULT_FORMAT_FILTERS);
  const [elementFilters, setElementFilters] =
    useState<ElementFilters>(DEFAULT_ELEMENT_FILTERS);

  const filteredTemplates = useMemo(() => {
    let result = [...LABEL_TEMPLATES];

    if (templateFilters.search) {
      const q = templateFilters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.includes(q))) ||
          t.category.includes(q),
      );
    }

    if (templateFilters.category !== 'todos') {
      result = result.filter((t) => t.category === templateFilters.category);
    }

    if (templateFilters.subcategory) {
      result = result.filter((t) => t.subcategory === templateFilters.subcategory);
    }

    if (templateFilters.premium === 'free') {
      result = result.filter((t) => !t.premium);
    } else if (templateFilters.premium === 'premium') {
      result = result.filter((t) => t.premium);
    }

    if (templateFilters.tags.length > 0) {
      result = result.filter((t) =>
        t.tags && templateFilters.tags.every((tag) => t.tags!.includes(tag)),
      );
    }

    result.sort((a, b) => {
      switch (templateFilters.sortOrder) {
        case 'az': return a.name.localeCompare(b.name);
        case 'za': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    return result;
  }, [templateFilters]);

  const filteredFormats = useMemo(() => {
    let result = [...ALL_FORMATS];

    if (formatFilters.search) {
      const q = formatFilters.search.toLowerCase();
      result = result.filter((f) =>
        (f.name ?? f.label).toLowerCase().includes(q),
      );
    }

    if (formatFilters.shape !== 'todos') {
      result = result.filter((f) => f.shape === formatFilters.shape);
    }

    result = result.filter(
      (f) =>
        f.widthMm >= formatFilters.widthRange[0] &&
        f.widthMm <= formatFilters.widthRange[1] &&
        f.heightMm >= formatFilters.heightRange[0] &&
        f.heightMm <= formatFilters.heightRange[1],
    );

    if (formatFilters.onlyCustom) {
      result = result.filter((f) => f.isCustom);
    }

    return result;
  }, [formatFilters]);

  const updateTemplateFilter = useCallback(
    <K extends keyof TemplateFilters>(key: K, value: TemplateFilters[K]) => {
      setTemplateFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateFormatFilter = useCallback(
    <K extends keyof FormatFilters>(key: K, value: FormatFilters[K]) => {
      setFormatFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateElementFilter = useCallback(
    <K extends keyof ElementFilters>(key: K, value: ElementFilters[K]) => {
      setElementFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleTemplateTag = useCallback((tag: string) => {
    setTemplateFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  const resetTemplateFilters = useCallback(
    () => setTemplateFilters(DEFAULT_TEMPLATE_FILTERS), [],
  );
  const resetFormatFilters = useCallback(
    () => setFormatFilters(DEFAULT_FORMAT_FILTERS), [],
  );
  const resetElementFilters = useCallback(
    () => setElementFilters(DEFAULT_ELEMENT_FILTERS), [],
  );

  const activeTemplateFilterCount = useMemo(() => {
    let count = 0;
    if (templateFilters.search) count++;
    if (templateFilters.category !== 'todos') count++;
    if (templateFilters.subcategory) count++;
    if (templateFilters.premium !== 'all') count++;
    if (templateFilters.tags.length > 0) count += templateFilters.tags.length;
    if (templateFilters.sortOrder !== 'az') count++;
    return count;
  }, [templateFilters]);

  const activeFormatFilterCount = useMemo(() => {
    let count = 0;
    if (formatFilters.search) count++;
    if (formatFilters.shape !== 'todos') count++;
    if (formatFilters.onlyCustom) count++;
    if (
      formatFilters.widthRange[0] !== 10 ||
      formatFilters.widthRange[1] !== 300 ||
      formatFilters.heightRange[0] !== 10 ||
      formatFilters.heightRange[1] !== 300
    ) count++;
    return count;
  }, [formatFilters]);

  return {
    templateFilters,
    formatFilters,
    elementFilters,
    filteredTemplates,
    filteredFormats,
    updateTemplateFilter,
    updateFormatFilter,
    updateElementFilter,
    toggleTemplateTag,
    resetTemplateFilters,
    resetFormatFilters,
    resetElementFilters,
    activeTemplateFilterCount,
    activeFormatFilterCount,
  };
}
