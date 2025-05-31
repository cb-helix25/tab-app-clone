export function isInTeams(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
