// Simplified set of template blocks for the pitch builder.
import { IStyleFunctionOrObject, IDropdownStyles, IDropdownStyleProps } from '@fluentui/react';

export interface TemplateBlock {
  title: string;
  description: string;
  placeholder: string;
  isMultiSelect?: boolean;
  options: TemplateOption[];
  dropdownStyles?: IStyleFunctionOrObject<IDropdownStyleProps, IDropdownStyles>;
}

export interface TemplateOption {
  label: string;
  previewText: string;
}

export const templateBlocks: TemplateBlock[] = [
  {
    title: 'Intro',
    description: 'Opening greeting for the enquiry.',
    placeholder: '[Intro Placeholder]',
    isMultiSelect: true,
    options: [
      {
        label: 'Standard Intro',
        previewText: 'Thank you for your enquiry. We are reviewing the details.'
      }
    ]
  },
  {
    title: 'Next Steps',
    description: 'Outline the next steps for the client.',
    placeholder: '[Next Steps Placeholder]',
    isMultiSelect: true,
    options: [
      {
        label: 'Standard Next Steps',
        previewText: 'We will review your documents and revert with advice.'
      }
    ]
  },
  {
    title: 'Closing',
    description: 'A short closing statement.',
    placeholder: '[Closing Placeholder]',
    isMultiSelect: true,
    options: [
      {
        label: 'Standard Closing',
        previewText: 'Kind regards,\n\nThe Team'
      }
    ]
  }
];