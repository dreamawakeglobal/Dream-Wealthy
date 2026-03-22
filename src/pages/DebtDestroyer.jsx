import React, { useState, useMemo } from 'react';
import { Flame, TrendingDown, Plus, Trash2, Edit2, X, AlertTriangle, Wind, CloudRain } from 'lucide-react';
import { useFinancialContext } from '../FinancialContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import './DebtDestroyer.css';

const DebtDestroyer = () => {
    const { debts, setDebts } = useFinancialContext();
    const [strategy, setStrategy] = useState('avalanche'); // avalanche | snowball
    const [extraPayment, setExtraPayment] = useState(0);

    // Debt Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDebt, setNewDebt] = useState({ name: '', balance: '', rate: '', minPayment: '' });

    const handleAddDebt = (e) => {
        e.preventDefault();
        if (newDebt.name && newDebt.balance && newDebt.rate && newDebt.minPayment) {
            setDebts([...debts, {
                id: crypto.randomUUID(),
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

                    // If minimum payment is less than interest, add an alert later, for now just process it
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


    return (
        <div className="page-container animate-fade-in debt-destroyer-page">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '0' }}>
                <img src="/debt-destroyer-logo.png" alt="Debt Destroyer Logo" style={{ height: '500px', objectFit: 'contain', marginBottom: '0' }} loading="lazy" />
                <p className="page-subtitle" style={{ marginBottom: '0' }}>Crush your liabilities with algorithmic precision.</p>
            </div>

            <div className="debt-dashboard">
                <div className="debt-controls">
                    <Card glass className="debt-card">
                        <div className="card-header">
                            <h2>Your Debts</h2>
                            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                                {showAddForm ? 'Cancel' : <><Plus size={16} /> Add Debt</>}
                            </Button>
                        </div>

                        {showAddForm && (
                            <form className="debt-form animate-fade-in" onSubmit={handleAddDebt}>
                                <Input
                                    placeholder="Debt Name (e.g. Visa Card)"
                                    value={newDebt.name}
                                    onChange={e => setNewDebt({ ...newDebt, name: e.target.value })}
                                    required
                                />
                                <div className="debt-form-row">
                                    <Input
                                        type="number" step="0.01"
                                        placeholder="Balance ($)"
                                        value={newDebt.balance}
                                        onChange={e => setNewDebt({ ...newDebt, balance: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Interest Rate (%)"
                                        value={newDebt.rate}
                                        onChange={e => setNewDebt({ ...newDebt, rate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="number" step="0.01"
                                        placeholder="Min Payment ($)"
                                        value={newDebt.minPayment}
                                        onChange={e => setNewDebt({ ...newDebt, minPayment: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary">Save Debt</Button>
                            </form>
                        )}

                        <div className="debts-list">
                            {debts.length === 0 ? (
                                <p className="text-muted">No debts added yet. Congratulations?</p>
                            ) : (
                                debts.map(debt => (
                                    <div key={debt.id} className="debt-item glass">
                                        <div className="debt-info">
                                            <h3>{debt.name}</h3>
                                            <div className="debt-stats">
                                                <span><span className="text-secondary">Balance:</span> ${debt.balance.toLocaleString()}</span>
                                                <span className="divider">|</span>
                                                <span><span className="text-secondary">Rate:</span> {debt.interestRate}%</span>
                                                <span className="divider">|</span>
                                                <span><span className="text-secondary">Min:</span> ${debt.minimumPayment}</span>
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

                    <Card glass className="strategy-card" style={{ color: 'black' }}>
                        <h3 style={{ color: 'black' }}>Attack Strategy</h3>
                        <div className="strategy-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                className={`strategy-btn ${strategy === 'avalanche' ? 'active' : ''}`}
                                onClick={() => setStrategy('avalanche')}
                                style={strategy === 'avalanche' ? { border: '1px solid var(--primary)', background: 'rgba(79, 70, 229, 0.1)', color: 'black' } : { color: 'black' }}
                            >
                                <TrendingDown size={18} style={{ color: strategy === 'avalanche' ? 'var(--primary)' : 'black' }} />
                                <div style={{ color: 'black' }}>
                                    <strong>Avalanche</strong>
                                    <span>Highest Interest First</span>
                                </div>
                            </button>
                            <button
                                className={`strategy-btn ${strategy === 'snowball' ? 'active' : ''}`}
                                onClick={() => setStrategy('snowball')}
                                style={strategy === 'snowball' ? { border: '1px solid var(--danger)', background: 'rgba(255, 69, 58, 0.1)', color: 'black' } : { color: 'black' }}
                            >
                                <Flame size={18} style={{ color: strategy === 'snowball' ? 'var(--danger)' : 'black' }} />
                                <div style={{ color: 'black' }}>
                                    <strong>Snowball</strong>
                                    <span>Lowest Balance First</span>
                                </div>
                            </button>
                            <button
                                className={`strategy-btn ${strategy === 'snowflake' ? 'active' : ''}`}
                                onClick={() => setStrategy('snowflake')}
                                style={strategy === 'snowflake' ? { border: '1px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.1)', color: 'black' } : { color: 'black' }}
                            >
                                <CloudRain size={18} style={{ color: strategy === 'snowflake' ? '#0ea5e9' : 'black' }} />
                                <div style={{ color: 'black' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Snowflake</strong>
                                    <span>Highest Balance First</span>
                                </div>
                            </button>
                            <button
                                className={`strategy-btn ${strategy === 'blizzard' ? 'active' : ''}`}
                                onClick={() => setStrategy('blizzard')}
                                style={strategy === 'blizzard' ? { border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', color: 'black' } : { color: 'black' }}
                            >
                                <Wind size={18} style={{ color: strategy === 'blizzard' ? '#8b5cf6' : 'black' }} />
                                <div style={{ color: 'black' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Blizzard</strong>
                                    <span>Lowest Interest First</span>
                                </div>
                            </button>
                        </div>

                        <div className="extra-payment-control" style={{ marginTop: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <label style={{ color: 'black', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>Extra Monthly Payment</label>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'black' }}>
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
                                className="dream-slider danger-slider"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </Card>
                </div>

                <div className="debt-visuals">
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
                            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <h3>No active debts</h3>
                                <p>Add your loans or credit cards to see your burn-down projection.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DebtDestroyer;
