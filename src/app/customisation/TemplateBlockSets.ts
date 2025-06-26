import {
  templateBlocks as productionTemplateBlocks,
  TemplateBlock,
  TemplateOption,
} from './ProductionTemplateBlocks';
import simplifiedTemplateBlocks from './SimplifiedTemplateBlocks';

export type TemplateSet = 'Production' | 'Simplified';

export const templateBlockSets: Record<TemplateSet, TemplateBlock[]> = {
  Production: productionTemplateBlocks,
  Simplified: simplifiedTemplateBlocks,
};

export const templateSetOptions = [
  { key: 'Production', text: 'v1' },
  { key: 'Simplified', text: 'v2' },
];

export function getTemplateSetLabel(set: TemplateSet): string {
  return set === 'Simplified' ? 'v2' : 'v1';
}

export function getTemplateBlocks(set: TemplateSet = 'Simplified'): TemplateBlock[] {
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };
