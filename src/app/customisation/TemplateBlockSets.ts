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
  { key: 'Production', text: 'Production' },
  { key: 'Simplified', text: 'Simplified' },
];

export function getTemplateBlocks(set: TemplateSet = 'Simplified'): TemplateBlock[] {
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };
