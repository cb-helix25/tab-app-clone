// src/tabs/matters/documents/Documents.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  Stack,
  Text,
  mergeStyles,
  PrimaryButton,
  DefaultButton,
  TextField,
  Icon,
  IconButton,
  Separator,
  Toggle,
  Label,
  Link,
  SearchBox,
} from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';
import documentIndex, { DocumentEntry } from './documentIndex';
import { Matter } from '../../../app/functionality/types';
import DocumentCard from './DocumentCard';
import PromptPane from './promptPane'; // Import the new PromptPane component

/* 
============================================================================== 
                          Interface & Prop Definitions 
============================================================================== 
*/

interface DocumentsProps {
  matter?: Matter;
  category: "Commercial" | "Construction" | "Employment" | "Property";
}

/* 
============================================================================== 
                              Styling 
============================================================================== 
*/

// Overall page container (white background)
const pageContainerStyle = mergeStyles({
  padding: '30px',
  backgroundColor: '#fff',
  minHeight: '100vh',
  fontFamily: 'Raleway, sans-serif',
});

// Updated header container style: white background and slightly reduced padding for proportionate height
const headerContainerStyle = mergeStyles({
  padding: '10px 20px',
  borderRadius: '8px',
  backgroundColor: '#fff', // always white
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '20px',
});

// Grid style for document cards (max 3 per line)
const gridStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '32px',
  marginTop: '32px',
});

// New styles for the search container (mimicking MattersCombinedMenu)
const searchContainerStyle = mergeStyles({ display: 'flex', alignItems: 'center', gap: '8px' });
const searchIconStyle = mergeStyles({ cursor: 'pointer' });
const searchBoxStyles = (isSearchActive: boolean) =>
  mergeStyles({
    width: isSearchActive ? '180px' : '0px',
    opacity: isSearchActive ? 1 : 0,
    transition: 'width 0.3s, opacity 0.3s',
    overflow: 'hidden',
  });

/* 
============================================================================== 
                     Draft Prompt & Wizard-Related Helpers 
============================================================================== 
*/

function generateDraftPrompt(doc: DocumentEntry): string {
  return `
Please generate a bespoke "${doc.title}" with the following details:

- Client Name: [Client Name]
- Case Reference: [Case Reference]
- Key Details: [Insert key details here]
  
Reference the perfect example below:

${doc.fullContent}

Make sure to replace all placeholders with the actual data and maintain the structure.
  `.trim();
}

/* 
============================================================================== 
                              Main Component 
============================================================================== 
*/

const Documents: React.FC<DocumentsProps> = ({ matter, category }) => {
  const { isDarkMode } = useTheme();

  const [documents, setDocuments] = useState<DocumentEntry[]>([]);

  useEffect(() => {
    setDocuments(documentIndex[category as keyof typeof documentIndex] || []);
  }, [category]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchActive, setSearchActive] = useState<boolean>(false);
  const handleSearchChange = (_: any, newValue?: string) => {
    setSearchTerm(newValue || '');
  };

  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [favoriteDocs, setFavoriteDocs] = useState<number[]>([]);

  const toggleFavorite = (docId: number) => {
    setFavoriteDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Filter logic for docs
  const filteredDocs = useMemo(() => {
    let final = documents;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      final = final.filter(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          d.preview.toLowerCase().includes(lower)
      );
    }
    if (showFavoritesOnly) {
      final = final.filter((d) => favoriteDocs.includes(d.id));
    }
    return final;
  }, [documents, searchTerm, showFavoritesOnly, favoriteDocs]);

  // Recently used docs
  const [recentlyUsedDocs, setRecentlyUsedDocs] = useState<DocumentEntry[]>([]);
  const addToRecentlyUsed = (doc: DocumentEntry) => {
    setRecentlyUsedDocs((prev) => {
      if (prev.find((p) => p.id === doc.id)) return prev;
      return [doc, ...prev].slice(0, 3);
    });
  };

  // State for the open prompt pane
  const [selectedDoc, setSelectedDoc] = useState<DocumentEntry | null>(null);

  const onSelectDocument = (doc: DocumentEntry) => {
    setSelectedDoc(doc);
    addToRecentlyUsed(doc);
  };

  const onClosePanel = () => {
    setSelectedDoc(null);
  };

  // Build matter link (similar to MatterOverview)
  const matterLink = matter
    ? `https://eu.app.clio.com/nc/#/matters/${matter.UniqueID || '-'}`
    : '';

  return (
    <div className={pageContainerStyle}>
      {/* Header: Display matter reference with revealable search bar */}
      {matter && (
        <div className={headerContainerStyle}>
          <Stack
            horizontal
            verticalAlign="center"
            horizontalAlign="space-between"
            styles={{ root: { width: '100%' } }}
          >
            {/* Left Side: Display Number (smaller icon & text for proportionate height) */}
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Icon
                iconName="OpenFolderHorizontal"
                styles={{ root: { fontSize: 20, color: colours.highlight } }}
              />
              <Link
                href={matterLink}
                target="_blank"
                styles={{
                  root: {
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colours.highlight,
                    textDecoration: 'none',
                  },
                }}
              >
                {matter.DisplayNumber || '-'}
              </Link>
            </Stack>
            {/* Right Side: Revealable Search Bar */}
            <div className={searchContainerStyle}>
              <div
                className={searchIconStyle}
                onClick={() => setSearchActive(!isSearchActive)}
                title="Toggle Search"
              >
                <Icon
                  iconName={isSearchActive ? 'Cancel' : 'Search'}
                  styles={{ root: { fontSize: '20px', color: colours.highlight } }}
                />
              </div>
              <div className={searchBoxStyles(isSearchActive)}>
                <SearchBox
                  placeholder="Search Documents..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  underlined
                  styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
                />
              </div>
            </div>
          </Stack>
        </div>
      )}

      <Stack tokens={{ childrenGap: 20 }}>
        {/* Recently Used Docs */}
        {recentlyUsedDocs.length > 0 && (
          <Stack tokens={{ childrenGap: 10 }}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              Recently Used
            </Text>
            <Stack horizontal tokens={{ childrenGap: 20 }}>
              {recentlyUsedDocs.map((doc) => (
                <Stack
                  key={doc.id}
                  horizontal
                  verticalAlign="center"
                  styles={{
                    root: {
                      backgroundColor: isDarkMode ? '#2b2b2b' : '#f5f5f5',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => onSelectDocument(doc)}
                >
                  <Icon iconName={doc.icon} styles={{ root: { fontSize: 16, marginRight: 6, color: colours.highlight } }} />
                  <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                    {doc.title}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}

        {/* Document Cards Grid */}
        <div className={gridStyle}>
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isFavorited={favoriteDocs.includes(doc.id)}
              onSelect={onSelectDocument}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </Stack>

      {/* Use the PromptPane component instead of the hard-coded Panel */}
      {selectedDoc && (
        <PromptPane
          doc={selectedDoc}
          isOpen={!!selectedDoc}
          onClose={onClosePanel}
        />
      )}
    </div>
  );
};

export default Documents;
