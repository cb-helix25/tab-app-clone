import {
  templateBlocks as comprehensiveTemplateBlocks,
  TemplateBlock,
  TemplateOption,
} from './TemplateBlocks';
import defaultTemplateBlocks from './DefaultTemplateBlocks';
import condensedTemplateBlocks from './CondensedTemplateBlocks';

export type TemplateSet = 'Comprehensive' | 'Condensed' | 'Default';

export const templateBlockSets: Record<TemplateSet, TemplateBlock[]> = {
  Comprehensive: comprehensiveTemplateBlocks,
  Condensed: condensedTemplateBlocks,
  Default: defaultTemplateBlocks,
};

export const templateSetOptions = [
  { key: 'Comprehensive', text: 'Comprehensive' },
  { key: 'Condensed', text: 'Condensed' },
  { key: 'Default', text: 'Default' },
];

export function getTemplateBlocks(set: TemplateSet = 'Default'): TemplateBlock[] {
  return templateBlockSets[set];
}

export type { TemplateBlock, TemplateOption };