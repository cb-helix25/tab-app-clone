import { FormItem, SectionName } from '../../app/functionality/types';
import { financialForms } from './FinancialForms';
import BundleForm from '../../CustomForms/BundleForm';

// invisible change
// Forms grouped by section (excluding Favorites which is dynamic)
export const formSections: { [key in Exclude<SectionName, 'Favorites'>]: FormItem[] } = {
    General_Processes: [
        {
            title: 'Tel. Attendance Note',
            url: 'https://www.cognitoforms.com/Helix1/TelephoneAttendanceNote',
            icon: 'Phone',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '41' },
        },
        {
            title: 'Tasks',
            url: 'https://www.cognitoforms.com/Helix1/V2Tasks',
            icon: 'BulletedList',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '90' },
        },
        {
            title: 'Office Attendance',
            url: 'https://www.cognitoforms.com/Helix1/OfficeAttendance',
            icon: 'Calendar',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '109' },
        },
        {
            title: 'Proof of Identity',
            url: 'https://www.cognitoforms.com/Helix1/WebFormProofOfIdentityV2',
            icon: 'Contact',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '60' },
        },
        {
            title: 'Open a Matter',
            url: 'https://www.cognitoforms.com/Helix1/OpenAMatter',
            icon: 'FolderOpen',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '9' },
        },
        {
            title: 'CollabSpace Requests',
            url: 'https://www.cognitoforms.com/Helix1/CollabSpaceRequests',
            icon: 'People',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '44' },
        },
    ],
    Operations: [
        {
            title: 'Call Handling',
            url: 'https://www.cognitoforms.com/Helix1/V2CallHandling',
            icon: 'Phone',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '98' },
        },
        {
            title: 'Transaction Intake',
            url: 'https://www.cognitoforms.com/Helix1/TransactionsIntakeV2',
            icon: 'Bank',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '58' },
        },
        {
            title: 'Incoming Post',
            url: 'https://www.cognitoforms.com/Helix1/IncomingPost',
            icon: 'Mail',
            embedScript: { key: 'QzaAr_2Q7kesClKq8g229g', formId: '108' },
        },
        {
            title: 'Bundle',
            url: '',
            icon: 'Folder',
            component: BundleForm,
        },
    ],
    Financial: financialForms,
};

export type FormSections = typeof formSections;