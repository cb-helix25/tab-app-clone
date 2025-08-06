import React, { useEffect, useState } from 'react';
import { getCallLogs, clearCallLogs, CallLogEntry } from '../utils/callLogger';
import { ADMIN_USERS } from '../app/admin';

const Data: React.FC = () => {
    const currentUser = (localStorage.getItem('__currentUserInitials') || '').toLowerCase();
    const [logs, setLogs] = useState<CallLogEntry[]>(getCallLogs());
    const allowedUsers = ADMIN_USERS.map(u => u.toLowerCase());

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs([...getCallLogs()]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!allowedUsers.includes(currentUser)) {
        return <div style={{ padding: '1rem' }}>Access denied</div>;
    }

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Network Calls</h1>
            <button onClick={() => window.history.back()}>Back</button>
            <button onClick={clearCallLogs} style={{ marginLeft: '0.5rem' }}>
                Clear
            </button>
            <table style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }}>
                <thead>
                    <tr>
                        <th align="left">Method</th>
                        <th align="left">URL</th>
                        <th align="left">Status</th>
                        <th align="left">Time (ms)</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((l, i) => (
                        <tr key={i}>
                            <td>{l.method}</td>
                            <td>{l.url}</td>
                            <td>{l.status ?? 'error'}</td>
                            <td>{Math.round(l.durationMs)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Data;
