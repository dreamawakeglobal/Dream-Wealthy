import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Wallet, TrendingDown, Percent, Flame, Wind, CloudRain, AlertTriangle } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useFinancialContext } from '../FinancialContext';
import { Modal } from '../components/ui/Modal';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import './Expenses.css';

const ExpenseForm = ({ onAdd, title, placeholder }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && amount) {
            onAdd({ id: Date.now(), name, amount: parseFloat(amount), frequency: 'monthly' });
            setName('');
            setAmount('');
        }
    };

    return (
        <Card glass className="expense-form-card">
            <h3 className="form-title">{title}</h3>
            <form onSubmit={handleSubmit} className="expense-form">
                <Input
                    placeholder={placeholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ color: 'black' }}
                />
                <div className="amount-input-group">
                    <Input
                        type="number"
                        placeholder="Amount"
                        leftIcon={Wallet}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0"
                        style={{ color: 'black' }}
                    />
                    <Button type="submit" variant="secondary">
                        <Plus size={18} /> Add
                    </Button>
                </div>
            </form>
        </Card>
    );
};

const ExpenseList = ({ expenses, onRemove, onEdit, emptyMessage, showTracking = false, transactionsByCategory = {} }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const totalPages = Math.ceil(expenses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

    const handleSpentChange = (id, value) => {
        setSpentAmounts(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const startEditing = (expense) => {
        setEditingId(expense.id);
        setEditName(expense.name);
        setEditAmount(expense.amount.toString());
    };

    const saveEdit = (id) => {
        if (editName && editAmount) {
            onEdit(id, { name: editName, amount: parseFloat(editAmount) });
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    if (expenses.length === 0) {
        return <div className="empty-state text-muted">{emptyMessage}</div>;
    }

    return (
        <div className="stream-list">
            {currentExpenses.map((expense) => (
                <AnimateOnScroll key={expense.id} delay={0.05} yOffset={20}>
                    <div className={`stream-item ${expense.is_paid ? 'paid' : ''} glass`}>
                        {editingId === expense.id ? (
                            <div className="stream-edit-form" style={{ display: 'flex', width: '100%', gap: '8px', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Name"
                                        style={{ flex: 1 }}
                                    />
                                    <Input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        placeholder="Amount"
                                        style={{ width: '100px' }}
                                    />
                                </div>
                                <div className="stream-actions">
                                    <Button size="sm" onClick={() => saveEdit(expense.id)}>Save</Button>
                                    <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    {!showTracking && (
                                        <div className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="expense-checkbox"
                                                checked={expense.is_paid || false}
                                                onChange={(e) => onEdit(expense.id, { is_paid: e.target.checked })}
                                                title={expense.is_paid ? "Mark as unpaid" : "Mark as paid"}
                                            />
                                        </div>
                                    )}
                                    <div className="stream-info">
                                        <p className="stream-name">{expense.name}</p>
                                        <span className="stream-freq">Monthly</span>
                                    </div>
                                </div>

                                {showTracking && (
                                    <div className="expense-tracking" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface-hover)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--surface-border)', gap: '8px', margin: '0 8px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Auto-Tracker: $</span>
                                            <input
                                                type="number"
                                                value={expense.manual_spent !== undefined ? expense.manual_spent : (transactionsByCategory[expense.name] || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    onEdit(expense.id, { manual_spent: val === '' ? undefined : Number(val) });
                                                }}
                                                style={{ width: '80px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '0.9rem', textAlign: 'right', outline: 'none', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--surface-border)'}
                                            />
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: (() => {
                                                const spent = expense.manual_spent !== undefined ? Number(expense.manual_spent) : (Number(transactionsByCategory[expense.name]) || 0);
                                                const left = expense.amount - spent;
                                                if (left <= 0) return 'var(--danger)';
                                                if (left <= expense.amount * 0.1) return '#ff9f0a';
                                                return 'var(--success)';
                                            })()
                                        }}>
                                            Left: ${(expense.amount - (expense.manual_spent !== undefined ? Number(expense.manual_spent) : (Number(transactionsByCategory[expense.name]) || 0))).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                <div className="stream-actions">
                                    <span className="stream-amount negative" style={{ minWidth: '80px', textAlign: 'right' }}>${expense.amount.toLocaleString()}</span>
                                    <Button size="sm" variant="secondary" onClick={() => startEditing(expense)}>Edit</Button>
                                    <button onClick={() => onRemove(expense.id)} className="btn-icon danger">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </AnimateOnScroll>
            ))}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

const Expenses = () => {
    const {
        fixedExpenses, setFixedExpenses,
        variableExpenses, setVariableExpenses,
        totalFixedExpenses, totalVariableExpenses, totalMonthlyExpenses,
        netMonthlyCashFlow, savingsRate, debts, setDebts,
        transactionsByCategory, transactions
    } = useFinancialContext();

    // --- Modal State ---
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
    const [activityPage, setActivityPage] = useState(1);
    const activityItemsPerPage = 6;

    // --- Derived Modal Data ---
    const uniqueCategories = useMemo(() => {
        if (!transactions) return ['All'];
        const cats = new Set(transactions.map(tx => tx.category || 'Uncategorized'));
        return ['All', ...cats].sort();
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        if (activityCategoryFilter === 'All') return transactions;
        return transactions.filter(tx => (tx.category || 'Uncategorized') === activityCategoryFilter);
    }, [transactions, activityCategoryFilter]);

    const activityTotalPages = Math.ceil(filteredTransactions.length / activityItemsPerPage);
    const paginatedTransactions = filteredTransactions.slice((activityPage - 1) * activityItemsPerPage, activityPage * activityItemsPerPage);

    const filteredTotalAmount = useMemo(() => {
        return filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }, [filteredTransactions]);

    // --- Debt Destroyer State & Handlers ---
    const [strategy, setStrategy] = useState('avalanche');
    const [extraPayment, setExtraPayment] = useState(0);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDebt, setNewDebt] = useState({ name: '', balance: '', rate: '', minPayment: '' });

    // --- Subscriptions State ---
    const COMMON_SUBSCRIPTIONS = [
        { id: 'netflix', name: 'Netflix', domain: 'netflix.com', cost: 15.49 },
        { id: 'spotify', name: 'Spotify', domain: 'spotify.com', cost: 11.99 },
        { id: 'apple-music', name: 'Apple Music', domain: 'apple.com', cost: 10.99 },
        { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', cost: 13.99 },
        { id: 'hulu', name: 'Hulu', domain: 'hulu.com', cost: 17.99 },
        { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', cost: 13.99 },
        { id: 'hbo', name: 'Max', domain: 'max.com', cost: 16.99 },
        { id: 'amazon', name: 'Amazon Prime', domain: 'amazon.com', cost: 14.99 },
        { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'openai.com', cost: 20.00 },
        { id: 'icloud', name: 'iCloud+', domain: 'icloud.com', cost: 2.99 },
        { id: 'paramount', name: 'Paramount+', domain: 'paramountplus.com', cost: 11.99 },
        { id: 'peacock', name: 'Peacock', domain: 'peacocktv.com', cost: 7.99 },
    ];
    const [activeSubscriptions, setActiveSubscriptions] = useState([]);
    const [showAddSub, setShowAddSub] = useState(false);
    const [newSub, setNewSub] = useState({ name: '', cost: '', domain: '' });

    const toggleSubscription = (sub) => {
        setActiveSubscriptions(prev => {
            const exists = prev.find(s => s.id === sub.id);
            if (exists) return prev.filter(s => s.id !== sub.id);
            return [...prev, sub];
        });
    };

    const addCustomSubscription = (e) => {
        e.preventDefault();
        if (newSub.name && newSub.cost) {
            const custom = {
                id: `custom-${Date.now()}`,
                name: newSub.name,
                domain: newSub.domain || `${newSub.name.toLowerCase().replace(/\s+/g, '')}.com`,
                cost: parseFloat(newSub.cost)
            };
            setActiveSubscriptions(prev => [...prev, custom]);
            setNewSub({ name: '', cost: '', domain: '' });
            setShowAddSub(false);
        }
    };

    const removeSubscription = (id) => {
        setActiveSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const [editingSubId, setEditingSubId] = useState(null);
    const [editSubName, setEditSubName] = useState('');
    const [editSubCost, setEditSubCost] = useState('');

    const startEditingSub = (sub) => {
        setEditingSubId(sub.id);
        setEditSubName(sub.name);
        setEditSubCost(sub.cost.toString());
    };

    const saveSubEdit = (id) => {
        if (editSubName && editSubCost) {
            setActiveSubscriptions(prev => prev.map(s => s.id === id ? { ...s, name: editSubName, cost: parseFloat(editSubCost) } : s));
        }
        setEditingSubId(null);
    };

    const totalSubscriptionCost = activeSubscriptions.reduce((sum, s) => sum + s.cost, 0);

    const handleAddDebt = (e) => {
        e.preventDefault();
        if (newDebt.name && newDebt.balance && newDebt.rate && newDebt.minPayment) {
            setDebts([...debts, {
                id: Date.now().toString(),
                name: newDebt.name,
                balance: Number(newDebt.balance),
                interestRate: Number(newDebt.rate),
                minimumPayment: Number(newDebt.minPayment)
            }]);
            setNewDebt({ name: '', balance: '', rate: '', minPayment: '' });
            setShowAddForm(false);
        }
    };

    const handleRemoveDebt = (id) => {
        setDebts(debts.filter(d => d.id !== id));
    };

    // Projection Engine
    const projectionData = useMemo(() => {
        if (!debts || debts.length === 0) return { data: [], totalInterest: 0, monthsToZero: 0 };

        // Clone debts for simulation
        let simDebts = debts.map(d => ({ ...d }));
        let currentMonth = 0;
        let totalInterestPaid = 0;
        const data = [];

        // Start state
        let totalBalance = simDebts.reduce((acc, d) => acc + d.balance, 0);

        while (totalBalance > 0 && currentMonth < 360) { // cap at 30 years
            // Sort debts based on strategy
            if (strategy === 'avalanche') {
                simDebts.sort((a, b) => b.interestRate - a.interestRate); // Highest rate first
            } else if (strategy === 'snowball') {
                simDebts.sort((a, b) => a.balance - b.balance); // Lowest balance first
            } else if (strategy === 'snowflake') {
                simDebts.sort((a, b) => b.balance - a.balance); // Highest balance first
            } else if (strategy === 'blizzard') {
                simDebts.sort((a, b) => a.interestRate - b.interestRate); // Lowest rate first
            }

            let availableExtra = Number(extraPayment) || 0;
            let monthInterest = 0;

            // First pass: apply minimum payments and interest
            simDebts.forEach(d => {
                if (d.balance > 0) {
                    const monthlyInterest = d.balance * (d.interestRate / 100 / 12);
                    monthInterest += monthlyInterest;
                    d.balance += monthlyInterest; // add interest

                    let payment = Math.min(d.balance, d.minimumPayment);
                    d.balance -= payment;
                }
            });

            // Second pass: apply extra payments to the targeted debt
            for (let i = 0; i < simDebts.length; i++) {
                if (availableExtra <= 0) break;
                if (simDebts[i].balance > 0) {
                    let extraToApply = Math.min(simDebts[i].balance, availableExtra);
                    simDebts[i].balance -= extraToApply;
                    availableExtra -= extraToApply;
                }
            }

            totalInterestPaid += monthInterest;
            totalBalance = simDebts.reduce((acc, d) => acc + d.balance, 0);

            // Format month date for display (naive increment from today)
            const date = new Date();
            date.setMonth(date.getMonth() + currentMonth);
            const monthStr = date.toLocaleString('default', { month: 'short' }) + " '" + date.getFullYear().toString().slice(-2);

            data.push({
                monthIndex: currentMonth,
                month: monthStr,
                balance: Math.round(totalBalance)
            });

            currentMonth++;
            if (totalBalance <= 0) break;
        }

        return { data, totalInterest: totalInterestPaid, monthsToZero: currentMonth };
    }, [debts, strategy, extraPayment]);
    // ---------------------------------------

    const addFixed = (expense) => setFixedExpenses(prev => [...prev, expense]);
    const removeFixed = (id) => setFixedExpenses(prev => prev.filter(e => e.id !== id));
    const editFixed = (id, updated) => setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));

    const addVariable = (expense) => setVariableExpenses(prev => [...prev, expense]);
    const removeVariable = (id) => setVariableExpenses(prev => prev.filter(e => e.id !== id));
    const editVariable = (id, updated) => setVariableExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '0' }}>
                <img src="/expenses-header-logo.png" alt="Expenses Header Logo" style={{ height: '400px', objectFit: 'contain' }} loading="lazy" />
                <p className="page-subtitle">Track and optimize your outflows.</p>
            </div>

            <div className="expense-metrics-grid">
                <AnimateOnScroll delay={0.1}>
                    <Card glass className="metric-box warning-border">
                        <div className="metric-header">
                            <span className="metric-title">Total Monthly Expenses</span>
                            <TrendingDown size={20} className="text-danger" />
                        </div>
                        <h2 className="metric-value">
                            $<AnimatedNumber value={totalMonthlyExpenses + totalSubscriptionCost} />
                        </h2>
                        <div className="metric-breakdown">
                            <span>Fixed: ${totalFixedExpenses.toLocaleString()}</span>
                            <span>Var: ${totalVariableExpenses.toLocaleString()}</span>
                            <span>Subs: ${totalSubscriptionCost.toFixed(0)}</span>
                        </div>
                    </Card>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                    <Card glass className="metric-box success-border">
                        <div className="metric-header">
                            <span className="metric-title">Net Cash Flow</span>
                            <Wallet size={20} className="text-success" />
                        </div>
                        <h2 className={`metric-value ${(netMonthlyCashFlow - totalSubscriptionCost) >= 0 ? 'positive' : 'negative'}`}>
                            {(netMonthlyCashFlow - totalSubscriptionCost) < 0 ? '-' : ''}$<AnimatedNumber value={Math.abs(netMonthlyCashFlow - totalSubscriptionCost)} />
                        </h2>
                        <p className="metric-subtext">Remaining for allocation</p>
                    </Card>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                    <Card glass className="metric-box highlight-border">
                        <div className="metric-header">
                            <span className="metric-title">Savings Rate</span>
                            <Percent size={20} className="text-primary" />
                        </div>
                        <h2 className="metric-value">
                            <AnimatedNumber value={parseFloat(savingsRate)} />%
                        </h2>
                        <p className="metric-subtext">Target: {'>'}20%</p>
                    </Card>
                </AnimateOnScroll>
            </div>

            <div className="expense-content-grid">
                {/* Fixed Expenses */}
                <AnimateOnScroll delay={0.1} className="expense-column">
                    <div className="column-header" style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ margin: 0 }}>Fixed Expenses</h2>
                        <span className="badge danger-badge" style={{ marginLeft: '12px' }}>${totalFixedExpenses.toLocaleString()}</span>
                    </div>

                    <ExpenseForm
                        onAdd={addFixed}
                        title="Add Fixed Expense"
                        placeholder="e.g. Rent, Mortgage, Insurance"
                    />
                    <ExpenseList
                        expenses={fixedExpenses}
                        onRemove={removeFixed}
                        onEdit={editFixed}
                        emptyMessage="No fixed expenses added."
                    />
                </AnimateOnScroll>

                {/* Variable Expenses */}
                <AnimateOnScroll delay={0.2} className="expense-column">
                    <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Variable Expenses</h2>
                            <span className="badge warning-badge" style={{ marginLeft: '12px' }}>
                                Budget: ${totalVariableExpenses.toLocaleString()}
                            </span>
                            <span className="badge" style={{ marginLeft: '8px', background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}>
                                Spent: ${variableExpenses.reduce((sum, exp) => sum + (exp.manual_spent !== undefined ? Number(exp.manual_spent) : (Number(transactionsByCategory[exp.name]) || 0)), 0).toLocaleString()}
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsActivityModalOpen(true)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                        >
                            <Wallet size={16} /> Activity
                        </Button>
                    </div>

                    <ExpenseForm
                        onAdd={addVariable}
                        title="Add Variable Expense"
                        placeholder="e.g. Groceries, Dining, Entertainment"
                    />
                    <ExpenseList
                        expenses={variableExpenses}
                        onRemove={removeVariable}
                        onEdit={editVariable}
                        emptyMessage="No variable expenses added."
                        showTracking={true}
                        transactionsByCategory={transactionsByCategory}
                    />
                </AnimateOnScroll>
            </div>

            {/* Subscriptions Section */}
            <AnimateOnScroll yOffset={40} delay={0.1}>
                <Card glass style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ margin: 0 }}>Subscriptions</h2>
                            <span className="badge danger-badge">${totalSubscriptionCost.toFixed(2)}/mo</span>
                        </div>
                        <Button size="sm" onClick={() => setShowAddSub(!showAddSub)}>
                            {showAddSub ? 'Cancel' : <><Plus size={16} /> Custom</>}
                        </Button>
                    </div>

                    {showAddSub && (
                        <form onSubmit={addCustomSubscription} style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '12px', background: 'var(--surface-hover)', borderRadius: '12px', alignItems: 'center' }}>
                            <Input placeholder="Service Name" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} required style={{ flex: 1 }} />
                            <Input type="number" placeholder="$/mo" value={newSub.cost} onChange={e => setNewSub({ ...newSub, cost: e.target.value })} required style={{ width: '100px' }} />
                            <Input placeholder="domain.com (optional)" value={newSub.domain} onChange={e => setNewSub({ ...newSub, domain: e.target.value })} style={{ flex: 1 }} />
                            <Button type="submit" variant="primary" size="sm">Add</Button>
                        </form>
                    )}

                    {/* Common Subscriptions Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginBottom: activeSubscriptions.length > 0 ? '24px' : '0' }}>
                        {COMMON_SUBSCRIPTIONS.filter(s => !activeSubscriptions.find(a => a.id === s.id)).map(sub => (
                            <div
                                key={sub.id}
                                onClick={() => toggleSubscription(sub)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '16px 8px', borderRadius: '12px', cursor: 'pointer',
                                    border: '1px dashed var(--surface-border)', background: 'transparent',
                                    transition: 'all 0.2s ease', opacity: 0.5
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                            >
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${sub.domain}&sz=128`}
                                    alt={sub.name}
                                    style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', marginBottom: '8px', background: 'white', padding: '2px' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{sub.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>${sub.cost}</span>
                            </div>
                        ))}
                    </div>

                    {/* Active Subscriptions */}
                    {activeSubscriptions.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>Active Subscriptions</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                                {activeSubscriptions.map(sub => (
                                    <div
                                        key={sub.id}
                                        onDoubleClick={() => startEditingSub(sub)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px 8px', borderRadius: '12px', position: 'relative',
                                            border: '1px solid var(--primary)', background: 'rgba(79, 70, 229, 0.05)',
                                            cursor: editingSubId === sub.id ? 'default' : 'pointer',
                                        }}
                                    >
                                        <button
                                            onClick={() => removeSubscription(sub.id)}
                                            style={{ position: 'absolute', top: '4px', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '0.7rem' }}
                                            title="Remove"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${sub.domain}&sz=128`}
                                            alt={sub.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', marginBottom: '8px', background: 'white', padding: '2px' }}
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                        {editingSubId === sub.id ? (
                                            <>
                                                <input
                                                    autoFocus
                                                    value={editSubName}
                                                    onChange={e => setEditSubName(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveSubEdit(sub.id); if (e.key === 'Escape') setEditingSubId(null); }}
                                                    style={{ width: '90%', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', background: 'var(--surface-hover)', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--text-primary)', padding: '4px', outline: 'none' }}
                                                />
                                                <input
                                                    type="number"
                                                    value={editSubCost}
                                                    onChange={e => setEditSubCost(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveSubEdit(sub.id); if (e.key === 'Escape') setEditingSubId(null); }}
                                                    onBlur={() => saveSubEdit(sub.id)}
                                                    style={{ width: '70px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', background: 'var(--surface-hover)', border: '1px solid var(--primary)', borderRadius: '6px', color: 'var(--danger)', padding: '4px', outline: 'none', marginTop: '4px' }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{sub.name}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700, marginTop: '4px' }}>${sub.cost.toFixed(2)}</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </AnimateOnScroll>

            {/* Debt Destroyer Summary Section */}
            <div className="expense-content-grid" style={{ marginTop: '40px' }}>
                {/* Your Debts (Editable) */}
                <AnimateOnScroll delay={0.1} style={{ height: '100%' }}>
                    <Card glass className="debt-card" style={{ height: '100%' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <Flame size={20} className="text-danger" /> Your Debts
                            </h2>
                            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                                {showAddForm ? 'Cancel' : <><Plus size={16} /> Add Debt</>}
                            </Button>
                        </div>

                        {showAddForm && (
                            <form className="debt-form animate-fade-in" onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                                <Input
                                    placeholder="Debt Name (e.g. Visa Card)"
                                    value={newDebt.name}
                                    onChange={e => setNewDebt({ ...newDebt, name: e.target.value })}
                                    required
                                />
                                <div className="debt-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <Input
                                        type="number"
                                        placeholder="Balance ($)"
                                        value={newDebt.balance}
                                        onChange={e => setNewDebt({ ...newDebt, balance: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Rate (%)"
                                        value={newDebt.rate}
                                        onChange={e => setNewDebt({ ...newDebt, rate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Min ($)"
                                        value={newDebt.minPayment}
                                        onChange={e => setNewDebt({ ...newDebt, minPayment: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary">Save Debt</Button>
                            </form>
                        )}

                        <div className="debts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {debts.length === 0 ? (
                                <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No debts added yet.</p>
                            ) : (
                                debts.map(debt => (
                                    <div key={debt.id} className="debt-item glass stream-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                                        <div className="debt-info">
                                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{debt.name}</h3>
                                            <div className="debt-stats" style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                <span>Bal: ${debt.balance.toLocaleString()}</span>
                                                <span style={{ color: 'var(--surface-border)' }}>|</span>
                                                <span>Rate: {debt.interestRate}%</span>
                                                <span style={{ color: 'var(--surface-border)' }}>|</span>
                                                <span>Min: ${debt.minimumPayment}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveDebt(debt.id)} className="btn-icon danger">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </AnimateOnScroll>

                {/* Attack Strategy */}
                <AnimateOnScroll delay={0.2} style={{ height: '100%' }}>
                    <Card glass className="strategy-card" style={{ display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', height: '100%' }}>
                        <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Attack Strategy</h3>
                        <div className="strategy-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                            <button
                                style={{ padding: '16px', borderRadius: '12px', border: strategy === 'avalanche' ? '1px solid var(--primary)' : '1px solid var(--surface-border)', background: strategy === 'avalanche' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => setStrategy('avalanche')}
                            >
                                <TrendingDown size={18} style={{ color: strategy === 'avalanche' ? 'var(--primary)' : 'var(--text-primary)' }} />
                                <div style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Avalanche</strong>
                                    <span style={{ fontSize: '0.8rem' }}>Highest Interest</span>
                                </div>
                            </button>
                            <button
                                style={{ padding: '16px', borderRadius: '12px', border: strategy === 'snowball' ? '1px solid var(--danger)' : '1px solid var(--surface-border)', background: strategy === 'snowball' ? 'rgba(255, 69, 58, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => setStrategy('snowball')}
                            >
                                <Flame size={18} style={{ color: strategy === 'snowball' ? 'var(--danger)' : 'var(--text-primary)' }} />
                                <div style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Snowball</strong>
                                    <span style={{ fontSize: '0.8rem' }}>Lowest Balance</span>
                                </div>
                            </button>
                            <button
                                style={{ padding: '16px', borderRadius: '12px', border: strategy === 'snowflake' ? '1px solid #0ea5e9' : '1px solid var(--surface-border)', background: strategy === 'snowflake' ? 'rgba(14, 165, 233, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => setStrategy('snowflake')}
                            >
                                <CloudRain size={18} style={{ color: strategy === 'snowflake' ? '#0ea5e9' : 'var(--text-primary)' }} />
                                <div style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Snowflake</strong>
                                    <span style={{ fontSize: '0.8rem' }}>Highest Balance</span>
                                </div>
                            </button>
                            <button
                                style={{ padding: '16px', borderRadius: '12px', border: strategy === 'blizzard' ? '1px solid #8b5cf6' : '1px solid var(--surface-border)', background: strategy === 'blizzard' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => setStrategy('blizzard')}
                            >
                                <Wind size={18} style={{ color: strategy === 'blizzard' ? '#8b5cf6' : 'var(--text-primary)' }} />
                                <div style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Blizzard</strong>
                                    <span style={{ fontSize: '0.8rem' }}>Lowest Interest</span>
                                </div>
                            </button>
                        </div>

                        <div className="extra-payment-control" style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <label style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Extra Monthly Payment</label>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    ${Number(extraPayment).toLocaleString()}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="50"
                                value={extraPayment}
                                onChange={e => setExtraPayment(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--danger)' }}
                            />
                        </div>
                    </Card>
                </AnimateOnScroll>
            </div>

            <div className="debt-visuals" style={{ marginTop: '32px' }}>
                <AnimateOnScroll yOffset={50} delay={0.1}>
                    <Card glass className="burn-down-card">
                        {debts.length > 0 ? (
                            <>
                                <div className="burn-down-header">
                                    <div className="target-metric">
                                        <span className="label">Debt Free In</span>
                                        <div className="value glowing-danger">
                                            {projectionData.monthsToZero === 360 ? '> 30 Years' : `${Math.floor(projectionData.monthsToZero / 12)}y ${projectionData.monthsToZero % 12}m`}
                                        </div>
                                    </div>
                                    <div className="target-metric">
                                        <span className="label">Total Interest Paid</span>
                                        <div className="value text-warning">
                                            $<AnimatedNumber value={projectionData.totalInterest} />
                                        </div>
                                    </div>
                                </div>

                                <div className="burn-down-chart-wrapper" style={{ height: '400px', width: '100%', marginTop: '32px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectionData.data} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                            <YAxis stroke="var(--text-secondary)" tickFormatter={val => `$${val}`} />
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--danger)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', borderRadius: '8px', boxShadow: '0 0 20px var(--danger-glow)' }}
                                                itemStyle={{ color: 'var(--danger)', fontWeight: 'bold' }}
                                                formatter={(value) => `$${value.toLocaleString()}`}
                                            />
                                            <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="var(--danger)" fillOpacity={1} fill="url(#colorDebt)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state" style={{ height: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <h3>No active debts</h3>
                                <p>Add your loans or credit cards to see your burn-down projection.</p>
                            </div>
                        )}
                    </Card>
                </AnimateOnScroll>
            </div>

            <Modal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wallet size={20} className="text-primary" /> Recent Bank Activity
                    </div>
                }
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '60%', margin: 0 }}>
                        These transactions were automatically securely synced from your connected Plaid bank accounts.
                        The Rules Engine uses their categories to automatically deduct from your Variable Expense budgets.
                    </p>
                    <div className="total-amount-box" style={{ background: 'var(--surface-hover)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--surface-border)', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Total ({activityCategoryFilter})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: filteredTotalAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {filteredTotalAmount > 0 ? '-' : ''}${Math.abs(filteredTotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="category-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                    {uniqueCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActivityCategoryFilter(cat); setActivityPage(1); }}
                            className={`badge ${activityCategoryFilter === cat ? 'primary-badge' : ''}`}
                            style={{
                                cursor: 'pointer',
                                border: activityCategoryFilter === cat ? 'none' : '1px solid var(--surface-border)',
                                background: activityCategoryFilter === cat ? 'var(--primary)' : 'transparent',
                                color: activityCategoryFilter === cat ? 'black' : 'var(--text-secondary)',
                                padding: '6px 16px',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(!filteredTransactions || filteredTransactions.length === 0) ? (
                        <div className="empty-state text-muted" style={{ textAlign: 'center', padding: '32px' }}>
                            No recent bank transactions found. Have you connected a bank?
                        </div>
                    ) : (
                        paginatedTransactions.map((tx) => (
                            <div key={tx.id} className="stream-item glass" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '16px', gap: '16px' }}>
                                <div className="tx-merchant" style={{ fontWeight: 600 }}>
                                    {tx.merchant_name || 'Unknown Merchant'}
                                    {tx.pending && <span className="badge warning-badge" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Pending</span>}
                                </div>
                                <div className="tx-date text-muted" style={{ fontSize: '0.85rem' }}>
                                    {new Date(tx.date).toLocaleDateString()}
                                </div>
                                <div className="tx-category">
                                    <span className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                                        {tx.category || 'Uncategorized'}
                                    </span>
                                </div>
                                <div className={`tx-amount ${tx.amount > 0 ? 'text-danger' : 'text-success'}`} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {tx.amount > 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {activityTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                        <Button size="sm" variant="secondary" onClick={() => setActivityPage(p => Math.max(p - 1, 1))} disabled={activityPage === 1}>Previous</Button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {activityPage} of {activityTotalPages}</span>
                        <Button size="sm" variant="secondary" onClick={() => setActivityPage(p => Math.min(p + 1, activityTotalPages))} disabled={activityPage === activityTotalPages}>Next</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Expenses;
