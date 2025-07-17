export function getDraftCclPath(matterId: string): string {
    return `/instructions/${matterId}/draft-ccl`;
}

export function getCclPath(): string {
    return '/instructions/ccl';
}