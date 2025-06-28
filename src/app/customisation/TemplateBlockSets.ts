import {
  templateBlocks as productionTemplateBlocks,
  TemplateBlock,
  TemplateOption,
} from './ProductionTemplateBlocks';
import simplifiedTemplateBlocks from './SimplifiedTemplateBlocks';

export type TemplateSet = 'Production' | 'Simplified' | 'Database';

// Fallback blocks for the database set simply reuse the simplified set
export const templateBlockSets: Record<Exclude<TemplateSet, 'Database'>, TemplateBlock[]> = {
  Production: productionTemplateBlocks,
  Simplified: simplifiedTemplateBlocks,
};

export const templateSetOptions = [
  { key: 'Database', text: 'v3' },
  { key: 'Production', text: 'v1' },
  { key: 'Simplified', text: 'v2' },
];

export function getTemplateSetLabel(set: TemplateSet): string {
  if (set === 'Database') return 'v3';
  return set === 'Simplified' ? 'v2' : 'v1';
}

export function getTemplateBlocks(set: TemplateSet = 'Simplified'): TemplateBlock[] {
  if (set === 'Database') return simplifiedTemplateBlocks;
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };
