const fs = require('fs');

const addGlow = "textShadow: theme === 'dark' && activeColor ? `0 0 12px ${activeColor}` : 'none'";

// 1. Income.jsx
let income = fs.readFileSync('./src/pages/Income.jsx', 'utf8');
income = income.replace(
    /<h3 className="form-title" style={{ marginBottom: '16px' }}>{title}<\/h3>/g,
    `<h3 className="form-title" style={{ marginBottom: '16px', ${addGlow} }}>{title}</h3>`
);
income = income.replace(
    /<h3 className="form-title">{title}<\/h3>/g,
    `<h3 className="form-title" style={{ ${addGlow} }}>{title}</h3>`
);
fs.writeFileSync('./src/pages/Income.jsx', income, 'utf8');

// 2. Expenses.jsx
let expenses = fs.readFileSync('./src/pages/Expenses.jsx', 'utf8');
expenses = expenses.replace(
    /<h3 className="form-title" style={{ marginBottom: '16px' }}>{title}<\/h3>/g,
    `<h3 className="form-title" style={{ marginBottom: '16px', ${addGlow} }}>{title}</h3>`
);
expenses = expenses.replace(
    /<h3 className="form-title">{title}<\/h3>/g,
    `<h3 className="form-title" style={{ ${addGlow} }}>{title}</h3>`
);
expenses = expenses.replace(
    /<label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px' }}>/g,
    `<label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px', ${addGlow} }}>`
);
fs.writeFileSync('./src/pages/Expenses.jsx', expenses, 'utf8');

// 3. GoalsSection.jsx
let goals = fs.readFileSync('./src/components/dashboard/GoalsSection.jsx', 'utf8');
// GoalsSection uses newGoal.color for the active color inside the modal context
const goalsGlow = "textShadow: theme === 'dark' ? `0 0 12px ${newGoal.color}` : 'none'";

goals = goals.replace(
    /<h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>/g,
    `<h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', ${goalsGlow} }}>`
);
goals = goals.replace(
    /<label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px' }}>/g,
    `<label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px', ${goalsGlow} }}>`
);
fs.writeFileSync('./src/components/dashboard/GoalsSection.jsx', goals, 'utf8');

console.log("Done");
