const fs = require('fs');

const addGlow = "textShadow: theme === 'dark' && activeColor ? `0 0 12px ${activeColor}` : 'none'";

let expenses = fs.readFileSync('./src/pages/Expenses.jsx', 'utf8');

// Replace labels in subscription section
expenses = expenses.replace(
    /<label style={{ fontSize: '0.85rem', color: 'var\(--text-secondary\)', fontWeight: 500, paddingLeft: '4px' }}>/g,
    `<label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px', ${addGlow} }}>`
);

// Also add glow to the title wrapper
expenses = expenses.replace(
    /<div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>/g,
    `<div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', ${addGlow} }}>`
);

fs.writeFileSync('./src/pages/Expenses.jsx', expenses, 'utf8');

console.log("Done");
