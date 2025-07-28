import React from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { generateTemplateContent, GenerationOptions } from './utils/templateUtils';

interface Props extends GenerationOptions {
    documentContent: string;
    templateFields: Record<string, string>;
}

const CCLPreview: React.FC<Props> = ({ documentContent, templateFields, ...options }) => {
    const generated = generateTemplateContent(documentContent, templateFields, options);
    return <DocumentRenderer template={generated} />;
};

export default CCLPreview;