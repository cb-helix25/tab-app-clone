import { ProcessingStep } from './ProcessingSection';
import activeIcon from '../../assets/activecampaign.svg';

export interface ProcessingAction {
    label: string;
    icon?: string;
    run: (formData: Record<string, any>) => Promise<string>;
}

export const processingActions: ProcessingAction[] = [
    {
        label: 'Retrieve ActiveCampaign Token',
        icon: activeIcon,
        run: async () => {
            const res = await fetch('/api/keys/ac-automations-apitoken');
            if (!res.ok) throw new Error('Failed to fetch secret');
            await res.json();
            return 'Token retrieved';
        }
    }
];

export const initialSteps: ProcessingStep[] = processingActions.map(action => ({
    label: action.label,
    status: 'pending',
    icon: action.icon
}));