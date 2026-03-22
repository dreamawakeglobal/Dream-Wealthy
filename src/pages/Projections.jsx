import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Settings, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useFinancialContext } from '../FinancialContext';
import { useTheme } from '../contexts/ThemeContext';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import './Projections.css';

// Component for editable table cells
const EditableCell = ({ value, onSave, isCurrency = true, sign = '' }) => {
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
            <input
                autoFocus
                type="number" step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                    width: '80px',
                    padding: '4px',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    borderRadius: '4px'
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer', padding: '4px', borderBottom: '1px dashed transparent', display: 'inline-block' }}
            title="Click to edit value"
            onMouseEnter={(e) => e.currentTarget.style.borderBottom = '1px dashed var(--text-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px dashed transparent'}
        >
            {isCurrency ? `${sign}$${Number(value).toLocaleString()}` : `${sign}${value.toLocaleString()}`}
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

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#007aff', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#9d4edd' : '#4FA3F7') : undefined;

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
            acc.Expenses += row.Expenses || 0;
            acc.Net += row.Net || 0;
            extraColumns.forEach(c => {
                acc[c.name] = (acc[c.name] || 0) + (row[c.name] || 0);
            });
            return acc;
        }, { Income: 0, Expenses: 0, Net: 0 });
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
                useNeonGlow={true}
                transparentOverlay={true}
                lessTransparent={true}
                customClass={`dark-mode-black-text ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}
                containerStyle={{ maxWidth: '450px', borderRadius: '24px' }}
                title={(() => {
                    const activeColor = {
                        blue: '#007aff', white: '#ffffff', black: '#000000',
                        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
                        yellow: '#eab308', orange: '#f97316'
                    }[expenseBorderColor] || (theme === 'dark' ? '#9d4edd' : '#4FA3F7');
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            <Settings size={20} color={activeColor} /> Projection <span style={{ color: activeColor }}>Engine</span>
                        </div>
                    );
                })()}
            >
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>

                            <div className="controls-group">
                                <label>Starting Savings (Cumulative)</label>
                                <Input
                                    type="number" step="0.01"
                                    value={startingSavings}
                                    onChange={e => setStartingSavings(Number(e.target.value))}
                                    placeholder="e.g. 5000"
                                />
                            </div>

                            <div className="controls-group">
                                <label>Starting Monthly Income</label>
                                <Input
                                    type="number" step="0.01"
                                    value={localIncome}
                                    onChange={e => setLocalIncome(Number(e.target.value))}
                                />
                            </div>

                            <div className="controls-group">
                                <label>Starting Monthly Expenses</label>
                                <Input
                                    type="number" step="0.01"
                                    value={localExpenses}
                                    onChange={e => setLocalExpenses(Number(e.target.value))}
                                />
                            </div>

                            <div className="controls-divider" />

                            <div className="controls-header" style={{ justifyContent: 'space-between', display: 'flex', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Extra Monthly Flows</label>
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
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>$</span>
                                                <input
                                                    type="number" step="0.01"
                                                    value={col.amount}
                                                    onChange={e => setExtraColumns(extraColumns.map(c => c.id === col.id ? { ...c, amount: Number(e.target.value) } : c))}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '60px', fontSize: '0.85rem' }}
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
                                            <div key={col.id} className="flow-bubble animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--surface-border)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                <span>{col.name}: <span className={col.amount >= 0 ? 'text-success' : 'text-danger'}>${Math.abs(col.amount).toLocaleString()}</span></span>
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
                                <label>Annual Income Growth (%)</label>
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="0" max="20" step="0.5"
                                        value={incomeGrowthRate}
                                        onChange={e => setIncomeGrowthRate(Number(e.target.value))}
                                        className="dream-slider"
                                    />
                                    <span className="slider-value">{incomeGrowthRate}%</span>
                                </div>
                            </div>

                            <div className="controls-group">
                                <label>Annual Expense Inflation (%)</label>
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="0" max="15" step="0.5"
                                        value={expenseInflationRate}
                                        onChange={e => setExpenseInflationRate(Number(e.target.value))}
                                        className="dream-slider danger-slider"
                                    />
                                    <span className="slider-value">{expenseInflationRate}%</span>
                                </div>
                            </div>

                            <div className="controls-divider" />

                            <div className="controls-group">
                                <label>Projection Timeline</label>
                                <Card glass style={{ display: 'flex', marginTop: '8px', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                    <button
                                        onClick={() => setProjectionYears(1)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            fontSize: '0.9rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontWeight: 600,
                                            background: projectionYears === 1 ? 'var(--accent-primary)' : 'transparent',
                                            color: projectionYears === 1 ? '#fff' : 'var(--text-secondary)',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        1 Year
                                    </button>
                                    <button
                                        onClick={() => setProjectionYears(2)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            fontSize: '0.9rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontWeight: 600,
                                            background: projectionYears === 2 ? 'var(--accent-primary)' : 'transparent',
                                            color: projectionYears === 2 ? '#fff' : 'var(--text-secondary)',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        2 Years
                                    </button>
                                </Card>
                            </div>
                </div>
            </Modal>

            <div className="projection-dashboard">
                {/* Charts and Tables */}
                <div className="projection-visuals">
                    <AnimateOnScroll delay={0.1}>
                        <Card glass className={`chart-container ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <h3>Net Wealth Curve ({projectionYears * 12} Months)</h3>
                            <div className="area-chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                        <YAxis stroke="var(--text-secondary)" tickFormatter={val => `$${val}`} />
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => `$${value.toLocaleString()}`}
                                        />
                                        <Area type="monotone" dataKey="Cumulative" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorCumulative)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </AnimateOnScroll>

                    <AnimateOnScroll delay={0.2} yOffset={40}>
                        <Card glass className={`table-container ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Month-by-Month Breakdown</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <Button 
                                        onClick={() => setShowEngineModal(true)} 
                                        variant="primary" 
                                        style={{ 
                                            padding: '8px 16px', fontSize: '0.9rem',
                                            ...(activeColor ? { background: activeColor, borderColor: activeColor, color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' } : {})
                                        }}
                                    >
                                        <Settings size={16} style={{ marginRight: '6px' }} /> Configure Projections
                                    </Button>
                                    {projectionData.length > 12 && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--surface-border)',
                                                background: currentPage === 0 ? 'rgba(255,255,255,0.05)' : 'var(--accent-primary)',
                                                color: currentPage === 0 ? 'var(--text-muted)' : '#fff',
                                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Previous Year
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(projectionData.length / 12) - 1, prev + 1))}
                                            disabled={currentPage >= Math.ceil(projectionData.length / 12) - 1}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--surface-border)',
                                                background: currentPage >= Math.ceil(projectionData.length / 12) - 1 ? 'rgba(255,255,255,0.05)' : 'var(--accent-primary)',
                                                color: currentPage >= Math.ceil(projectionData.length / 12) - 1 ? 'var(--text-muted)' : '#fff',
                                                cursor: currentPage >= Math.ceil(projectionData.length / 12) - 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Next Year
                                        </button>
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
                                                <td className="text-secondary">
                                                    <EditableCell
                                                        value={row.Income}
                                                        sign="+"
                                                        onSave={(val) => handleCellEdit(row.monthIndex, 'Income', val)}
                                                    />
                                                </td>
                                                <td className="text-secondary">
                                                    <EditableCell
                                                        value={row.Expenses}
                                                        sign="-"
                                                        onSave={(val) => handleCellEdit(row.monthIndex, 'Expenses', val)}
                                                    />
                                                </td>
                                                {extraColumns.map(c => (
                                                    <td key={c.id} className="text-secondary">
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
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>+${pageTotals.Income.toLocaleString()}</td>
                                            <td style={{ borderTop: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}>-${pageTotals.Expenses.toLocaleString()}</td>
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
                                            <td style={{ borderTop: '2px solid transparent', color: 'var(--accent-primary)', fontSize: '1.5rem', paddingTop: '24px' }}>
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
