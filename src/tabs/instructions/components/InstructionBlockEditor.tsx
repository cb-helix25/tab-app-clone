//
import React, { useState, useRef, useEffect } from 'react';
// invisible change
import { Stack, DefaultButton, IconButton, Text, mergeStyles, Callout } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { DEFAULT_INSTRUCTION_TEMPLATES, InstructionTemplate } from './InstructionEditor';

interface InstructionBlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  templates?: InstructionTemplate[];
}

// CSS injection for clean placeholder styles
if (typeof window !== 'undefined' && !document.getElementById('instruction-block-editor-style')) {
    const style = document.createElement('style');
    style.id = 'instruction-block-editor-style';
    style.innerHTML = `
    .block-editor-container {
      position: relative;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .placeholder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 8px;
      margin-top: 12px;
      width: 100%;
      box-sizing: border-box;
    }
    
    @media (max-width: 768px) {
      .placeholder-grid {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 6px;
      }
    }
    
    @media (max-width: 480px) {
      .placeholder-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
      }
    }
    
    .placeholder-btn {
      font-size: 11px !important;
      padding: 6px 12px !important;
      min-width: auto !important;
      height: 32px !important;
      background: #0078d4 !important;
      border: 1px solid #106ebe !important;
      color: white !important;
      border-radius: 4px !important;
      font-weight: 500 !important;
    }
    
    .placeholder-btn:hover {
      background: #106ebe !important;
      border-color: #005a9e !important;
    }
    
    .template-callout-section {
      background: #f8f9fa;
      border: 1px solid #e1e1e1;
      border-radius: 6px;
      padding: 16px;
      margin: 12px 0;
    }
    
    .template-callout-section h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #323130;
    }
    
    .template-box {
      background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
      border: 1px solid #106ebe;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
    }
    
    .template-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
    }
    
    .template-box h4 {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }
    
    .template-box p {
      margin: 0;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .editor-textarea {
      width: 100%;
      min-height: 120px;
      margin-top: 8px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      padding: 12px;
      border: 1px solid #e1e1e1;
      border-radius: 6px;
      resize: vertical;
      outline: none;
    }
    
    .editor-textarea:focus {
      border-color: #0078d4;
      box-shadow: 0 0 0 1px #0078d4;
    }
    `;
    document.head.appendChild(style);
}

// Minimal block-based editor UI (scaffold)
const InstructionBlockEditor: React.FC<InstructionBlockEditorProps> = ({ value, onChange, templates }) => {
  const [activeTab, setActiveTab] = useState('Templates');
  const [editorValue, setEditorValue] = useState(value);
  const [showTemplateCallout, setShowTemplateCallout] = useState(false);
  const [calloutTarget, setCalloutTarget] = useState<HTMLElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const templateList = templates || DEFAULT_INSTRUCTION_TEMPLATES;

  // Available placeholders
  const placeholders = [
    { id: 'client-name', label: 'Client Name' },
    { id: 'matter-type', label: 'Matter Type' },
    { id: 'instruction-ref', label: 'Instruction Ref' },
    { id: 'property-address', label: 'Property Address' },
    { id: 'fee-estimate', label: 'Fee Estimate' },
    { id: 'target-completion', label: 'Target Completion' },
    { id: 'next-steps', label: 'Next Steps' },
    { id: 'solicitor-name', label: 'Solicitor Name' },
    { id: 'firm-name', label: 'Firm Name' },
    { id: 'date', label: 'Date' },
  ];

  const handleInsertTemplate = (tpl: InstructionTemplate) => {
    setEditorValue(tpl.content);
    onChange(tpl.content);
    setShowTemplateCallout(false);
  };

  const handleInsertPlaceholder = (placeholder: any) => {
    const placeholderText = `{{${placeholder.id}}}`;
    const currentValue = editorValue;
    const newValue = currentValue + placeholderText;
    setEditorValue(newValue);
    onChange(newValue);
  };

  const handleShowTemplates = (event: React.MouseEvent<HTMLElement>) => {
    setCalloutTarget(event.currentTarget as HTMLElement);
    setShowTemplateCallout(true);
  };

  return (
    <div className="block-editor-container">
      <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginBottom: 16 }}>
        <DefaultButton 
          text="Templates" 
          onClick={() => setActiveTab('Templates')} 
          styles={{ root: { fontWeight: activeTab === 'Templates' ? 700 : 400 } }} 
        />
        <DefaultButton 
          text="Placeholders" 
          onClick={() => setActiveTab('Placeholders')} 
          styles={{ root: { fontWeight: activeTab === 'Placeholders' ? 700 : 400 } }} 
        />
        <DefaultButton 
          text="Insert Template" 
          iconProps={{ iconName: 'FileTemplate' }}
          onClick={handleShowTemplates}
          styles={{ 
            root: { 
              marginLeft: 'auto',
              background: colours.blue,
              color: 'white'
            },
            rootHovered: {
              background: colours.darkBlue
            }
          }}
        />
      </Stack>

      {activeTab === 'Templates' && (
        <div className="template-callout-section">
          <h3>Quick Templates</h3>
          {templateList.slice(0, 3).map((tpl: InstructionTemplate) => (
            <div key={tpl.id} className="template-box" onClick={() => handleInsertTemplate(tpl)}>
              <h4>{tpl.title}</h4>
              <p>{tpl.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Placeholders' && (
        <div className="template-callout-section">
          <h3>Quick Placeholders</h3>
          <div className="placeholder-grid">
            {placeholders.map((placeholder) => (
              <DefaultButton
                key={placeholder.id}
                className="placeholder-btn"
                text={placeholder.label}
                onClick={() => handleInsertPlaceholder(placeholder)}
              />
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={editorRef}
        className="editor-textarea"
        value={editorValue}
        onChange={(e) => {
          setEditorValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="Type your instruction or select a template..."
      />

      {/* Template Callout Window - Bottom Right */}
      {showTemplateCallout && calloutTarget && (
        <Callout
          target={calloutTarget}
          onDismiss={() => setShowTemplateCallout(false)}
          directionalHint={12}
          isBeakVisible={true}
          gapSpace={10}
          styles={{
            root: {
              maxWidth: 350,
              maxHeight: 400,
              overflow: 'auto'
            }
          }}
        >
          <div style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              All Templates
            </h3>
            {templateList.map((template: InstructionTemplate) => (
              <div key={template.id} className="template-box" onClick={() => handleInsertTemplate(template)}>
                <h4>{template.title}</h4>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </Callout>
      )}
    </div>
  );
};

export default InstructionBlockEditor;
