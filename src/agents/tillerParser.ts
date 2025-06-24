export interface TillerResponse {
    checkTypeId: number;
    result: string;
    status: string;
    [key: string]: any;
}

export type ActionType =
    | { type: 'notify'; team: string; message: string }
    | { type: 'log'; level: 'info' | 'error'; message: string }
    | { type: 'decision'; next: string }
    | { type: 'none' };

// Basic mapping placeholder. Extend using AGENTS.md as schemas evolve.
const actionMap: Record<number, Record<string, Record<string, ActionType>>> = {
    1: {
        pass: {
            complete: { type: 'none' },
        },
        fail: {
            complete: { type: 'notify', team: 'compliance', message: 'Check 1 failed' },
        },
    },
};

export function interpretTiller(response: TillerResponse): ActionType {
    const byCheck = actionMap[response.checkTypeId];
    const byResult = byCheck?.[response.result];
    const action = byResult?.[response.status];
    if (action) return action;
    if (response.status === 'error') {
        return { type: 'log', level: 'error', message: `Error status for check ${response.checkTypeId}` };
    }
    return { type: 'log', level: 'info', message: 'Unhandled response' };
  }