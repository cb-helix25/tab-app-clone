import { FormItem, SectionName } from '../../app/functionality/types';
import { financialForms } from './FinancialForms';
import BundleForm from '../../CustomForms/BundleForm';
import NotableCaseInfoForm from '../../CustomForms/NotableCaseInfoForm';

// invisible change
// Forms grouped by section (excluding Favorites which is dynamic)
export const formSections: { [key in Exclude<SectionName, 'Favorites'>]: FormItem[] } = {
    General_Processes: [
        {
            title: 'Tel. Attendance Note',
            url: 'https://www.cognitoforms.com/Helix1/TelephoneAttendanceNote',
            icon: 'Phone',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '41' },
            description: 'Record telephone attendance notes and call details for client matters',
        },
        {
            title: 'Tasks',
            url: 'https://www.cognitoforms.com/Helix1/V2Tasks',
            icon: 'BulletedList',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '90' },
            description: 'Create and manage general tasks and reminders for team members',
        },
        {
            title: 'Office Attendance',
            url: 'https://www.cognitoforms.com/Helix1/OfficeAttendance',
            icon: 'Calendar',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '109' },
            description: 'Log daily office attendance and working arrangements',
        },
        {
            title: 'Proof of Identity',
            url: 'https://www.cognitoforms.com/Helix1/WebFormProofOfIdentityV2',
            icon: 'Contact',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '60' },
            description: 'Verify and record client identity documents and verification status',
        },
        {
            title: 'Open a Matter',
            url: 'https://www.cognitoforms.com/Helix1/OpenAMatter',
            icon: 'FolderOpen',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '9' },
            description: 'Create new client matters and set up case management workflows',
        },
        {
            title: 'CollabSpace Requests',
            url: 'https://www.cognitoforms.com/Helix1/CollabSpaceRequests',
            icon: 'People',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '44' },
            description: 'Request shared collaboration spaces for client matter teams',
        },
    ],
    Operations: [
        {
            title: 'Call Handling',
            url: 'https://www.cognitoforms.com/Helix1/V2CallHandling',
            icon: 'Phone',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '98' },
            description: 'Log incoming calls and route enquiries to appropriate team members',
        },
        {
            title: 'Transaction Intake',
            url: 'https://www.cognitoforms.com/Helix1/TransactionsIntakeV2',
            icon: 'Bank',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '58' },
            description: 'Process and record property transaction details and requirements',
        },
        {
            title: 'Incoming Post',
            url: 'https://www.cognitoforms.com/Helix1/IncomingPost',
            icon: 'Mail',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '108' },
            description: 'Log and distribute incoming postal mail and document deliveries',
        },
        {
            title: 'Bundle',
            url: '',
            icon: 'Folder',
            component: BundleForm,
            description: 'Submit NetDocs document bundles for court proceedings and hearings',
        },
        {
            title: 'Notable Case Info',
            url: '',
            icon: 'Important',
            component: NotableCaseInfoForm,
            description: 'Record details of significant cases for legal directories and publications',
        },
    ],
    Financial: financialForms,
};

export type FormSections = typeof formSections;