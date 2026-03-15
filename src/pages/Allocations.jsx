import React, { useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, AlertCircle, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useFinancialContext } from '../FinancialContext';
import './Allocations.css';

// Pre-defined color palette for new categories
const COLOR_PALETTE = [
    '#4FA3F7', '#87CEEB', '#38BDF8', '#818CF8', '#FBBF24',
    '#CBD5E1', '#A78BFA', '#F472B6', '#34D399', '#F87171'
];

const Allocations = () => {
    const {
        totalMonthlyIncome,
        allocations,
        setAllocations
    } = useFinancialContext();

    const totalPercentage = allocations.reduce((acc, cat) => acc + cat.percentage, 0);
    const remainingPercentage = 100 - totalPercentage;
    const isOverAllocated = totalPercentage > 100;

    const [editingCategory, setEditingCategory] = React.useState(null); // Dollar edit
    const [editValue, setEditValue] = React.useState("");

    const [editingNameId, setEditingNameId] = React.useState(null); // Name edit
    const [editNameValue, setEditNameValue] = React.useState("");

    const handleDollarEditSave = (id) => {
        if (editingCategory === id && editValue !== "") {
            const newDollarValue = parseFloat(editValue);
            if (!isNaN(newDollarValue) && totalMonthlyIncome > 0) {
                const newPercentage = Number(((newDollarValue / totalMonthlyIncome) * 100).toFixed(2));
                setAllocations(prev => prev.map(cat => cat.id === id ? { ...cat, percentage: newPercentage } : cat));
            }
        }
        setEditingCategory(null);
    };

    const handleNameEditSave = (id) => {
        if (editingNameId === id && editNameValue.trim() !== "") {
            setAllocations(prev => prev.map(cat => cat.id === id ? { ...cat, name: editNameValue.trim() } : cat));
        }
        setEditingNameId(null);
    };

    const handleSliderChange = (id, value) => {
        const newValue = Number(value);
        setAllocations(prev => prev.map(cat => cat.id === id ? { ...cat, percentage: newValue } : cat));
    };

    const handleAddCategory = () => {
        const newColor = COLOR_PALETTE[allocations.length % COLOR_PALETTE.length];
        const newCategory = {
            id: Date.now().toString(),
            name: `Category ${allocations.length + 1}`,
            percentage: 0,
            color: newColor
        };
        setAllocations([...allocations, newCategory]);
    };

    const handleDeleteCategory = (id) => {
        setAllocations(prev => prev.filter(cat => cat.id !== id));
    };

    const chartData = useMemo(() => {
        return allocations
            .filter(cat => cat.percentage > 0)
            .map(cat => ({
                name: cat.name,
                value: cat.percentage,
                color: cat.color
            }));
    }, [allocations]);

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '0' }}>
                <img src="/allocations-header-logo.png" alt="Allocations Header Logo" style={{ height: '400px', objectFit: 'contain' }} loading="lazy" />
                <p className="page-subtitle">Direct your wealth with intention.</p>
            </div>

            <div className="allocation-dashboard">
                {/* Sliders Container */}
                <div className="allocation-controls">
                    <Card glass className="sliders-card">
                        <div className="sliders-header" style={{ marginBottom: '16px' }}>
                            <div className="header-info">
                                <h2>Allocation Strategy</h2>
                                <span className="income-badge">Based on ${totalMonthlyIncome.toLocaleString()} Income</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    className="add-tab-btn"
                                    onClick={handleAddCategory}
                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                >
                                    <Plus size={14} /> Add Category
                                </button>
                                <div className={`status-badge ${isOverAllocated ? 'danger' : remainingPercentage === 0 ? 'success' : 'warning'}`}>
                                    {isOverAllocated && <AlertCircle size={16} />}
                                    {isOverAllocated ? (
                                        <span>Over Allocated by {Math.abs(remainingPercentage)}%</span>
                                    ) : (
                                        <span>{remainingPercentage}% Remaining</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sliders-list">
                            {allocations.map(cat => {
                                const dollarValue = (totalMonthlyIncome * cat.percentage) / 100;

                                return (
                                    <div key={cat.id} className="allocation-row" style={{ position: 'relative' }}>
                                        <div className="allocation-info">
                                            {editingNameId === cat.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-hover)', borderRadius: '4px', padding: '2px 4px', border: `1px solid ${cat.color}` }}>
                                                    <input
                                                        autoFocus
                                                        value={editNameValue}
                                                        onChange={(e) => setEditNameValue(e.target.value)}
                                                        onBlur={() => handleNameEditSave(cat.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleNameEditSave(cat.id);
                                                            if (e.key === 'Escape') setEditingNameId(null);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: cat.color,
                                                            outline: 'none',
                                                            width: '120px',
                                                            fontSize: '1rem',
                                                            fontWeight: '500'
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    className="category-label"
                                                    onClick={() => {
                                                        setEditingNameId(cat.id);
                                                        setEditNameValue(cat.name);
                                                    }}
                                                    style={{ color: cat.color, cursor: 'pointer', borderBottom: '1px dashed transparent' }}
                                                    title="Click to rename"
                                                    onMouseEnter={(e) => e.currentTarget.style.borderBottom = `1px dashed ${cat.color}`}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px dashed transparent'}
                                                >
                                                    {cat.name}
                                                </span>
                                            )}

                                            {editingCategory === cat.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-hover)', borderRadius: '4px', padding: '2px 4px', border: `1px solid ${cat.color}` }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>$</span>
                                                    <input
                                                        autoFocus
                                                        type="number" step="0.01"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleDollarEditSave(cat.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleDollarEditSave(cat.id);
                                                            if (e.key === 'Escape') setEditingCategory(null);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none',
                                                            width: '60px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '600'
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <span
                                                    className="category-amount"
                                                    onClick={() => {
                                                        if (totalMonthlyIncome > 0) {
                                                            setEditingCategory(cat.id);
                                                            setEditValue(Math.round(dollarValue).toString());
                                                        }
                                                    }}
                                                    style={{ cursor: totalMonthlyIncome > 0 ? 'pointer' : 'default', borderBottom: '1px dashed transparent' }}
                                                    title={totalMonthlyIncome > 0 ? "Click to set precise dollar amount" : "Set income first"}
                                                    onMouseEnter={(e) => totalMonthlyIncome > 0 && (e.currentTarget.style.borderBottom = `1px dashed ${cat.color}`)}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px dashed transparent'}
                                                >
                                                    ${dollarValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="slider-container" style={{ position: 'relative' }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={cat.percentage}
                                                onChange={(e) => handleSliderChange(cat.id, e.target.value)}
                                                className="dream-slider"
                                                style={{
                                                    background: `linear-gradient(to right, ${cat.color} ${cat.percentage}%, var(--surface-border) ${cat.percentage}%)`
                                                }}
                                            />
                                            <span className="slider-value" style={{ color: cat.color }}>
                                                {cat.percentage}%
                                            </span>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{
                                                    position: 'absolute',
                                                    right: '-24px',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                title="Remove Category"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Visualizer Container */}
                <div className="allocation-visuals">
                    <Card glass className="chart-card text-center">
                        <h3>Wealth Distribution</h3>
                        <div className="pie-wrapper">
                            {totalPercentage === 0 ? (
                                <div className="empty-pie">
                                    <Target size={48} className="text-muted" />
                                    <p>Allocate funds to see your chart</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [`${value}% ($${((totalMonthlyIncome * value) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, name]}
                                            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Total Allocated Metric */}
                        <div className="total-allocated-metric">
                            <span className="metric-label">Total Allocated</span>
                            <div className={`metric-amount ${isOverAllocated ? 'danger-text' : 'success-text'}`}>
                                <AnimatedNumber value={totalPercentage} />%
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Allocations;
