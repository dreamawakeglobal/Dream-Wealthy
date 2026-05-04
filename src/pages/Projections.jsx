import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Settings, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useFinancialContext } from '../FinancialContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import './Projections.css';

// Component for editable table cells
const EditableCell = ({ value, onSave, isCurrency = true, sign = '' }) => {
    const { theme, expenseBorderColor } = useTheme();
    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : 'var(--accent-primary)';

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    // Update local state if external value changes (like reverting)
    React.useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        onSave(editValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleBlur();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(value);
        }
    };

    if (isEditing) {
        return (
            <CurrencyInput
                raw
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="editable-cell-input"
                style={{ 
                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    border: '2px solid',
                    borderColor: activeColor,
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    transition: 'border-color 0.2s',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="editable-cell-display"
            title="Click to edit value"
        >
            {isCurrency ? `${sign}$${Number(editValue).toLocaleString()}` : `${sign}${Number(editValue).toLocaleString()}`}
        </div>
    );
};

const Projections = () => {
    const {
        totalMonthlyIncome, totalMonthlyExpenses,
        incomeGrowthRate, setIncomeGrowthRate,
        expenseInflationRate, setExpenseInflationRate,
        startingSavings, setStartingSavings,
        extraColumns, setExtraColumns,
        setCellOverrides,
        getProjectionData
    } = useFinancialContext();
    const { expenseBorderColor, theme } = useTheme();
    const { playPop } = useSound();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7',
        white: '#ffffff',
        black: '#000000',
        red: '#F43F5E',
        green: '#10B981',
        purple: '#818CF8',
        pink: '#ec4899',
        yellow: '#eab308',
        orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#818CF8' : '#4FA3F7') : (theme === 'dark' ? '#818CF8' : '#4FA3F7');

    const [localIncome, setLocalIncome] = useState(totalMonthlyIncome);
    const [localExpenses, setLocalExpenses] = useState(totalMonthlyExpenses);
    const [editingFlowId, setEditingFlowId] = useState(null); // Added flow edit state
    const [projectionYears, setProjectionYears] = useState(1); // Added projection span
    const [currentPage, setCurrentPage] = useState(0); // For 12-month pagination
    const [showEngineModal, setShowEngineModal] = useState(false); // Modal toggle

    const handleCellEdit = (monthIndex, column, value) => {
        setCellOverrides(prev => ({
            ...prev,
            [monthIndex]: {
                ...(prev[monthIndex] || {}),
                [column]: value === '' ? undefined : Number(value)
            }
        }));
    };
    const projectionData = useMemo(() => {
        // The old internal logic always started at index 0 (January) and the current year.
        return getProjectionData(projectionYears * 12, 0);
    }, [getProjectionData, projectionYears]);

    // Handle pagination (12 months per page)
    const paginatedData = useMemo(() => {
        const startIdx = currentPage * 12;
        return projectionData.slice(startIdx, startIdx + 12);
    }, [projectionData, currentPage]);

    // Calculate totals for the currently viewed page
    const pageTotals = useMemo(() => {
        return paginatedData.reduce((acc, row) => {
            acc.Income += row.Income || 0;
            acc.ActualIncome += row.ActualIncome || 0;
            acc.Expenses += row.Expenses || 0;
            acc.ActualExpenses += row.ActualExpenses || 0;
            acc.Net += row.Net || 0;
            extraColumns.forEach(c => {
                acc[c.name] = (acc[c.name] || 0) + (row[c.name] || 0);
            });
            return acc;
        }, { Income: 0, ActualIncome: 0, Expenses: 0, ActualExpenses: 0, Net: 0 });
    }, [paginatedData, extraColumns]);

    const finalTotal = projectionData[projectionData.length - 1]?.Cumulative || 0;

    // Component for editable table cells moved outside

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '0' }}>
                <img src="/projections-header-logo.png" alt="Projections Header Logo" className="page-header-logo" style={{ height: '400px', objectFit: 'contain' }} loading="lazy" />
                <p className="page-subtitle">Map your journey to wealth.</p>
            </div>

            <Modal
                isOpen={showEngineModal}
                onClose={() => setShowEngineModal(false)}
                silent={true}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                containerStyle={{ maxWidth: '450px', borderRadius: '24px' }}
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <Settings size={20} color={expenseBorderColor === 'none' && theme === 'dark' ? '#ffffff' : activeColor} /> 
                        Projection <span style={{ color: expenseBorderColor === 'none' && theme === 'dark' ? '#ffffff' : activeColor }}>Engine</span>
                    </div>
                )}
            >
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>

                            <div className="controls-group">
                                <label>Starting Savings (Cumulative)</label>
                                <CurrencyInput
                                    value={startingSavings}
                                    onChange={e => setStartingSavings(Number(e.target.value))}
                                    placeholder="e.g. 5000"
                                />
                            </div>

                            <div className="controls-group">
                                <label>Starting Monthly Income</label>
                                <CurrencyInput
                                    value={localIncome}
                                    onChange={e => setLocalIncome(Number(e.target.value))}
                                />
                            </div>

                            <div className="controls-group">
                                <label>Starting Monthly Expenses</label>
                                <CurrencyInput
                                    value={localExpenses}
                                    onChange={e => setLocalExpenses(Number(e.target.value))}
                                />
                            </div>

                            <div className="controls-divider" />

                            <div className="controls-header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ margin: 0, fontSize: '0.9rem', color: theme === 'dark' ? '#ffffff' : '#000000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Extra Monthly Flows</label>
                                <button className="add-tab-btn" onClick={() => {
                                    setExtraColumns([...extraColumns, { id: crypto.randomUUID(), name: 'New Flow', amount: 0 }]);
                                }} style={{ padding: '4px 8px', fontSize: '0.8rem' }}><Plus size={14} /> Add</button>
                            </div>

                            {extraColumns.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {extraColumns.map(col => (
                                        editingFlowId === col.id ? (
                                            <div key={`edit-${col.id}`} style={{ display: 'flex', gap: '4px', background: 'var(--surface-hover)', padding: '6px', borderRadius: '20px', border: '1px solid var(--accent-primary)', alignItems: 'center' }}>
                                                <input
                                                    autoFocus
                                                    value={col.name}
                                                    onChange={e => setExtraColumns(extraColumns.map(c => c.id === col.id ? { ...c, name: e.target.value } : c))}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '80px', fontSize: '0.85rem', paddingLeft: '8px' }}
                                                    placeholder="Name"
                                                />
                                                <span style={{ color: 'var(--text-muted)' }}>|</span>
                                                <CurrencyInput
                                                    value={col.amount}
                                                    onChange={e => setExtraColumns(extraColumns.map(c => c.id === col.id ? { ...c, amount: Number(e.target.value) } : c))}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '80px', fontSize: '0.85rem' }}
                                                    placeholder="Amount"
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingFlowId(null)}
                                                />
                                                <button
                                                    onClick={() => setEditingFlowId(null)}
                                                    style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '4px' }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div key={col.id} className="flow-bubble animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--surface-border)', fontSize: '0.85rem', color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                                                <span style={{ fontWeight: 'bold' }}>{col.name}: <span className={col.amount >= 0 ? 'text-success' : 'text-danger'}>${Math.abs(col.amount).toLocaleString()}</span></span>
                                                <button
                                                    onClick={() => setEditingFlowId(col.id)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', marginLeft: '4px' }}
                                                    title="Edit Flow"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => setExtraColumns(extraColumns.filter(c => c.id !== col.id))}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                                    title="Remove Flow"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}



                            <div className="controls-divider" />

                            <div className="controls-group">
                                <label>Projection Timeline</label>
                                <Card glass style={{ display: 'flex', marginTop: '8px', padding: '4px', borderRadius: '12px', gap: '4px', flexWrap: 'wrap' }}>
                                    {[1, 2, 3, 4, 5].map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                setProjectionYears(year);
                                                setCurrentPage(0);
                                            }}
                                            style={{
                                                flex: 1,
                                                minWidth: '70px',
                                                padding: '8px 12px',
                                                fontSize: '0.9rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontWeight: 600,
                                                background: projectionYears === year ? activeColor : 'transparent',
                                                color: projectionYears === year ? '#fff' : (theme === 'dark' ? '#ffffff' : '#000000'),
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {year} {year === 1 ? 'Year' : 'Years'}
                                        </button>
                                    ))}
                                </Card>
                            </div>
                </div>
            </Modal>

            <div className="projection-dashboard">
                {/* Charts and Tables */}
                <div className="projection-visuals">
                    <AnimateOnScroll delay={0.1}>
                        <Card glass className={`chart-container ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <h3 style={{ textAlign: 'center' }}>Net Wealth Curve ({projectionYears * 12} Months)</h3>
                            <div className="area-chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeColor} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={activeColor} stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="month" 
                                            stroke={theme === 'dark' ? '#F8FAFC' : '#1E293B'} 
                                            tick={{ fontWeight: 'bold', fill: theme === 'dark' ? '#F8FAFC' : '#1E293B' }} 
                                            tickFormatter={(val) => typeof val === 'string' ? (val.split(" ").length === 2 ? `${val.split(" ")[0].substring(0, 3)} ${val.split(" ")[1]}` : val.substring(0, 3)) : val} 
                                        />
                                        <YAxis 
                                            stroke={theme === 'dark' ? '#F8FAFC' : '#1E293B'} 
                                            tick={{ fontWeight: 'bold', fill: theme === 'dark' ? '#F8FAFC' : '#1E293B' }} 
                                            tickFormatter={(val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val)} 
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => `$${value.toLocaleString()}`}
                                        />
                                        <Area type="monotone" dataKey="Cumulative" stroke={activeColor} fillOpacity={1} fill="url(#colorCumulative)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </AnimateOnScroll>

                    <AnimateOnScroll delay={0.2} yOffset={40}>
                        <Card glass className={`table-container ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '16px' }}>
                                <div />
                                <h3 style={{ margin: 0, textAlign: 'center' }}>Month-by-Month Breakdown</h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                                    <Button 
                                        onClick={() => { playPop(); setShowEngineModal(true); }} 
                                        variant="primary" 
                                        className="configure-projections-btn"
                                        style={{ 
                                            padding: '8px 16px', fontSize: '0.9rem',
                                            ...(activeColor ? { background: activeColor, borderColor: activeColor, color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' } : {})
                                        }}
                                    >
                                        <Settings size={16} style={{ marginRight: '6px' }} /> Configure Projections
                                    </Button>
                                    {projectionData.length > 12 && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            style={{ height: '32px', padding: '6px 14px' }}
                                            className={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                                        >
                                            Previous Year
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(projectionData.length / 12) - 1, prev + 1))}
                                            disabled={currentPage >= Math.ceil(projectionData.length / 12) - 1}
                                            style={{ height: '32px', padding: '6px 14px' }}
                                            className={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                                        >
                                            Next Year
                                        </Button>
                                    </div>
                                )}
                                </div>
                            </div>
                            <div className="table-wrapper">
                                <table className="projection-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Income</th>
                                            <th>Expenses</th>
                                            {extraColumns.map(c => <th key={c.id}>{c.name}</th>)}
                                            <th>Net</th>
                                            <th>Cumulative</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((row) => (
                                            <tr key={row.monthIndex}>
                                                <td>{row.month}</td>
                                                <td style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <EditableCell
                                                            value={row.Income}
                                                            sign="+"
                                                            onSave={(val) => handleCellEdit(row.monthIndex, 'Income', val)}
                                                        />
                                                        <span style={{ fontSize: '0.71rem', color: theme === 'dark' ? activeColor : 'var(--text-secondary)', textShadow: theme === 'dark' ? `0 0 8px ${activeColor}` : 'none' }}>Actual: +${(row.ActualIncome || 0).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <EditableCell
                                                            value={row.Expenses}
                                                            sign="-"
                                                            onSave={(val) => handleCellEdit(row.monthIndex, 'Expenses', val)}
                                                        />
                                                        <span style={{ fontSize: '0.71rem', color: theme === 'dark' ? activeColor : 'var(--text-secondary)', textShadow: theme === 'dark' ? `0 0 8px ${activeColor}` : 'none' }}>Actual: -${(row.ActualExpenses || 0).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                {extraColumns.map(c => (
                                                    <td key={c.id} style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                                                        <EditableCell
                                                            value={row[c.name] || 0}
                                                            sign="-"
                                                            onSave={(val) => handleCellEdit(row.monthIndex, c.name, val)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className={row.Net >= 0 ? 'text-success' : 'text-danger'}>
                                                    {row.Net >= 0 ? '+' : '-'}${Math.abs(row.Net).toLocaleString()}
                                                </td>
                                                <td className="font-semibold">${row.Cumulative.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>Year {currentPage + 1} Total</td>
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <span>+${pageTotals.Income.toLocaleString()}</span>
                                                    <span style={{ fontSize: '0.71rem', color: theme === 'dark' ? activeColor : 'var(--text-secondary)', textShadow: theme === 'dark' ? `0 0 8px ${activeColor}` : 'none' }}>Actual: +${pageTotals.ActualIncome.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <span>-${pageTotals.Expenses.toLocaleString()}</span>
                                                    <span style={{ fontSize: '0.71rem', color: theme === 'dark' ? activeColor : 'var(--text-secondary)', textShadow: theme === 'dark' ? `0 0 8px ${activeColor}` : 'none' }}>Actual: -${pageTotals.ActualExpenses.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            {extraColumns.map(c => (
                                                <td key={`total-${c.id}`} style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>
                                                    -${(pageTotals[c.name] || 0).toLocaleString()}
                                                </td>
                                            ))}
                                            <td style={{ borderTop: '2px solid var(--surface-border)' }} className={pageTotals.Net >= 0 ? 'text-success' : 'text-danger'}>
                                                {pageTotals.Net >= 0 ? '+' : '-'}${Math.abs(pageTotals.Net).toLocaleString()}
                                            </td>
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-muted)', fontStyle: 'italic' }}>-</td>
                                        </tr>
                                        {/* Grand Total Savings Row */}
                                        <tr style={{ fontWeight: 'bold' }}>
                                            <td colSpan={4 + extraColumns.length} style={{ borderTop: '2px solid transparent', textAlign: 'right', color: 'var(--text-primary)', paddingRight: '24px', fontSize: '1.2rem', paddingTop: '24px' }}>
                                                Total {projectionYears} Year Savings:
                                            </td>
                                            <td style={{ borderTop: '2px solid transparent', color: 'var(--success)', fontSize: '1.5rem', paddingTop: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    $<AnimatedNumber value={finalTotal} /> <TrendingUp size={24} className="text-success" />
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </AnimateOnScroll>
                </div>
            </div>
        </div>
    );
};

export default Projections;
