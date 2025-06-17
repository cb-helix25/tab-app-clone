import { templateBlocks as comprehensiveTemplateBlocks, TemplateBlock, TemplateOption } from './TemplateBlocks';
import { templateBlocks as simplifiedTemplateBlocks } from './SimplifiedTemplateBlocks';
import { templateBlocks as condensedTemplateBlocks } from './CondensedTemplateBlocks';

export type TemplateSet = 'Comprehensive' | 'Condensed' | 'Simple';

export const templateBlockSets: Record<TemplateSet, TemplateBlock[]> = {
  Comprehensive: comprehensiveTemplateBlocks,
  Condensed: condensedTemplateBlocks,
  Simple: simplifiedTemplateBlocks,
};

export const templateSetOptions = [
  { key: 'Comprehensive', text: 'Comprehensive' },
  { key: 'Condensed', text: 'Condensed' },
  { key: 'Simple', text: 'Simple' },
];

export function getTemplateBlocks(set: TemplateSet = 'Comprehensive'): TemplateBlock[] {
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };