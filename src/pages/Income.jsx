import React, { useState, useMemo } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Trash2, Sparkles, DollarSign, Edit2, Check, X, Target, AlertCircle, Wallet, Smile } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';
import { useFinancialContext } from '../FinancialContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import { GoalsSection } from '../components/dashboard/GoalsSection';
import './Income.css';
import { getFilterLabel } from './Expenses';

const useRecentIncomeMerchants = (transactions) => {
    return useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        
        const merchantMap = new Map();
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        for (const tx of transactions) {
            if (tx.amount >= 0 || tx.pending) continue;
            const txDate = new Date(tx.date);
            if (txDate < sixtyDaysAgo) continue;
            
            const rawM = (tx.merchant_name || tx.name || '').trim();
            if (!rawM) continue;
            
            if (!merchantMap.has(rawM)) {
                merchantMap.set(rawM, Math.abs(tx.amount));
            }
        }
        
        return Array.from(merchantMap.keys())
            .sort()
            .map(merchant => ({
                merchant,
                amount: merchantMap.get(merchant)
            }));
    }, [transactions]);
};

const IncomeStreamForm = ({ onAdd, title, className = '', isModal = false, recentMerchants = [], initialData = null }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [linkedMerchant, setLinkedMerchant] = useState(initialData?.apiId || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { playKaChing } = useSound();
    const { expenseBorderColor, theme } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#9d4edd' : '#4FA3F7') : undefined;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && amount) {
            playKaChing();
            onAdd({ 
                id: initialData?.id || crypto.randomUUID(), 
                name, 
                amount: parseFloat(amount), 
                frequency: 'monthly',
                apiId: linkedMerchant || null 
            });
            if (!initialData) {
                setName('');
                setAmount('');
                setLinkedMerchant('');
            }
        }
    };

    const content = (
        <form onSubmit={handleSubmit} className="income-form" style={isModal ? { background: 'transparent', padding: '8px 0', border: 'none' } : {}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <Input
                    list="recent-income-merchants"
                    placeholder="🔗 Search Bank Transactions (Last 60 Days)"
                    value={linkedMerchant}
                    onChange={(e) => {
                        const val = e.target.value;
                        setLinkedMerchant(val);
                        if (recentMerchants && recentMerchants.length > 0) {
                            const match = recentMerchants.find(m => m.merchant === val);
                            if (match) {
                                if (!name) setName(match.merchant);
                                if (!amount) setAmount(Math.round(Math.abs(match.amount)));
                            }
                        }
                    }}
                    style={{ color: 'var(--text-primary)', marginBottom: 0 }}
                />
                {recentMerchants && recentMerchants.length > 0 && (
                    <datalist id="recent-income-merchants">
                        {recentMerchants.map(m => (
                            <option key={m.merchant} value={m.merchant}>
                                ${Number(m.amount).toFixed(2)}
                            </option>
                        ))}
                    </datalist>
                )}
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={{ padding: '0 12px', height: '42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        title="Add Emoji"
                    >
                        <Smile size={20} color="var(--text-secondary)" />
                    </Button>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="e.g. Salary, Side Hustle"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ color: 'black', marginBottom: 0 }}
                        />
                    </div>
                    {showEmojiPicker && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100 }}>
                            <div 
                                style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                                onClick={() => setShowEmojiPicker(false)} 
                            />
                            <div style={{ position: 'relative', zIndex: 100, boxShadow: '0 16px 32px rgba(0,0,0,0.5)', borderRadius: '8px' }}>
                                <EmojiPicker 
                                    onEmojiClick={(emojiData) => {
                                        setName(prev => (prev ? prev + ' ' : '') + emojiData.emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    theme={theme === 'dark' ? 'dark' : 'light'}
                                    searchPosition="none"
                                    skinTonesDisabled
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="amount-input-group">
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount (Monthly)"
                        leftIcon={DollarSign}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0"
                        style={{ color: 'black', flex: 1 }}
                    />
                    <Button 
                        type="submit" 
                        variant="secondary"
                        style={activeColor ? { 
                            background: activeColor, 
                            borderColor: activeColor, 
                            color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                        } : {}}
                    >
                        <Plus size={18} /> Add
                    </Button>
                </div>
            </form>
    );

    if (isModal) {
        return (
            <div style={{ position: 'relative', zIndex: 99 }}>
                {title && <h3 className="form-title" style={{ marginBottom: '16px' }}>{title}</h3>}
                {content}
            </div>
        );
    }

    return (
        <Card glass className={`income-form-card ${className}`.trim()} style={{ position: 'relative', zIndex: 99 }}>
            {title && <h3 className="form-title">{title}</h3>}
            {content}
        </Card>
    );
};

export const getStreamAutoReceivedAmount = (stream, incomeTransactionsByCategory, filteredIncomeTransactions) => {
    if (stream.apiId && filteredIncomeTransactions && filteredIncomeTransactions.length > 0) {
        const searchTag = stream.apiId.toLowerCase();
        return filteredIncomeTransactions
            .filter(tx => {
                const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
                return merchant.includes(searchTag) || searchTag.includes(merchant);
            })
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }
    return Number(incomeTransactionsByCategory[stream.name]) || 0;
};

const EditableStreamItem = ({ stream, onRemove, onUpdate, showTracking = false, incomeTransactionsByCategory = {}, filteredIncomeTransactions = [] }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(stream.name);
    const [editAmount, setEditAmount] = useState(stream.amount);

    const handleSave = () => {
        if (editName && editAmount) {
            onUpdate({ ...stream, name: editName, amount: parseFloat(editAmount) });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditName(stream.name);
        setEditAmount(stream.amount);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="stream-item glass" style={{ flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Stream Name"
                        style={{ flex: 1 }}
                        autoFocus
                    />
                    <Input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Amount"
                        leftIcon={DollarSign}
                        style={{ width: '140px' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X size={16} /> Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleSave}>
                        <Check size={16} /> Save
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="stream-item glass">
            <div className="stream-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p className="stream-name" style={{ margin: 0 }}>{stream.name}</p>
                    {stream.apiId && (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} title={`Linked to ${stream.apiId}`}>
                            🔗
                        </span>
                    )}
                </div>
                <span className="stream-freq">Monthly</span>
            </div>

            {showTracking && (
                <div className="expense-tracking" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface-hover)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', gap: '16px', margin: '0 12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Auto-Tracker: $</span>
                        <input
                            className="auto-tracker-input"
                            type="number"
                            step="0.01"
                            value={stream.manualReceived != null ? stream.manualReceived : (incomeTransactionsByCategory[stream.name] || '')}
                            onChange={(e) => {
                                const val = e.target.value;
                                onUpdate({ ...stream, manualReceived: val === '' ? undefined : Number(val) });
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
                            const received = stream.manualReceived != null ? Number(stream.manualReceived) : getStreamAutoReceivedAmount(stream, incomeTransactionsByCategory, filteredIncomeTransactions);
                            const diff = stream.amount - received;
                            if (diff <= 0) return 'var(--success)';
                            if (received > 0) return '#ff9f0a';
                            return 'var(--text-muted)';
                        })()
                    }}>
                        {(() => {
                            const received = stream.manualReceived != null ? Number(stream.manualReceived) : getStreamAutoReceivedAmount(stream, incomeTransactionsByCategory, filteredIncomeTransactions);
                            const diff = stream.amount - received;
                            if (diff <= 0) return `Target Met! (+$${Math.abs(diff).toLocaleString()})`;
                            return `${diff.toLocaleString()} to go`;
                        })()}
                    </div>
                </div>
            )}

            <div className="stream-actions">
                <span className="stream-amount positive">${stream.amount.toLocaleString()}</span>
                <button onClick={() => setIsEditing(true)} className="btn-icon">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => onRemove(stream.id)} className="btn-icon danger">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const IncomeStreamList = ({ streams, onRemove, onUpdate, emptyMessage, showTracking = false, incomeTransactionsByCategory = {}, filteredIncomeTransactions = [] }) => {
    if (streams.length === 0) {
        return <div className="empty-state text-muted">{emptyMessage}</div>;
    }

    return (
        <div className="stream-list">
            {streams.map((stream) => (
                <AnimateOnScroll key={stream.id} delay={0.05} yOffset={20}>
                    <EditableStreamItem
                        stream={stream}
                        onRemove={onRemove}
                        onUpdate={onUpdate}
                        showTracking={showTracking}
                        incomeTransactionsByCategory={incomeTransactionsByCategory}
                        filteredIncomeTransactions={filteredIncomeTransactions}
                    />
                </AnimateOnScroll>
            ))}
        </div>
    );
};

const Income = () => {
    const {
        currentIncome, setCurrentIncome,
        futureIncome, setFutureIncome,
        totalMonthlyIncome,
        allocations, setAllocations,
        transactions, incomeTransactionsByCategory
    } = useFinancialContext();
    const recentIncomeMerchants = useRecentIncomeMerchants(transactions);
    const { expenseBorderColor, theme } = useTheme();
    const { playPop } = useSound();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#9d4edd' : '#4FA3F7') : undefined;

    // --- Modal State ---
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isCurrentStreamModalOpen, setIsCurrentStreamModalOpen] = useState(false);
    const [isFutureStreamModalOpen, setIsFutureStreamModalOpen] = useState(false);
    const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
    const [activityPage, setActivityPage] = useState(1);
    const activityItemsPerPage = 6;

    // --- Derived Modal Data ---
    const uniqueIncomeCategories = useMemo(() => {
        if (!transactions) return ['All'];
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

        const cats = new Set(transactions.filter(tx => {
            if (tx.amount >= 0 || tx.pending) return false;
            const txDate = new Date(tx.date);
            return txDate >= fortyDaysAgo;
        }).map(tx => tx.category || 'Uncategorized'));
        
        return ['All', ...cats].sort();
    }, [transactions]);

    const filteredIncomeTransactions = useMemo(() => {
        if (!transactions) return [];
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

        const incomeTxs = transactions.filter(tx => {
            if (tx.amount >= 0 || tx.pending) return false;
            const txDate = new Date(tx.date);
            return txDate >= fortyDaysAgo;
        });
        
        if (activityCategoryFilter === 'All') return incomeTxs;
        return incomeTxs.filter(tx => (tx.category || 'Uncategorized') === activityCategoryFilter);
    }, [transactions, activityCategoryFilter]);

    const activityTotalPages = Math.ceil(filteredIncomeTransactions.length / activityItemsPerPage);
    const paginatedIncomeTransactions = filteredIncomeTransactions.slice((activityPage - 1) * activityItemsPerPage, activityPage * activityItemsPerPage);

    const filteredTotalIncomeAmount = useMemo(() => {
        return filteredIncomeTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    }, [filteredIncomeTransactions]);

    // --- Allocations State & Logic ---
    const totalPercentage = allocations.reduce((acc, cat) => acc + cat.percentage, 0);
    const remainingPercentage = 100 - totalPercentage;
    const isOverAllocated = totalPercentage > 100;

    const [editingCategory, setEditingCategory] = useState(null); // Dollar edit
    const [editValue, setEditValue] = useState("");
    const [editingNameId, setEditingNameId] = useState(null); // Name edit
    const [editNameValue, setEditNameValue] = useState("");

    // Pre-defined color palette for new categories
    const COLOR_PALETTE = [
        '#4FA3F7', '#87CEEB', '#38BDF8', '#818CF8', '#FBBF24',
        '#CBD5E1', '#A78BFA', '#F472B6', '#34D399', '#F87171'
    ];

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
            id: crypto.randomUUID(),
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
    // --- End Allocations Logic ---

    const totalYearlyIncome = totalMonthlyIncome * 12;
    // User requested "bi-monthly" right next to yearly. Most people refer to every two weeks (26 pay periods) as bi-weekly or bi-monthly in this context.
    const totalBiWeeklyIncome = (totalYearlyIncome / 26);
    
    const projectedFutureIncome = futureIncome.reduce((acc, curr) => acc + curr.amount, 0);
    const totalProjectedMonthly = totalMonthlyIncome + projectedFutureIncome;

    const addCurrentIncome = (stream) => setCurrentIncome([...currentIncome, stream]);
    const removeCurrentIncome = (id) => setCurrentIncome(currentIncome.filter(s => s.id !== id));
    const updateCurrentIncome = (updated) => setCurrentIncome(currentIncome.map(s => s.id === updated.id ? updated : s));

    const addFutureIncome = (stream) => setFutureIncome([...futureIncome, stream]);
    const removeFutureIncome = (id) => setFutureIncome(futureIncome.filter(s => s.id !== id));
    const updateFutureIncome = (updated) => setFutureIncome(futureIncome.map(s => s.id === updated.id ? updated : s));

    return (
        <div className="page-container animate-fade-in" style={{ minHeight: '100vh' }}>
            <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '0' }}>
                <img src="/income-header-logo.png" alt="Income Header Logo" className="page-header-logo" style={{ height: '400px', objectFit: 'contain', marginLeft: '3%' }} loading="lazy" />
                <p className="page-subtitle">Design your cash flow architecture.</p>
            </div>

            <div className="income-summary-grid">
                <AnimateOnScroll delay={0.1}>
                    <Card glass className={`summary-card ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                        <p className="summary-label">Current Monthly</p>
                        <h2 className="summary-value positive">
                            $<AnimatedNumber value={totalMonthlyIncome} />
                        </h2>
                        <p className="summary-subtext">Bi-Monthly: ${totalBiWeeklyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}  |  Yearly: ${totalYearlyIncome.toLocaleString()}</p>
                    </Card>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                    <Card glass className={`summary-card gold-glow ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`} style={{ height: '100%' }}>
                        <div className="summary-label with-icon">
                            <Sparkles size={16} className="gold-text" />
                            <span>Projected Growth (Current + Future)</span>
                        </div>
                        <h2 className="summary-value gold-text">
                            $<AnimatedNumber value={totalProjectedMonthly} />
                        </h2>
                        <p className="summary-subtext">Monthly target</p>
                    </Card>
                </AnimateOnScroll>
            </div>

            <div className="income-dashboard-layout">
                <div className="income-content-grid">
                    {/* Current Income Column */}
                    <AnimateOnScroll delay={0.1} className="income-column">
                        <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <h2 style={{ margin: 0 }}>💼 Current Streams</h2>
                                <span className="badge" style={{ marginLeft: '12px' }}>
                                    Expected: ${totalMonthlyIncome.toLocaleString()}
                                </span>
                                <span className="badge" style={{ marginLeft: '8px', background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)' }}>
                                    Received: ${currentIncome.reduce((sum, stream) => sum + (stream.manualReceived != null ? Number(stream.manualReceived) : getStreamAutoReceivedAmount(stream, incomeTransactionsByCategory, filteredIncomeTransactions)), 0).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        if (playPop) playPop();
                                        setIsActivityModalOpen(true);
                                    }}
                                    className="activity-sync-btn"
                                    style={{ 
                                        padding: '6px 14px', 
                                        height: '32px',
                                        ...(activeColor ? {
                                            backgroundColor: activeColor,
                                            color: activeColor === '#ffffff' ? '#000000' : '#ffffff',
                                            border: 'none'
                                        } : {})
                                    }}
                                >
                                    <Wallet size={16} style={{ marginRight: '6px' }} />
                                    Activity
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        if (playPop) playPop();
                                        setIsCurrentStreamModalOpen(true);
                                    }}
                                    style={{ height: '32px', padding: '6px 14px' }}
                                    className={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                                >
                                    <Plus size={16} style={{ marginRight: '6px' }} />
                                    Add stream
                                </Button>
                            </div>
                        </div>
                        <IncomeStreamList
                            streams={currentIncome}
                            onRemove={removeCurrentIncome}
                            onUpdate={updateCurrentIncome}
                            emptyMessage="No current streams added."
                            showTracking={true}
                            incomeTransactionsByCategory={incomeTransactionsByCategory}
                            filteredIncomeTransactions={filteredIncomeTransactions}
                        />
                    </AnimateOnScroll>

                    {/* Future Income Column */}
                    <AnimateOnScroll delay={0.2} className="income-column">
                        <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <h2 style={{ margin: 0 }}>📈 Manifesting / Future</h2>
                                <span className="badge gold" style={{ marginLeft: '12px' }}>${projectedFutureIncome.toLocaleString()}</span>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    if (playPop) playPop();
                                    setIsFutureStreamModalOpen(true);
                                }}
                                style={{ height: '32px', padding: '6px 14px' }}
                                className={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                            >
                                <Plus size={16} style={{ marginRight: '6px' }} />
                                Add stream
                            </Button>
                        </div>
                        <IncomeStreamList
                            streams={futureIncome}
                            onRemove={removeFutureIncome}
                            onUpdate={updateFutureIncome}
                            emptyMessage="No future streams added."
                            showTracking={true}
                            incomeTransactionsByCategory={incomeTransactionsByCategory}
                            filteredIncomeTransactions={filteredIncomeTransactions}
                        />
                    </AnimateOnScroll>
                </div>
            </div>

            {/* Savings Goals Section */}
            <div className="goals-section" style={{ marginTop: '48px' }}>
                <GoalsSection />
            </div>

            {/* --- Merged Allocations Dashboard --- */}
            <AnimateOnScroll delay={0.1} yOffset={40}>
                <div className="allocation-dashboard" style={{ marginTop: '48px' }}>
                    <div className="allocation-controls">
                        <Card glass className={`sliders-card ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <div className="sliders-header" style={{ marginBottom: '16px' }}>
                                <div className="header-info">
                                    <h2>Allocation Strategy</h2>
                                    <span className="income-badge">Based on ${totalMonthlyIncome.toLocaleString()} Income</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Button
                                        onClick={() => { playPop(); handleAddCategory(); }}
                                        variant="primary"
                                        style={activeColor ? { 
                                            background: activeColor, 
                                            borderColor: activeColor, 
                                            color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                                        } : {}}
                                    >
                                        <Plus size={16} style={{ marginRight: '8px' }} /> Add Category
                                    </Button>
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
                                                            type="number"
                                                            step="0.01"
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
                        <Card glass className={`chart-card text-center ${expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}`}>
                            <h3 className="panel-title">Wealth Distribution</h3>
                            <div className="pie-wrapper">
                                {totalPercentage === 0 ? (
                                    <div className="empty-pie">
                                        <Target size={48} className="text-muted" />
                                        <p>Allocate funds to see your chart</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
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
                                                cursor={{ fill: 'transparent' }}
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
            </AnimateOnScroll>

            <Modal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                title={(() => {
                    const activeColor = {
                        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
                        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
                        yellow: '#eab308', orange: '#f97316'
                    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7');
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wallet size={20} color={activeColor} /> 
                            <span style={{ color: activeColor }}>Recent Income Activity</span>
                        </div>
                    );
                })()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '60%', margin: 0 }}>
                        These transactions were automatically securely synced from your connected Plaid bank accounts.
                        The Rules Engine uses their categories to automatically track your real-life deposits.
                    </p>
                    <div className="total-amount-box" style={{ background: 'var(--surface-hover)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--surface-border)', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Total ({getFilterLabel(activityCategoryFilter)})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                            +${Math.abs(filteredTotalIncomeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="category-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                    {uniqueIncomeCategories.map(cat => (
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
                            {getFilterLabel(cat)}
                        </button>
                    ))}
                </div>

                <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(!filteredIncomeTransactions || filteredIncomeTransactions.length === 0) ? (
                        <div className="empty-state text-muted" style={{ textAlign: 'center', padding: '32px' }}>
                            No recent deposit transactions found.
                        </div>
                    ) : (
                        paginatedIncomeTransactions.map((tx) => (
                            <div key={tx.id} className="stream-item glass" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', alignItems: 'center', padding: '16px', gap: '16px' }}>
                                <div className="tx-merchant" style={{ fontWeight: 600 }}>
                                    {tx.merchant_name || 'Income Source'}
                                    {tx.pending && <span className="badge warning-badge" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Pending</span>}
                                </div>
                                <div className="tx-date text-muted" style={{ fontSize: '0.85rem' }}>
                                    {new Date(tx.date).toLocaleDateString()}
                                </div>
                                <div className="tx-category">
                                    <span className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', padding: '4px 10px' }}>
                                        {getFilterLabel(tx.category || 'Uncategorized')}
                                    </span>
                                </div>
                                <div className="tx-amount text-success" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    +${Math.abs(tx.amount).toLocaleString()}
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

            <Modal
                isOpen={isCurrentStreamModalOpen}
                onClose={() => setIsCurrentStreamModalOpen(false)}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wallet size={20} color={activeColor || 'var(--text-primary)'} /> 
                        <span style={{ color: activeColor || 'var(--text-primary)' }}>Add Current Stream</span>
                    </div>
                )}
            >
                <div className="animate-fade-in" style={{ padding: '8px' }}>
                    <IncomeStreamForm 
                        onAdd={(stream) => { addCurrentIncome(stream); setIsCurrentStreamModalOpen(false); }} 
                        title="" 
                        isModal={true}
                        recentMerchants={recentIncomeMerchants}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isFutureStreamModalOpen}
                onClose={() => setIsFutureStreamModalOpen(false)}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} color={activeColor || 'var(--text-primary)'} /> 
                        <span style={{ color: activeColor || 'var(--text-primary)' }}>Add Future Stream</span>
                    </div>
                )}
            >
                <div className="animate-fade-in" style={{ padding: '8px' }}>
                    <IncomeStreamForm 
                        onAdd={(stream) => { addFutureIncome(stream); setIsFutureStreamModalOpen(false); }} 
                        title="" 
                        isModal={true}
                        recentMerchants={recentIncomeMerchants}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Income;
