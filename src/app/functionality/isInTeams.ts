export function isInTeams(): boolean {
  // More robust detection to handle Teams mobile and desktop clients
  // without incorrectly falling back to local dev.
  try {
    // 1) Iframe heuristic (typical for Teams desktop/web)
    if (window.self !== window.top) return true;

    // 2) User-Agent heuristics (Teams desktop/mobile apps include these tokens)
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    const uaLower = ua.toLowerCase();
    if (
      ua.includes('Teams') ||
      ua.includes('MicrosoftTeams') ||
      ua.includes('TeamsMobile') ||
      uaLower.includes('teamsandroid') ||
      uaLower.includes('teamsios') ||
      uaLower.includes('edgteams') ||
      uaLower.includes('electron') && uaLower.includes('teams')
    ) {
      return true;
    }

    // 3) Query param escape hatch for diagnostics/testing
    // e.g. append ?inTeams=1 to force Teams-mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('inTeams') === '1') return true;
    }

    // 4) Otherwise, assume not in Teams
    return false;
  } catch {
    // If cross-origin checks fail or UA parsing throws, err on the side of Teams
    return true;
  }
}
