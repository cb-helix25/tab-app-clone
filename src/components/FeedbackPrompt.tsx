import React, { useState } from 'react';
import InfoPopover from './InfoPopover';
import '../app/styles/FeedbackPrompt.css';

interface FeedbackPromptProps {
    userInitials: string;
}

const allowedInitials = ['LZ', 'AC', 'JW'];

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ userInitials }) => {
    const [file, setFile] = useState<File | null>(null);

    if (!allowedInitials.includes(userInitials)) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        // Placeholder for real upload logic
        alert('File submitted');
    };

    return (
        <form className="feedback-prompt" onSubmit={handleSubmit}>
            <label>
                <span>Upload feedback</span>
                <input type="file" onChange={handleChange} />
            </label>
            <button type="submit" disabled={!file}>
                Send
            </button>
            <InfoPopover text="Files uploaded here are emailed to lz@helix-law.com" />
        </form>
    );
};

export default FeedbackPrompt;