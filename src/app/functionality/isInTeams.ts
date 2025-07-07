export function isInTeams(): boolean {
// invisible change
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
