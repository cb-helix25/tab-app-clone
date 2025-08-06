import { UserData } from './functionality/types';

// Centralized list of admin users by initials
export const ADMIN_USERS = ['LZ', 'AC', 'CB'] as const;

// Helper to determine if a user has admin privileges
export function isAdminUser(user?: UserData | null): boolean {
    if (!user) return false;
    const initials = user.Initials?.toUpperCase().trim();
    const first = user.First?.toLowerCase().trim();
    const nickname = user.Nickname?.toLowerCase().trim();
    const adminNames = ['lukasz', 'luke', 'alex', 'cass'];
    return !!(
        (initials && ADMIN_USERS.includes(initials as any)) ||
        (first && adminNames.includes(first)) ||
        (nickname && adminNames.includes(nickname))
    );
}

// Helper to determine if a user is a power user (admin or has 'operations'/'tech' in AOW)
export function isPowerUser(user?: UserData | null): boolean {
    if (!user) return false;
    if (isAdminUser(user)) return true;
    const areas = (user.AOW || '').toLowerCase();
    return areas.includes('operations') || areas.includes('tech');
}