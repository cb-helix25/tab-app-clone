import { ProcessingStep } from './ProcessingSection';
import activeIcon from '../../../assets/activecampaign.svg';
import clioIcon from '../../../assets/clio.svg';
import asanaIcon from '../../../assets/asana.svg';

export interface ProcessingAction {
    label: string;
    icon?: string;
    run: (
        formData: Record<string, any>,
        userInitials: string,
        userData?: any[] | null
    ) => Promise<string>;
}

export const processingActions: ProcessingAction[] = [
    {
        label: 'Retrieve ActiveCampaign Token',
        icon: activeIcon,
        run: async () => {
            const res = await fetch('/api/keys/ac-automations-apitoken/preview');
            if (!res.ok) throw new Error('Failed to fetch secret preview');
            const data = await res.json();
            return `Token preview: ${data.preview}`;
        }
    },
    {
        label: 'Retrieve Clio Client ID',
        icon: clioIcon,
        run: async (_form, initials) => {
            const res = await fetch(`/api/keys/${initials.toLowerCase()}-clio-v1-clientid`);
            if (!res.ok) throw new Error('Failed to fetch secret');
            await res.json();
            return 'Client ID retrieved';
        }
    },
    {
        label: 'Retrieve Clio Client Secret',
        icon: clioIcon,
        run: async (_form, initials) => {
            const res = await fetch(`/api/keys/${initials.toLowerCase()}-clio-v1-clientsecret`);
            if (!res.ok) throw new Error('Failed to fetch secret');
            await res.json();
            return 'Client Secret retrieved';
        }
    },
    {
        label: 'Retrieve Clio Refresh Token',
        icon: clioIcon,
        run: async (_form, initials) => {
            const res = await fetch(`/api/keys/${initials.toLowerCase()}-clio-v1-refreshtoken`);
            if (!res.ok) throw new Error('Failed to fetch secret');
            await res.json();
            return 'Refresh Token retrieved';
        }
    },
    {
        label: 'Retrieve Asana Client ID',
        icon: asanaIcon,
        run: async (_form, _i, userData) => {
            const id = userData?.[0]?.ASANAClientID;
            if (!id) throw new Error('Asana Client ID missing');
            return 'Client ID retrieved';
        }
    },
    {
        label: 'Retrieve Asana Secret',
        icon: asanaIcon,
        run: async (_form, _i, userData) => {
            const secret = userData?.[0]?.ASANASecret;
            if (!secret) throw new Error('Asana Secret missing');
            return 'Secret retrieved';
        }
    },
    {
        label: 'Retrieve Asana Refresh Token',
        icon: asanaIcon,
        run: async (_form, _i, userData) => {
            const token = userData?.[0]?.ASANARefreshToken;
            if (!token) throw new Error('Asana Refresh Token missing');
            return 'Refresh Token retrieved';
        }
    },
    { label: 'Matter Request Created', run: async () => 'Done' },
    { label: 'Contact Created/Updated', run: async () => 'Done' },
    { label: 'Databases Updated', run: async () => 'Done' },
    { label: 'Clio Contact Created/Updated', run: async () => 'Done' },
    { label: 'Clio Matter Opened', run: async () => 'Done' },
    { label: 'NetDocument Workspace Triggered', run: async () => 'Done' },
    { label: 'Databases Updated', run: async () => 'Done' }
];

export const initialSteps: ProcessingStep[] = processingActions.map(action => ({
    label: action.label,
    status: 'pending',
    icon: action.icon
}));