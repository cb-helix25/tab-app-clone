import { templateBlocks as comprehensiveTemplateBlocks, TemplateBlock, TemplateOption } from './TemplateBlocks';
import { templateBlocks as simplifiedTemplateBlocks } from './SimplifiedTemplateBlocks';

export type TemplateSet = 'Comprehensive' | 'Simple';

export const templateBlockSets: Record<TemplateSet, TemplateBlock[]> = {
  Comprehensive: comprehensiveTemplateBlocks,
  Simple: simplifiedTemplateBlocks,
};

export const templateSetOptions = [
  { key: 'Comprehensive', text: 'Comprehensive' },
  { key: 'Simple', text: 'Simple' },
];

export function getTemplateBlocks(set: TemplateSet = 'Comprehensive'): TemplateBlock[] {
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };