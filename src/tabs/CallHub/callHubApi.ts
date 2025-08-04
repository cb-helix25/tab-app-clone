import { CallEvent, ClientInfo } from './types';

/**
 * Send a Call Hub event to the backend.
 * The backend can process actions such as claim, contact and save.
 */
export async function sendCallEvent(event: CallEvent): Promise<void> {
    const resp = await fetch('/api/callhub/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
    if (!resp.ok) {
        const message = await resp.text();
        throw new Error(message || 'Failed to send call event');
    }
}

/**
 * Lookup client information by phone number. Returns null if no client found.
 */
export async function lookupClient(countryCode: string, phone: string): Promise<ClientInfo | null> {
    const resp = await fetch(
        `/api/callhub/client?countryCode=${encodeURIComponent(countryCode)}&phone=${encodeURIComponent(phone)}`
    );
    if (resp.status === 404) {
        return null;
    }
    if (!resp.ok) {
        throw new Error('Client lookup failed');
    }
    return resp.json();
}
