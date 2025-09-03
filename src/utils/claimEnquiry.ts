/**
 * Client-side API functions for claiming enquiries
 */
import { useState } from 'react';
import { getProxyBaseUrl } from './getProxyBaseUrl';

interface ClaimEnquiryRequest {
    enquiryId: string;
    userEmail: string;
}

interface ClaimEnquiryResponse {
    success: boolean;
    message: string;
    enquiryId: string;
    claimedBy: string;
    timestamp: string;
    error?: string;
}

/**
 * Claims an enquiry by updating its Point_of_Contact field
 * @param enquiryId The ID of the enquiry to claim
 * @param userEmail The email of the user claiming the enquiry
 * @returns Promise with the API response
 */
export async function claimEnquiry(enquiryId: string, userEmail: string): Promise<ClaimEnquiryResponse> {
    try {
        // Use the deployed Azure Function with environment variables
        const url = `${getProxyBaseUrl()}/${process.env.REACT_APP_CLAIM_ENQUIRY_PATH}?code=${process.env.REACT_APP_CLAIM_ENQUIRY_CODE}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                enquiryId,
                userEmail
            } as ClaimEnquiryRequest)
        });

        const result: ClaimEnquiryResponse = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return result;
    } catch (error) {
        console.error('Error claiming enquiry:', error);
        throw error;
    }
}

/**
 * Hook for claiming enquiries with loading and error states
 * Usage example in a React component:
 * 
 * const { claimEnquiry, isLoading, error } = useClaimEnquiry();
 * 
 * const handleClaim = async () => {
 *   try {
 *     await claimEnquiry(enquiry.ID, userEmail);
 *     // Refresh enquiries list
 *   } catch (err) {
 *     // Handle error
 *   }
 * };
 */
export function useClaimEnquiry() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClaimEnquiry = async (enquiryId: string, userEmail: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await claimEnquiry(enquiryId, userEmail);
            console.log('Enquiry claimed successfully:', result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim enquiry';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        claimEnquiry: handleClaimEnquiry,
        isLoading,
        error
    };
}

export default { claimEnquiry, useClaimEnquiry };
