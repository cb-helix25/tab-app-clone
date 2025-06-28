import {
  templateBlocks as productionTemplateBlocks,
  TemplateBlock,
  TemplateOption,
} from './ProductionTemplateBlocks';
import simplifiedTemplateBlocks from './SimplifiedTemplateBlocks';
import databaseBlocksJson from '../../localData/localV3Blocks.json';

export type TemplateSet = 'Production' | 'Simplified' | 'Database';

export interface DatabaseBlocksData {
  blocks: TemplateBlock[];
  savedSnippets: Record<string, string>;
}

const databaseTemplateBlocks: TemplateBlock[] =
  (databaseBlocksJson as { blocks: TemplateBlock[] }).blocks;

const databaseBlocksData: DatabaseBlocksData = databaseBlocksJson as DatabaseBlocksData;

// Blocks retrieved from the snippet database (v3) with a local fallback dataset
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
  if (set === 'Database') return databaseTemplateBlocks;
  return templateBlockSets[set];
}

export function getDatabaseBlocksData(): DatabaseBlocksData {
  return databaseBlocksData;
}

export type { TemplateBlock, TemplateOption };
