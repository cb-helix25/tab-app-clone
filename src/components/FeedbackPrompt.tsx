import React, { useState } from 'react';
import InfoPopover from './InfoPopover';
import '../app/styles/FeedbackPrompt.css';

interface FeedbackPromptProps {
    userInitials: string;
}

const allowedInitials = ['LZ', 'AC', 'JW'];

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ userInitials }) => {
    const [text, setText] = useState('');

    if (!allowedInitials.includes(userInitials)) return null;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        // Placeholder for real submit logic
        alert('Feedback submitted');
    };

    return (
        <form className="feedback-prompt" onSubmit={handleSubmit}>
            <label>
                <span>Your feedback</span>
                <textarea
                    rows={3}
                    value={text}
                    onChange={handleChange}
                />
            </label>
            <button type="submit" disabled={!text.trim()}>
                Send
            </button>
            <InfoPopover text="Feedback entered here is emailed to lz@helix-law.com" />
        </form>
    );
};

export default FeedbackPrompt;