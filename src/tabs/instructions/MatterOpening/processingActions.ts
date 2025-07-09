import { ProcessingStep } from './ProcessingSection';

export interface ProcessingAction {
    label: string;
    run: (formData: Record<string, any>) => Promise<string>;
}

export const processingActions: ProcessingAction[] = [
    {
        label: 'Fetch Tokens',
        run: async () => {
            await new Promise(res => setTimeout(res, 500));
            return 'Tokens retrieved';
        }
    }
];

export const initialSteps: ProcessingStep[] = processingActions.map(action => ({
    label: action.label,
    status: 'pending'
}));