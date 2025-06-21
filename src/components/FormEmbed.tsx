import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { FormItem, UserData, Matter } from '../app/functionality/types';
import BespokeForm from '../CustomForms/BespokeForms';
import loaderIcon from '../assets/grey helix mark.png';

interface FormEmbedProps {
    link: FormItem;
    userData: UserData[] | null;
    matters: Matter[];
}

const loaderStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
};

const FormEmbed: React.FC<FormEmbedProps> = ({ link, userData, matters }) => {
    const formContainerRef = useRef<HTMLDivElement>(null);
    const [isCognitoLoaded, setIsCognitoLoaded] = useState<boolean>(false);
    const [formKey, setFormKey] = useState<number>(() => Date.now());
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

    const loadCognitoScript = useCallback(() => {
        if (document.getElementById('cognito-forms-script')) {
            setIsCognitoLoaded(true);
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'cognito-forms-script';
            script.src = 'https://www.cognitoforms.com/f/seamless.js';
            script.async = true;
            script.onload = () => {
                setIsCognitoLoaded(true);
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }, []);

    useEffect(() => {
        if (link.embedScript) {
            loadCognitoScript().catch((err) => console.error(err));
        }
    }, [link.embedScript, loadCognitoScript]);

    useEffect(() => {
        if (isCognitoLoaded && link.embedScript && formContainerRef.current) {
            formContainerRef.current.innerHTML = '';
            const formScript = document.createElement('script');
            formScript.src = 'https://www.cognitoforms.com/f/seamless.js';
            formScript.async = true;
            formScript.setAttribute('data-key', link.embedScript.key);
            formScript.setAttribute('data-form', link.embedScript.formId);
            formContainerRef.current.appendChild(formScript);
        }
    }, [isCognitoLoaded, link.embedScript]);

    const handleFinancialSubmit = useCallback(
        async (values: any) => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            const payload = {
                formType: link.title,
                data: values,
                initials: userData?.[0]?.Initials || 'N/A',
            };
            const endpointUrl = `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_POST_FINANCIAL_TASK_PATH}?code=${process.env.REACT_APP_POST_FINANCIAL_TASK_CODE}`;
            try {
                const response = await fetch(endpointUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Error posting financial task:', errText);
                    setSubmissionSuccess(null);
                } else {
                    await response.json();
                    setSubmissionSuccess('Financial form submitted successfully!');
                    setTimeout(() => {
                        setSubmissionSuccess(null);
                        setFormKey(Date.now());
                    }, 3000);
                }
            } catch (error: any) {
                console.error('Error in financial form submission:', error);
                setSubmissionSuccess(null);
            } finally {
                setIsSubmitting(false);
            }
        },
        [link.title, userData, isSubmitting]
    );

    return (
        <div style={{ padding: '10px 0' }}>
            {submissionSuccess && (
                <MessageBar
                    messageBarType={MessageBarType.success}
                    isMultiline={false}
                    onDismiss={() => setSubmissionSuccess(null)}
                    dismissButtonAriaLabel="Close"
                    styles={{ root: { marginBottom: '10px', borderRadius: '4px' } }}
                >
                    {submissionSuccess}
                </MessageBar>
            )}
            {link.embedScript ? (
                <div ref={formContainerRef}>
                    {!isCognitoLoaded && (
                        <div style={loaderStyle}>
                            <img src={loaderIcon} alt="Loading..." style={{ width: '100px', height: 'auto' }} />
                        </div>
                    )}
                </div>
            ) : link.fields ? (
                <BespokeForm
                    key={formKey}
                    fields={link.fields.map((f) => ({ ...f, name: f.label }))}
                    onSubmit={handleFinancialSubmit}
                    onCancel={() => { }}
                    isSubmitting={isSubmitting}
                    matters={matters}
                />
            ) : (
                <div>No form available for this item.</div>
            )}
        </div>
    );
};

export default FormEmbed;