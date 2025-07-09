import {
// invisible change 2
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
  { key: 'Database', text: 'Production' },
  { key: 'Production', text: 'Original' },
  { key: 'Simplified', text: 'Simplified' },
];

export function getTemplateSetLabel(set: TemplateSet): string {
  if (set === 'Database') return 'Production';
  return set === 'Simplified' ? 'Simplified' : 'Original';
}

export function getTemplateBlocks(set: TemplateSet = 'Simplified'): TemplateBlock[] {
  if (set === 'Database') return databaseTemplateBlocks;
  return templateBlockSets[set];
}

export function getDatabaseBlocksData(): DatabaseBlocksData {
  return databaseBlocksData;
}

export interface RawSnippet {
  SnippetId?: number;
  snippetId?: number;
  Label?: string;
  label?: string;
  Content?: string;
  content?: string;
  SortOrder?: number;
  sortOrder?: number;
}

export interface RawBlock {
  BlockId?: number;
  blockId?: number;
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
  Placeholder?: string;
  placeholder?: string;
  snippets?: RawSnippet[];
  options?: RawSnippet[];
}

export function compileBlocks(raw: RawBlock[] | { blocks: RawBlock[] }): TemplateBlock[] {
  const blocksArray: RawBlock[] = Array.isArray(raw)
    ? raw
    : (raw as any).blocks || [];
  return blocksArray.map((b) => ({
    title: b.Title || b.title || '',
    description: b.Description || b.description || '',
    placeholder: b.Placeholder || b.placeholder || '',
    blockId: b.BlockId ?? b.blockId,
    isMultiSelect: true,
    options: (b.snippets || b.options || []).map((s) => ({
      label: s.Label || s.label || '',
      previewText: s.Content || s.content || '',
      snippetId: s.SnippetId ?? s.snippetId,
    })),
  }));
}

export type { TemplateBlock, TemplateOption };
