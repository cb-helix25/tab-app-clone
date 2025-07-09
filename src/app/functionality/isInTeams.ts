export function isInTeams(): boolean {
// invisible change 2
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
