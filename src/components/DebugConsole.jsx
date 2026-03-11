import React, { useState, useEffect } from 'react';

const DebugConsole = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const originalError = console.error;
        const originalLog = console.log;
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    setLogs(prev => [...prev.slice(-10), { type: 'error', msg: `NET ERR: ${response.status} ${response.url}` }]);
                }
                return response;
            } catch (err) {
                setLogs(prev => [...prev.slice(-10), { type: 'error', msg: `FETCH CRASH: ${err.message}` }]);
                throw err;
            }
        };

        console.error = (...args) => {
            setLogs(prev => [...prev.slice(-10), { type: 'error', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') }]);
            originalError(...args);
        };

        console.log = (...args) => {
            setLogs(prev => [...prev.slice(-10), { type: 'log', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') }]);
            originalLog(...args);
        };

        return () => {
            console.error = originalError;
            console.log = originalLog;
            window.fetch = originalFetch;
        };
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: 10, fontSize: '10px', maxWidth: '400px', pointerEvents: 'none' }}>
            <div style={{color: 'yellow', marginBottom: '4px'}}>Network Debugger Online</div>
            {logs.map((L, i) => <div key={i} style={{ color: L.type === 'error' ? '#ff4d4f' : '#52c41a' }}>{L.msg}</div>)}
        </div>
    );
};
export default DebugConsole;
