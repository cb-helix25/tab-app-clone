import { useEffect, useState } from 'react';
import { InstructionData } from '../../../app/functionality/types';
import teamData from '../../../localData/team-sql-data.json';

const INITIAL_FIELDS: Record<string, string> = {
    insert_clients_name: '',
    insert_heading_eg_matter_description: '',
    matter: '',
    name_of_person_handling_matter: '',
    status: '',
    email: '',
    insert_current_position_and_scope_of_retainer: '',
    next_steps: '',
    realistic_timescale: '',
    identify_the_other_party_eg_your_opponents: ''
};

export function useTemplateFields(selectedInstruction?: InstructionData | null) {
    const [templateFields, setTemplateFields] = useState<Record<string, string>>(INITIAL_FIELDS);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!selectedInstruction) return;

        const updatedFields = { ...templateFields };
        const first = (selectedInstruction as any).FirstName || '';
        const last = (selectedInstruction as any).LastName || '';
        const prefix = (selectedInstruction as any).Title ? `${(selectedInstruction as any).Title} ` : '';
        const company = (selectedInstruction as any).CompanyName || '';
        const name = (first || last) ? `${prefix}${first} ${last}`.trim() : company;
        if (name) updatedFields.insert_clients_name = name;

        if (selectedInstruction.title && !updatedFields.matter) {
            updatedFields.matter = selectedInstruction.title;
        }
        if (selectedInstruction.title && !updatedFields.insert_heading_eg_matter_description) {
            updatedFields.insert_heading_eg_matter_description = `RE: ${selectedInstruction.title}`;
        }
        if (selectedInstruction.description && !updatedFields.insert_current_position_and_scope_of_retainer) {
            updatedFields.insert_current_position_and_scope_of_retainer = selectedInstruction.description;
        }
        if ((selectedInstruction as any).Email && !updatedFields.email) {
            updatedFields.email = (selectedInstruction as any).Email;
        }

        const currentUser = (teamData as any[])[0] || {};
        if (!updatedFields.name_of_person_handling_matter && currentUser['Full Name']) {
            updatedFields.name_of_person_handling_matter = currentUser['Full Name'];
        }
        if (!updatedFields.status && currentUser.Role) {
            updatedFields.status = currentUser.Role;
        }

        setTemplateFields(updatedFields);
    }, [selectedInstruction]);

    return { templateFields, setTemplateFields, activeField, setActiveField, touchedFields, setTouchedFields };
}