import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Wallet, DollarSign, TrendingDown, Percent, Flame, Wind, CloudRain, AlertTriangle, Car, GraduationCap, Home, HeartPulse, CreditCard, Clock, CheckCircle2, Smile, Activity, Save, Edit2, Scissors } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
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
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useFinancialContext } from '../FinancialContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { Modal } from '../components/ui/Modal';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import { useStore } from '../store';
import { useXP } from '../contexts/XPContext';
import { supabase } from '../supabaseClient';
import './Expenses.css';
import { SplitTransactionModal } from '../components/SplitTransactionModal';

export const getFilterLabel = (filterId) => {
    if (!filterId) return '🏷️ Uncategorized';
    if (filterId === 'PSEUDO_GAS') return '⛽️ Gas & Fuel';
    if (filterId === 'PSEUDO_RIDE_SHARE') return '🚗 Ride Share';
    if (filterId === 'PSEUDO_GROCERIES') return '🛒 Groceries';
    if (filterId === 'PSEUDO_HYGIENE_HOUSEHOLD') return '🧼 Hygiene & Household';
    if (filterId === 'PSEUDO_SUBSCRIPTIONS') return '🔄 Subscriptions';
    if (filterId === 'All') return '🌎 All';
    
    // Format the backend string: replace underscores with spaces and title case
    const formattedName = filterId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
        
    const lower = filterId.toLowerCase();
    if (lower.includes('food') || lower.includes('drink') || lower.includes('dining') || lower.includes('restaurant')) return `🍔 ${formattedName}`;
    if (lower.includes('travel') || lower.includes('airline') || lower.includes('hotel')) return `✈️ ${formattedName}`;
    if (lower.includes('shop') || lower.includes('retail') || lower.includes('clothing')) return `🛍️ ${formattedName}`;
    if (lower.includes('transfer') || lower.includes('payment') || lower.includes('credit card')) return `💳 ${formattedName}`;
    if (lower.includes('health') || lower.includes('medical') || lower.includes('doctor')) return `🏥 ${formattedName}`;
    if (lower.includes('service') || lower.includes('subscription')) return `⚙️ ${formattedName}`;
    if (lower.includes('entertainment') || lower.includes('recreation')) return `🎟️ ${formattedName}`;
    if (lower.includes('auto') || lower.includes('car') || lower.includes('transport')) return `🚙 ${formattedName}`;
    if (lower.includes('utility') || lower.includes('bills')) return `⚡️ ${formattedName}`;
    if (lower.includes('personal') || lower.includes('care')) return `💅 ${formattedName}`;
    if (lower.includes('education') || lower.includes('school')) return `🎓 ${formattedName}`;
    if (lower.includes('home') || lower.includes('rent') || lower.includes('mortgage')) return `🏠 ${formattedName}`;
    if (lower.includes('income') || lower.includes('salary') || lower.includes('paycheck')) return `💵 ${formattedName}`;
    
    return `🏷️ ${formattedName}`;
};

export const detectPseudoCategory = (tx) => {
    if (tx.category && tx.category.endsWith(' ')) {
        return tx.category.trim();
    }
    
    const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
    
    if (merchant.includes('exxon') || merchant.includes('shell') || merchant.includes('chevron') || merchant.includes('wawa') || merchant.includes('bp ') || merchant.includes('sunoco') || merchant.includes('speedway') || merchant.includes('quik') || merchant.includes('pilot') || merchant.includes('gas') || merchant.includes('fuel')) {
        return 'PSEUDO_GAS';
    }
    if (merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi') || merchant.includes('cab')) {
        return 'PSEUDO_RIDE_SHARE';
    }
    if (merchant.includes('walmart') || merchant.includes('kroger') || merchant.includes('target') || merchant.includes('publix') || merchant.includes('safeway') || merchant.includes('trader joe') || merchant.includes('whole food') || merchant.includes('aldi') || merchant.includes('wegmans') || merchant.includes('h-e-b') || merchant.includes('meijer') || merchant.includes('food lion') || merchant.includes('costco') || merchant.includes("sam's club") || merchant.includes('bjs') || merchant.includes('grocery') || merchant.includes('supermarket')) {
        return 'PSEUDO_GROCERIES';
    }
    if (merchant.includes('cvs') || merchant.includes('walgreens') || merchant.includes('rite aid') || merchant.includes('sephora') || merchant.includes('ulta') || merchant.includes('bath & body') || merchant.includes('home depot') || merchant.includes("lowe's") || merchant.includes('ace hardware') || merchant.includes('ikea') || merchant.includes('bed bath') || merchant.includes('pharmacy') || merchant.includes('drugstore') || merchant.includes('sally beauty') || merchant.includes('mac cosmetics')) {
        return 'PSEUDO_HYGIENE_HOUSEHOLD';
    }
    if (merchant.includes('netflix') || merchant.includes('spotify') || merchant.includes('hulu') || merchant.includes('disney+') || merchant.includes('apple') || merchant.includes('amazon prime') || merchant.includes('hbomax') || merchant.includes('peacock') || merchant.includes('paramount') || merchant.includes('gym')) {
        return 'PSEUDO_SUBSCRIPTIONS';
    }
    
    return tx.category || 'Uncategorized';
};

export const useRecentMerchants = (transactions) => {
    return useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        
        const merchantMap = new Map();
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        for (const tx of transactions) {
            if (tx.amount <= 0) continue;
            const txDate = new Date(tx.date);
            if (txDate < sixtyDaysAgo) continue;
            
            const rawM = (tx.merchant_name || tx.name || '').trim();
            if (!rawM) continue;
            
            if (!merchantMap.has(rawM)) {
                merchantMap.set(rawM, tx.amount);
            }
        }
        
        const recent = Array.from(merchantMap.entries()).map(([merchant, amount]) => ({ merchant, amount }));
        return recent.sort((a, b) => a.merchant.localeCompare(b.merchant));
    }, [transactions]);
};

const ExpenseForm = ({ onAdd, title, placeholder, showDueDate = true, showCategory = false, uniqueCategories = [], isModal = false, recentMerchants = [], initialData = null }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate?.toString() || '');
    const [category, setCategory] = useState(initialData?.targetCategory || '');
    const [linkedMerchant, setLinkedMerchant] = useState(initialData?.apiId || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { playReceiptTear } = useSound();
    const { expenseBorderColor, theme } = useTheme();
    const borderGlowClass = expenseBorderColor && expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && amount) {
            playReceiptTear();
            onAdd({ 
                id: initialData?.id || crypto.randomUUID(), 
                name, 
                targetCategory: category || null, 
                amount: parseFloat(amount), 
                frequency: 'monthly', 
                dueDate: dueDate ? parseInt(dueDate, 10) : null,
                apiId: linkedMerchant || null
            });
            if (!initialData) {
                setName('');
                setAmount('');
                setDueDate('');
                setCategory('');
                setLinkedMerchant('');
            }
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="expense-form" style={isModal ? { background: 'transparent', padding: '8px 0', border: 'none' } : {}}>
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
                        placeholder={placeholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ color: 'var(--text-primary)', marginBottom: 0, border: `2px solid ${activeColor || 'var(--surface-border)'}`, borderRadius: '50px' }}
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

            {!showCategory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <Input
                        list="recent-merchants"
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
                        style={{ color: 'var(--text-primary)', marginBottom: 0, border: `2px solid ${activeColor || 'var(--surface-border)'}`, borderRadius: '50px' }}
                    />
                    {recentMerchants && recentMerchants.length > 0 && (
                        <datalist id="recent-merchants">
                            {recentMerchants.map(m => (
                                <option key={m.merchant} value={m.merchant}>
                                    ${Number(m.amount).toFixed(2)}
                                </option>
                            ))}
                        </datalist>
                    )}
                </div>
            )}

            {showCategory && (
                <div style={{ display: 'flex', marginBottom: '16px' }}>
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        style={{ background: 'var(--surface)', border: `2px solid ${activeColor || 'var(--surface-border)'}`, color: category ? 'var(--text-primary)' : 'var(--text-muted)', outline: 'none', padding: '10px 16px', borderRadius: '50px', cursor: 'pointer', flex: 1 }}
                    >
                        <option value="">Category</option>
                        <option value="PSEUDO_GAS">{getFilterLabel('PSEUDO_GAS')}</option>
                        <option value="PSEUDO_RIDE_SHARE">{getFilterLabel('PSEUDO_RIDE_SHARE')}</option>
                        <option value="PSEUDO_GROCERIES">{getFilterLabel('PSEUDO_GROCERIES')}</option>
                        <option value="PSEUDO_HYGIENE_HOUSEHOLD">{getFilterLabel('PSEUDO_HYGIENE_HOUSEHOLD')}</option>
                        <option value="PSEUDO_SUBSCRIPTIONS">{getFilterLabel('PSEUDO_SUBSCRIPTIONS')}</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{getFilterLabel(c)}</option>)}
                    </select>
                </div>
            )}

            <div className="amount-input-group">
                <CurrencyInput
                    placeholder="Amount"
                    leftIcon={Wallet}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    style={{ color: 'var(--text-primary)', flex: 1.5, border: `2px solid ${activeColor || 'var(--surface-border)'}`, borderRadius: '50px' }}
                />
                {showDueDate && (
                    <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Day (1-31)"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ color: 'var(--text-primary)', flex: 1, border: `2px solid ${activeColor || 'var(--surface-border)'}`, borderRadius: '50px' }}
                    />
                )}
                <Button 
                    type="submit" 
                    variant="secondary"
                    style={activeColor ? { 
                        background: activeColor, 
                        borderColor: activeColor, 
                        color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                    } : {}}
                >
                    {initialData ? 'Save Changes' : <><Plus size={18} /> Add</>}
                </Button>
            </div>
        </form>
    );

    if (isModal) {
        return (
            <div style={{ position: 'relative', zIndex: 99 }}>
                {title && <h3 className="form-title" style={{ marginBottom: '16px' }}>{title}</h3>}
                {formContent}
            </div>
        );
    }

    return (
        <Card glass className={`expense-form-card ${borderGlowClass}`} style={{ position: 'relative', zIndex: 99 }}>
            {title && <h3 className="form-title">{title}</h3>}
            {formContent}
        </Card>
    );
};

const ExpenseList = ({ expenses, onRemove, onEdit, emptyMessage, showTracking = false, transactionsByCategory = {}, mapUserExpenseToPlaidCategory, showDueDate = true, uniqueCategories = [], recentMerchants = [] }) => {
    const { playCheck, playPop } = useSound();
    const { expenseBorderColor, theme } = useTheme();
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [editTargetCategory, setEditTargetCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Derived Dynamic Colors
    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
    const badgeTextColor = (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white';

    const totalPages = Math.ceil(expenses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);



    const startEditing = (expense) => {
        setEditingId(expense.id);
        setEditName(expense.name);
        setEditTargetCategory(expense.targetCategory || '');
        setEditAmount(expense.amount.toString());
        setEditDueDate(expense.dueDate || '');
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
                    <div className={`stream-item ${expense.isPaid ? 'paid' : ''} glass`} onDoubleClick={() => { if (playPop) playPop(); startEditing(expense); }}>
                        {editingId === expense.id && (
                            <Modal 
                                isOpen={true} 
                                onClose={cancelEdit} 
                                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                                clearBlur={true}
                                transparentOverlay={true}
                                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                                containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                                title={(() => {
                                    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white', background: activeColor, padding: '8px 16px', borderRadius: '12px', boxShadow: `0 4px 12px ${activeColor}40` }}>
                                            <Activity size={20} />
                                            <span>Edit Bill</span>
                                        </div>
                                    );
                                })()}
                            >
                                <ExpenseForm
                                    initialData={expense}
                                    showDueDate={showDueDate}
                                    onAdd={(updates) => {
                                        onEdit(expense.id, updates);
                                        setEditingId(null);
                                    }}
                                    title=""
                                    placeholder="Name"
                                    isModal={true}
                                    showCategory={!!expense.targetCategory}
                                    uniqueCategories={uniqueCategories}
                                    recentMerchants={recentMerchants}
                                />
                            </Modal>
                        )}
                        <>
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    {!showTracking && (
                                        <div className="checkbox-wrapper">
                                            {expense.autoPaid ? (
                                                <div title="Auto-Detected Monthly Payment via Bank Link" style={{ marginRight: '16px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle2 size={24} />
                                                </div>
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    className="expense-checkbox"
                                                    checked={expense.isPaid || false}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        if (isChecked) {
                                                            playCheck();
                                                        }
                                                        onEdit(expense.id, { isPaid: isChecked });
                                                    }}
                                                    title={expense.isPaid ? "Mark as unpaid" : "Mark as paid"}
                                                />
                                            )}
                                        </div>
                                    )}
                                    <div className="stream-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <p className="stream-name" style={{ margin: 0 }}>{expense.name}</p>
                                            {expense.apiId && (
                                                <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.05)', color: '#000000' }} title={`Linked to ${expense.apiId}`}>
                                                    🔗
                                                </span>
                                            )}
                                            {expense.targetCategory && (
                                                <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.8, backgroundColor: activeColor, color: badgeTextColor }}>
                                                    {getFilterLabel(expense.targetCategory)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="stream-freq">
                                            Monthly {showDueDate && expense.dueDate && `• Due on the ${expense.dueDate}${[11, 12, 13].includes(Number(expense.dueDate)) ? 'th' : (['st', 'nd', 'rd'][(Number(expense.dueDate) % 10) - 1] || 'th')}`}
                                        </span>
                                    </div>
                                </div>

                                {showTracking && (
                                    <div className="expense-tracking" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', gap: '8px', margin: '0 8px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Auto-Tracker: </span>
                                            <CurrencyInput
                                                raw
                                                className={`auto-tracker-input ${expenseBorderColor === 'none' ? 'no-border' : ''}`}
                                                value={expense.manualSpent != null ? expense.manualSpent : (transactionsByCategory[expense.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(expense.name) : expense.name)] || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    onEdit(expense.id, { manualSpent: val === '' ? undefined : Number(val) });
                                                }}
                                                style={{ width: '80px', background: 'transparent', border: expenseBorderColor === 'none' ? 'none' : '2px solid', borderColor: expenseBorderColor === 'none' ? 'transparent' : (activeColor || 'var(--primary)'), borderRadius: '50px', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '0.9rem', textAlign: 'right', outline: 'none', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => {
                                                    if (expenseBorderColor !== 'none') e.target.style.borderColor = activeColor || 'var(--primary)';
                                                }}
                                                onBlur={(e) => {
                                                    if (expenseBorderColor !== 'none') e.target.style.borderColor = activeColor || 'var(--primary)';
                                                }}
                                            />
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: (() => {
                                                const spent = expense.manualSpent != null ? Number(expense.manualSpent) : (Number(transactionsByCategory[expense.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(expense.name) : expense.name)]) || 0);
                                                const left = expense.amount - spent;
                                                if (left <= 0) return 'var(--danger)';
                                                if (left <= expense.amount * 0.1) return '#ff9f0a';
                                                return 'var(--success)';
                                            })()
                                        }}>
                                            Left: ${(expense.amount - (expense.manualSpent != null ? Number(expense.manualSpent) : (Number(transactionsByCategory[expense.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(expense.name) : expense.name)]) || 0))).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                <div className="stream-actions">
                                    <span className="stream-amount negative" style={{ minWidth: '80px', textAlign: 'right' }}>${expense.amount.toLocaleString()}</span>
                                    <button className="btn-icon" onClick={() => { if(playPop) playPop(); startEditing(expense); }}><Edit2 size={16} /></button>
                                    <button onClick={() => onRemove(expense.id)} className="btn-icon danger">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
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
        totalFixedExpenses, totalVariableExpenses, totalSubscriptionCost, totalTrackedMonthlyPayments, totalMonthlyExpenses,
        netMonthlyCashFlow, savingsRate,
        transactionsByCategory, transactions, mapUserExpenseToPlaidCategory,
        trackedDebts, setTrackedDebts,
        subscriptions, setSubscriptions
    } = useFinancialContext();
    const { playCheck, playPop } = useSound();
    const { addXP } = useXP();
    const { expenseBorderColor, theme } = useTheme();
    const borderGlowClass = expenseBorderColor && expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;

    // --- Modal State ---
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [splittingTransaction, setSplittingTransaction] = useState(null);
    const [activityPage, setActivityPage] = useState(1);
    const activityItemsPerPage = 6;

    // --- Derived Modal Data ---
    const uniqueCategories = useMemo(() => {
        if (!transactions) return ['All'];
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();
        
        const expenseTxs = transactions.filter(tx => {
            if (tx.amount <= 0 || !tx.date) return false;
            const [y, m] = tx.date.split('-');
            const catLower = (tx.category || '').toLowerCase();
            const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
            if (catLower.includes('transfer') || merchant.includes('transfer') || merchant.includes('sofi money')) return false;

            return parseInt(y) === currentY && (parseInt(m) - 1) === currentM;
        });
        
        if (expenseTxs.length === 0) return ['All'];
        const cats = new Set(expenseTxs.map(tx => tx.category ? tx.category.trim() : 'Uncategorized'));
        return ['All', ...cats].sort();
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();

        const expenseTxs = transactions.filter(tx => {
            if (tx.amount <= 0 || !tx.date) return false;
            const [y, m] = tx.date.split('-');
            const catLower = (tx.category || '').toLowerCase();
            const merchant = (tx.merchant_name || tx.name || '').toLowerCase();
            if (catLower.includes('transfer') || merchant.includes('transfer') || merchant.includes('sofi money')) return false;

            return parseInt(y) === currentY && (parseInt(m) - 1) === currentM;
        });
        
        if (activityCategoryFilter === 'All') return expenseTxs;

        if (activityCategoryFilter.startsWith('PSEUDO_')) {
            return expenseTxs.filter(tx => detectPseudoCategory(tx) === activityCategoryFilter);
        }

        return expenseTxs.filter(tx => (tx.category ? tx.category.trim() : 'Uncategorized') === activityCategoryFilter);
    }, [transactions, activityCategoryFilter]);

    const activityTotalPages = Math.ceil(filteredTransactions.length / activityItemsPerPage);
    const paginatedTransactions = filteredTransactions.slice((activityPage - 1) * activityItemsPerPage, activityPage * activityItemsPerPage);

    const filteredTotalAmount = useMemo(() => {
        return filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }, [filteredTransactions]);

    const recentMerchants = useRecentMerchants(transactions);

    const computedFixedExpenses = useMemo(() => {
        if (!transactions || !fixedExpenses) return fixedExpenses || [];
        
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();
        
        const thisMonthMerchants = [];
        transactions.forEach(tx => {
            if (tx.amount <= 0 || !tx.date) return;
            const [y, m] = tx.date.split('-');
            
            // STRICTLY bind matched expenses to the current calendar month so they reset at exactly 11:59PM on the last day!
            if (parseInt(y) === currentY && (parseInt(m) - 1) === currentM) {
                const merchantName = (tx.merchant_name || tx.name || '').trim();
                if (merchantName) thisMonthMerchants.push(merchantName.toLowerCase());
            }
        });

        return fixedExpenses.map(exp => {
            if (exp.apiId) {
                const searchTag = exp.apiId.toLowerCase();
                // Fuzzy Match: Check if any transaction merchant contains the typed tag, or the tag contains the merchant string
                const isPaid = thisMonthMerchants.some(m => m.includes(searchTag) || searchTag.includes(m));
                if (isPaid) {
                    return { ...exp, isPaid: true, autoPaid: true };
                }
            }
            return exp;
        });
    }, [fixedExpenses, transactions]);

    // --- Debt Destroyer State & Handlers ---
    const [strategy, setStrategy] = useState('avalanche');

    // Tracker aggregate metrics
    const totalTrackedDebtBalance = (trackedDebts || []).reduce((sum, d) => sum + (Number(d.balance) || 0), 0);

    const [showCustomPaymentModal, setShowCustomPaymentModal] = useState(false);
    const [customPaymentData, setCustomPaymentData] = useState({ debtId: null, monthIndex: null, monthLabel: '', currentAmount: '', isBlackedOut: false, amount: '' });

    const handleCustomPaymentSubmit = () => {
        if (!customPaymentData.amount || isNaN(customPaymentData.amount)) return;
        const newAmount = Number(customPaymentData.amount);
        
        const debt = trackedDebts.find(d => String(d.id) === String(customPaymentData.debtId));
        if (!debt) return;

        const customPayments = debt.customPayments ? { ...debt.customPayments } : {};
        customPayments[customPaymentData.monthIndex] = newAmount;

        let newBalance = debt.balance;
        let newPaidCircles = [...(debt.paidCircles || [])];

        if (!customPaymentData.isBlackedOut) {
            newBalance = Math.max(0, debt.balance - newAmount);
            newPaidCircles.push(customPaymentData.monthIndex);
            playCheck();
        } else {
            const oldAmount = debt.customPayments?.[customPaymentData.monthIndex] || customPaymentData.currentAmount;
            const diff = newAmount - oldAmount;
            newBalance = Math.max(0, debt.balance - diff);
        }

        handleEditTrackedDebt(debt.id, {
            balance: newBalance,
            paidCircles: newPaidCircles,
            customPayments: customPayments,
            ...(newBalance === 0 ? { isPaid: true } : {})
        });
        
        setShowCustomPaymentModal(false);
    };

    const pressTimerRef = React.useRef(null);
    const isLongPressActive = React.useRef(false);

    const [showAddTrackerForm, setShowAddTrackerForm] = useState(false);
    const [newTrackedDebt, setNewTrackedDebt] = useState({ name: '', type: 'Credit Card', balance: '', rate: '', minPayment: '', downPayment: '', dueDate: '' });
    const [justPaidId, setJustPaidId] = useState(null);
    const [editingDebtId, setEditingDebtId] = useState(null);
    const [editDebtForm, setEditDebtForm] = useState({ name: '', type: '', balance: '', rate: '', minPayment: '', dueDate: '' });

    const startEditingDebt = (debt) => {
        setEditingDebtId(debt.id);
        setEditDebtForm({
            name: debt.name,
            type: debt.type || 'Credit Card',
            balance: debt.balance.toString(),
            rate: debt.interestRate?.toString() || '',
            minPayment: debt.minimumPayment.toString(),
            dueDate: debt.dueDate || ''
        });
    };

    const saveDebtEdit = (id) => {
        if (editDebtForm.name && editDebtForm.balance && editDebtForm.rate && editDebtForm.minPayment) {
            handleEditTrackedDebt(id, {
                name: editDebtForm.name,
                type: editDebtForm.type,
                balance: Number(editDebtForm.balance),
                interestRate: Number(editDebtForm.rate),
                minimumPayment: Number(editDebtForm.minPayment),
                dueDate: editDebtForm.dueDate
            });
        }
        setEditingDebtId(null);
    };

    const handleEditTrackedDebt = (id, updatedFields) => {
        if (updatedFields.isPaid) {
            setJustPaidId(id);
            addXP(100, 'Monthly Debt Paid');
            setTimeout(() => setJustPaidId(null), 600);
        }
        setTrackedDebts(prev => prev.map(d => String(d.id) === String(id) ? { ...d, ...updatedFields } : d));
    };

    const handleExtraPaymentChange = (id, amount) => {
        handleEditTrackedDebt(id, { extraPayment: Number(amount) });
    };

    const calculatePayoffDetails = (balance, rate, payment) => {
        if (!payment || payment <= 0 || balance <= 0) return { dateStr: 'N/A', months: 0, totalInterest: 0 };
        const r = (rate || 0) / 100 / 12; 
        
        if (r * balance >= payment) return { dateStr: 'Payment too low', months: Infinity, totalInterest: Infinity };
        
        let months;
        let totalInterest = 0;
        
        if (r === 0) {
            months = balance / payment;
        } else {
            months = -Math.log(1 - (r * balance) / payment) / Math.log(1 + r);
            totalInterest = (payment * months) - balance;
        }
        
        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(months));
        
        return { 
            dateStr: payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            months: Math.ceil(months),
            totalInterest: Math.max(0, totalInterest)
        };
    };

    const handleAddTrackedDebt = (e) => {
        e.preventDefault();
        if (newTrackedDebt.name && newTrackedDebt.balance && newTrackedDebt.rate && newTrackedDebt.minPayment) {
            const initialBalance = Number(newTrackedDebt.balance);
            const downPaymentAmount = Number(newTrackedDebt.downPayment) || 0;
            const startingBalance = Math.max(0, initialBalance - downPaymentAmount);

            setTrackedDebts(prev => [...prev, {
                id: crypto.randomUUID(),
                name: newTrackedDebt.name,
                type: newTrackedDebt.type,
                balance: startingBalance,
                interestRate: Number(newTrackedDebt.rate),
                minimumPayment: Number(newTrackedDebt.minPayment),
                downPayment: downPaymentAmount,
                dueDate: newTrackedDebt.dueDate,
                isPaid: false,
                extraPayment: 0,
                paidCircles: [],
                customPayments: {}
            }]);
            setNewTrackedDebt({ name: '', type: 'Credit Card', balance: '', rate: '', minPayment: '', downPayment: '', dueDate: '' });
            setShowAddTrackerForm(false);
        }
    };
    
    const handleRemoveTrackedDebt = (id) => {
        setTrackedDebts(prev => prev.filter(d => String(d.id) !== String(id)));
    };

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
    const activeSubscriptions = useMemo(() => {
        if (!transactions || !subscriptions) return subscriptions || [];
        
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();
        
        const thisMonthSubscriptionMerchants = [];
        transactions.forEach(tx => {
            if (tx.amount <= 0 || !tx.date) return;
            const [y, m] = tx.date.split('-');
            
            if (parseInt(y) === currentY && (parseInt(m) - 1) === currentM) {
                if (detectPseudoCategory(tx) === 'PSEUDO_SUBSCRIPTIONS') {
                    const merchantName = (tx.merchant_name || tx.name || '').trim();
                    if (merchantName) thisMonthSubscriptionMerchants.push(merchantName.toLowerCase());
                }
            }
        });

        return (subscriptions || []).map(sub => {
            const searchTag = sub.name.toLowerCase();
            const isPaid = thisMonthSubscriptionMerchants.some(m => m.includes(searchTag) || searchTag.includes(m));
            if (isPaid) {
                return { ...sub, isPaid: true };
            }
            return sub;
        });
    }, [subscriptions, transactions]);
    const [showAddSub, setShowAddSub] = useState(false);
    const [newSub, setNewSub] = useState({ name: '', cost: '', domain: '', dueDate: '' });

    const toggleSubscription = (sub) => {
        playPop();
        const prev = subscriptions || [];
        const exists = prev.find(s => s.name === sub.name);
        if (exists) {
            setSubscriptions(prev.filter(s => s.name !== sub.name));
        } else {
            setSubscriptions([...prev, { ...sub, id: crypto.randomUUID() }]);
        }
    };

    const addCustomSubscription = (e) => {
        e.preventDefault();
        if (newSub.name && newSub.cost) {
            const prev = subscriptions || [];
            if (editingSubId) {
                setSubscriptions(prev.map(s => String(s.id) === String(editingSubId) ? { 
                    ...s, 
                    name: newSub.name, 
                    domain: newSub.domain,
                    cost: parseFloat(newSub.cost), 
                    dueDate: newSub.dueDate || null 
                } : s));
            } else {
                const custom = {
                    id: crypto.randomUUID(),
                    name: newSub.name,
                    domain: newSub.domain || `${newSub.name.toLowerCase().replace(/\s+/g, '')}.com`,
                    cost: parseFloat(newSub.cost),
                    dueDate: newSub.dueDate || null
                };
                setSubscriptions([...prev, custom]);
            }
            setNewSub({ name: '', cost: '', domain: '', dueDate: '' });
            setShowAddSub(false);
            setEditingSubId(null);
        }
    };

    const removeSubscription = (id) => {
        playPop();
        const prev = subscriptions || [];
        setSubscriptions(prev.filter(s => String(s.id) !== String(id)));
    };

    const [editingSubId, setEditingSubId] = useState(null);
    const [editSubName, setEditSubName] = useState('');
    const [editSubCost, setEditSubCost] = useState('');
    const [editSubDueDate, setEditSubDueDate] = useState('');

    const startEditingSub = (sub) => {
        setEditingSubId(sub.id);
        setEditSubName(sub.name);
        setEditSubCost(sub.cost.toString());
        setEditSubDueDate(sub.dueDate || '');
    };

    const saveSubEdit = (id) => {
        if (editSubName && editSubCost) {
            const prev = subscriptions || [];
            setSubscriptions(prev.map(s => String(s.id) === String(id) ? { ...s, name: editSubName, cost: parseFloat(editSubCost), dueDate: editSubDueDate || null } : s));
        }
        setEditingSubId(null);
    };


    // Projection Engine
    const projectionData = useMemo(() => {
        if (!trackedDebts || trackedDebts.length === 0) return { data: [], totalInterest: 0, monthsToZero: 0 };

        // Clone debts for simulation
        let simDebts = (trackedDebts || []).map(d => ({ ...d }));
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

            let monthInterest = 0;

            // First pass: apply minimum payments and interest
            simDebts.forEach(d => {
                if (d.balance > 0) {
                    const monthlyInterest = d.balance * (d.interestRate / 100 / 12);
                    monthInterest += monthlyInterest;
                    d.balance += monthlyInterest; // add interest

                    // The minimum payment is applied FIRST
                    let payment = Math.min(d.balance, d.minimumPayment);
                    d.balance -= payment;
                }
            });

            // Second pass: apply the individual extra payments assigned to each debt
            simDebts.forEach(d => {
                const individualExtra = d.extraPayment || 0;
                if (d.balance > 0 && individualExtra > 0) {
                    let extraToApply = Math.min(d.balance, individualExtra);
                    d.balance -= extraToApply;
                }
            });

            // Third pass (Avalanche/Snowball Strategy): If any debt was paid off from minimums + individual extras this month, 
            // the money you WERE paying towards it (the "snowball" amount) now needs to be applied to the highest priority debt.
            // Calculate total money we normally spend across all *tracked* debts
            const originalTotalMonthlyCommitment = (trackedDebts || []).reduce((sum, d) => sum + d.minimumPayment + (Number(d.extraPayment) || 0), 0);
            
            // Calculate how much we actually spent this month on remaining debts
            const actualSpentThisMonth = simDebts.reduce((sum, d) => {
                if (d.balance > 0) {
                   return sum + Math.min(d.balance, d.minimumPayment + (Number(d.extraPayment) || 0));
                }
                return sum;
            }, 0);

            // Any difference is the "free" money from paid-off debts that we can now throw at the #1 target
            let remainingSnowballAmmount = originalTotalMonthlyCommitment - actualSpentThisMonth;

            for (let i = 0; i < simDebts.length; i++) {
                if (remainingSnowballAmmount <= 0) break;
                if (simDebts[i].balance > 0) {
                    let extremeExtra = Math.min(simDebts[i].balance, remainingSnowballAmmount);
                    simDebts[i].balance -= extremeExtra;
                    remainingSnowballAmmount -= extremeExtra;
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
    }, [trackedDebts, strategy]);
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
                <img src="/expenses-header-logo.png" alt="Expenses Header Logo" className="page-header-logo" style={{ height: '336px', objectFit: 'contain' }} loading="lazy" />
                <p className="page-subtitle">Track and optimize your outflows.</p>
            </div>

            <div className="expense-metrics-grid">
                <AnimateOnScroll delay={0.1}>
                    <Card glass className={`metric-box warning-border ${borderGlowClass}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div className="metric-header" style={{ justifyContent: 'center', gap: '8px' }}>
                            <span className="metric-title">Total Monthly Expenses</span>
                            <TrendingDown size={20} className="text-danger" />
                        </div>
                        <h2 className="metric-value" style={{ color: 'var(--danger)' }}>
                            $<AnimatedNumber value={totalMonthlyExpenses} />
                        </h2>
                        <div className="metric-breakdown" style={{ justifyContent: 'center', color: theme === 'dark' ? '#ffffff' : '#000000' }}>
                            <span>Fixed: ${totalFixedExpenses.toLocaleString()}</span>
                            <span>Var: ${totalVariableExpenses.toLocaleString()}</span>
                            <span>Subs: ${totalSubscriptionCost.toFixed(0)}</span>
                            <span>Debt: ${totalTrackedMonthlyPayments.toLocaleString()}</span>
                        </div>
                    </Card>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.2}>
                    <Card glass className={`metric-box success-border ${borderGlowClass}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div className="metric-header" style={{ justifyContent: 'center', gap: '8px' }}>
                            <span className="metric-title">Net Cash Flow</span>
                            <Wallet size={20} className="text-success" />
                        </div>
                        <h2 className="metric-value" style={{ color: netMonthlyCashFlow < 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {netMonthlyCashFlow < 0 ? '-' : ''}$<AnimatedNumber value={Math.abs(netMonthlyCashFlow)} />
                        </h2>
                        <p className="metric-subtext" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>Remaining for allocation</p>
                    </Card>
                </AnimateOnScroll>

                <AnimateOnScroll delay={0.3}>
                    <Card glass className={`metric-box highlight-border ${borderGlowClass}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div className="metric-header" style={{ justifyContent: 'center', gap: '8px' }}>
                            <span className="metric-title">Savings Rate</span>
                            <Percent size={20} className="text-primary" />
                        </div>
                        <h2 className="metric-value" style={{ color: 'var(--warning)', textShadow: '0 0 16px rgba(245, 158, 11, 0.6)' }}>
                            <AnimatedNumber value={parseFloat(savingsRate)} />%
                        </h2>
                        <p className="metric-subtext" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>Target: {'>'}20%</p>
                    </Card>
                </AnimateOnScroll>
            </div>

            <div className="expense-content-grid">
                {/* Fixed Expenses */}
                <AnimateOnScroll delay={0.1} className="expense-column fixed-expense-box">
                    <div className="column-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <h2 style={{ margin: 0 }}>Fixed Expenses</h2>
                            <span className="badge danger-badge" style={{ marginLeft: '4px' }}>${totalFixedExpenses.toLocaleString()}</span>
                            {(() => {
                                const paid = computedFixedExpenses.filter(e => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
                                const left = totalFixedExpenses - paid;
                                return (
                                    <>
                                        <span className="badge" style={{ background: 'var(--surface-hover)', color: '#000000', border: '1px solid var(--surface-border)' }}>
                                            Paid: ${paid.toLocaleString()}
                                        </span>
                                        <span className="badge success-badge">
                                            Left: ${left.toLocaleString()}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                if (playPop) playPop();
                                setIsFixedModalOpen(true);
                            }}
                            style={{ height: '32px', padding: '6px 14px', marginLeft: '12px', border: '1px solid var(--surface-border)' }}
                        >
                            <Plus size={16} style={{ marginRight: '6px' }} />
                            Add Bill
                        </Button>
                    </div>

                    <Modal 
                        isOpen={isFixedModalOpen} 
                        onClose={() => setIsFixedModalOpen(false)}
                        useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                        clearBlur={true}
                        transparentOverlay={true}
                        customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                        containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                        title={(() => {
                            const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Home size={20} color={activeColor} /> 
                                    <span style={{ color: activeColor }}>Add Fixed Expense</span>
                                </div>
                            );
                        })()}
                    >
                        <ExpenseForm
                            onAdd={(exp) => { addFixed(exp); setIsFixedModalOpen(false); }}
                            title=""
                            placeholder="e.g. Rent, Mortgage, Insurance"
                            isModal={true}
                            recentMerchants={recentMerchants}
                        />
                    </Modal>

                    <ExpenseList
                        expenses={computedFixedExpenses}
                        onRemove={removeFixed}
                        onEdit={editFixed}
                        emptyMessage="No fixed expenses added."
                    />
                </AnimateOnScroll>

                {/* Variable Expenses */}
                <AnimateOnScroll delay={0.2} className="expense-column variable-expense-box">
                    <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Variable Expenses</h2>
                            <span className="badge warning-badge" style={{ marginLeft: '12px' }}>
                                Budget: ${totalVariableExpenses.toLocaleString()}
                            </span>
                            <span className="badge" style={{ marginLeft: '8px', background: 'var(--surface-hover)', color: '#000000', border: '1px solid var(--surface-border)' }}>
                                Spent: ${variableExpenses.reduce((sum, exp) => sum + (exp.manualSpent != null ? Number(exp.manualSpent) : (Number(transactionsByCategory[exp.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(exp.name) : exp.name)]) || 0)), 0).toLocaleString()}
                            </span>
                            {(() => {
                                const spent = variableExpenses.reduce((sum, exp) => sum + (exp.manualSpent != null ? Number(exp.manualSpent) : (Number(transactionsByCategory[exp.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(exp.name) : exp.name)]) || 0)), 0);
                                const left = totalVariableExpenses - spent;
                                const isNegative = left < 0;
                                const isWarning = left > 0 && left <= (totalVariableExpenses * 0.1);
                                const badgeClass = isNegative ? 'danger-badge' : isWarning ? 'warning-badge' : 'success-badge';
                                
                                return (
                                    <span className={`badge ${badgeClass}`} style={{ marginLeft: '8px' }}>
                                        Left: ${left.toLocaleString()}
                                    </span>
                                );
                            })()}
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
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        border: `1px solid ${activeColor}`,
                                        color: activeColor === '#ffffff' ? 'var(--text-primary)' : activeColor,
                                        boxShadow: `0 0 10px ${activeColor}33`
                                    } : {})
                                }}
                            >
                                <Activity size={16} style={{ marginRight: '6px' }} />
                                Activity
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    if (playPop) playPop();
                                    setIsVariableModalOpen(true);
                                }}
                                style={{ height: '32px', padding: '6px 14px', border: '1px solid var(--surface-border)' }}
                            >
                                <Plus size={16} style={{ marginRight: '6px' }} />
                                Add expense
                            </Button>
                        </div>
                    </div>

                    <Modal 
                        isOpen={isVariableModalOpen} 
                        onClose={() => setIsVariableModalOpen(false)}
                        useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                        clearBlur={true}
                        transparentOverlay={true}
                        customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                        containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                        title={(() => {
                            const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={20} color={activeColor} /> 
                                    <span style={{ color: activeColor }}>Add Variable Expense</span>
                                </div>
                            );
                        })()}
                    >
                        <ExpenseForm 
                            onAdd={(exp) => { playCheck(); addVariable(exp); setIsVariableModalOpen(false); }} 
                            title="" 
                            showDueDate={false} 
                            showCategory={true}
                            uniqueCategories={uniqueCategories.filter(c => c !== 'All' && !c.includes('PSEUDO_'))}
                            isModal={true}
                        />
                    </Modal>

                    <ExpenseList
                        expenses={variableExpenses}
                        onRemove={removeVariable}
                        onEdit={editVariable}
                        emptyMessage="No variable expenses added."
                        showTracking={true}
                        transactionsByCategory={transactionsByCategory}
                        mapUserExpenseToPlaidCategory={mapUserExpenseToPlaidCategory}
                        showDueDate={false}
                    />
                </AnimateOnScroll>
            </div>

            {/* Subscriptions Section */}
            <AnimateOnScroll yOffset={40} delay={0.1} className="subscription-box">
                <Card glass className={borderGlowClass} style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <h2 style={{ margin: 0 }}>Subscriptions</h2>
                            <span className="badge danger-badge" style={{ marginLeft: '4px' }}>${totalSubscriptionCost.toFixed(2)}/mo</span>
                            {(() => {
                                const paid = (activeSubscriptions || []).filter(sub => sub.isPaid).reduce((sum, sub) => sum + Number(sub.cost), 0);
                                const left = totalSubscriptionCost - paid;
                                return (
                                    <>
                                        <span className="badge" style={{ background: 'var(--surface-hover)', color: '#000000', border: '1px solid var(--surface-border)' }}>
                                            Paid: ${paid.toFixed(2)}
                                        </span>
                                        <span className="badge success-badge">
                                            Left: ${left.toFixed(2)}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => { playPop(); setShowAddSub(!showAddSub); }}
                            style={activeColor ? { 
                                background: activeColor, 
                                borderColor: activeColor, 
                                color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                            } : {}}
                        >
                            {showAddSub ? 'Cancel' : <><Plus size={16} /> Custom</>}
                        </Button>
                    </div>

                    <Modal
                        isOpen={showAddSub}
                        onClose={() => { setShowAddSub(false); setEditingSubId(null); setNewSub({ name: '', cost: '', domain: '', dueDate: '' }); }}
                        silent={true}
                        useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                        clearBlur={true}
                        transparentOverlay={true}
                        customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                        containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                        title={(() => {
                            const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                                    {editingSubId ? 'Edit' : 'Add'} <span style={{ color: activeColor }}>{editingSubId ? 'Subscription' : 'Custom Subscription'}</span>
                                </div>
                            );
                        })()}
                    >
                        <form onSubmit={addCustomSubscription} className="debt-form animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Service Name</label>
                                    <Input 
                                        className="dark-mode-black-text"
                                        placeholder="e.g. Netflix, Spotify" 
                                        value={newSub.name} 
                                        onChange={e => setNewSub({ ...newSub, name: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Monthly Cost</label>
                                        <CurrencyInput 
                                            className="dark-mode-black-text"
                                            placeholder="0.00" 
                                            value={newSub.cost} 
                                            onChange={e => setNewSub({ ...newSub, cost: e.target.value })} 
                                            required 
                                            icon={<DollarSign size={16} />}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Domain (Optional)</label>
                                        <Input 
                                            className="dark-mode-black-text"
                                            placeholder="e.g. netflix.com" 
                                            value={newSub.domain} 
                                            onChange={e => setNewSub({ ...newSub, domain: e.target.value })} 
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Due Day (Optional)</label>
                                        <Input 
                                            className="dark-mode-black-text"
                                            type="number" min="1" max="31"
                                            placeholder="1-31" 
                                            value={newSub.dueDate} 
                                            onChange={e => setNewSub({ ...newSub, dueDate: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px', padding: '14px', borderRadius: '12px', background: activeColor || 'var(--accent-gradient)', border: 'none', color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : '#fff', fontWeight: 600, fontSize: '1rem', boxShadow: activeColor ? `0 4px 12px ${activeColor}4d` : '0 4px 12px rgba(0, 150, 255, 0.3)' }}>
                                {editingSubId ? <><Save size={20} style={{ marginRight: '8px' }}/> Save Changes</> : <><Plus size={20} style={{ marginRight: '8px' }}/> Add Subscription</>}
                            </Button>
                        </form>
                    </Modal>

                    {/* Common Subscriptions Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginBottom: activeSubscriptions.length > 0 ? '24px' : '0' }}>
                        {COMMON_SUBSCRIPTIONS.filter(s => !activeSubscriptions.find(a => a.name === s.name)).map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => toggleSubscription(sub)}
                                    className="stream-item glass"
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        padding: '16px 8px', cursor: 'pointer',
                                        border: '1px dashed var(--surface-border)', background: 'transparent',
                                        opacity: 0.5
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderStyle = 'solid'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.borderStyle = 'dashed'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
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
                                        onDoubleClick={() => {
                                            playPop();
                                            setEditingSubId(sub.id);
                                            setNewSub({ name: sub.name, cost: sub.cost, dueDate: sub.dueDate || '', domain: sub.domain || '' });
                                            setShowAddSub(true);
                                        }}
                                        className={`stream-item ${sub.isPaid ? 'paid' : ''} glass`}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px 8px', position: 'relative',
                                            cursor: 'pointer',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {sub.isPaid && (
                                            <div style={{ position: 'absolute', inset: 0, background: activeColor ? activeColor + '80' : 'rgba(46, 204, 113, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                <span style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '4px', textShadow: '0 2px 10px rgba(0,0,0,0.5)', border: '2px solid white', padding: '4px 12px', borderRadius: '6px' }}>PAID</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSubscription(sub.id); }}
                                            style={{ position: 'absolute', top: '4px', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '0.7rem', zIndex: 20 }}
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
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {sub.name}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: sub.isPaid ? (activeColor || 'var(--success)') : 'var(--danger)', fontWeight: 700, marginTop: '4px' }}>${sub.cost.toFixed(2)}</span>
                                        {sub.dueDate && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Due: {sub.dueDate}{[11, 12, 13].includes(Number(sub.dueDate)) ? 'th' : (['st', 'nd', 'rd'][(Number(sub.dueDate) % 10) - 1] || 'th')}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </AnimateOnScroll>

            {/* Monthly Debt Tracker Section (Standalone) */}
            <div style={{ marginTop: '40px', width: '100vw', marginLeft: 'calc(-50vw + 50%)', padding: '0 24px', boxSizing: 'border-box' }}>
                <AnimateOnScroll delay={0.1}>
                    <Card glass className={`debt-tracker-card ${borderGlowClass}`} style={{ height: '100%' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'bold' }}>
                                        Monthly Debt Tracker
                                    </h2>
                                    {(trackedDebts || []).length > 0 && (() => {
                                        const paid = (trackedDebts || []).filter(d => d.isPaid || (d.paidCircles && d.paidCircles.includes(0))).reduce((sum, d) => sum + (d.minimumPayment || 0) + (d.extraPayment || 0), 0);
                                        const left = totalTrackedMonthlyPayments - paid;
                                        return (
                                            <>
                                                <span className="badge" style={{ background: 'var(--surface-hover)', color: '#000000', border: '1px solid var(--surface-border)', marginLeft: '4px' }}>
                                                    Paid: ${paid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </span>
                                                <span className="badge success-badge">
                                                    Left: ${Math.max(0, left).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                                {(trackedDebts || []).length > 0 ? (
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <strong>Total Debt:</strong> ${totalTrackedDebtBalance.toLocaleString()}
                                        </span>
                                        <span style={{ color: 'var(--surface-border)' }}>|</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <strong>Monthly Min:</strong> ${totalTrackedMonthlyPayments.toLocaleString()}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                        Track minimum payments, due dates, and mark bills as paid for the month.
                                    </p>
                                )}
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => { playPop(); setShowAddTrackerForm(true); }}
                                style={activeColor ? { 
                                    background: activeColor, 
                                    borderColor: activeColor, 
                                    color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                                } : {}}
                            >
                                <Plus size={16} /> Add Tracker
                            </Button>
                        </div>

                        <Modal
                            isOpen={showAddTrackerForm}
                            onClose={() => setShowAddTrackerForm(false)}
                            silent={true}
                            useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                            clearBlur={true}
                            transparentOverlay={true}
                            customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                            containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                            title={(() => {
                                const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                                        Track <span style={{ color: activeColor }}>New Debt</span>
                                    </div>
                                );
                            })()}
                        >
                            <form className="debt-form animate-fade-in" onSubmit={handleAddTrackedDebt} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Name and Type Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Debt Name / Creditor</label>
                                            <Input
                                                className="light-accent-input"
                                                placeholder="e.g. Chase Sapphire"
                                                value={newTrackedDebt.name}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Category</label>
                                            <select 
                                                value={newTrackedDebt.type}
                                                onChange={e => setNewTrackedDebt({...newTrackedDebt, type: e.target.value})}
                                                className="dream-input light-accent-input"
                                                style={{ width: '100%', backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid transparent', borderRadius: '50px', padding: '12px 16px', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="Auto Loan">Auto Loan</option>
                                                <option value="Student Loan">Student Loan</option>
                                                <option value="Personal Loan">Personal</option>
                                                <option value="Mortgage">Mortgage</option>
                                                <option value="Medical">Medical</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'var(--surface-border)', opacity: 0.5, margin: '4px 0' }}></div>

                                    {/* Numbers Row 1 */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Total Balance</label>
                                            <CurrencyInput
                                                className="light-accent-input"
                                                leftIcon={Wallet}
                                                placeholder="0.00"
                                                value={newTrackedDebt.balance}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, balance: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Interest Rate</label>
                                            <Input
                                                className="light-accent-input"
                                                leftIcon={Percent}
                                                type="number" step="0.01"
                                                placeholder="0.00"
                                                value={newTrackedDebt.rate}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, rate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Numbers Row 2 */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Monthly Min</label>
                                            <CurrencyInput
                                                className="light-accent-input"
                                                placeholder="$"
                                                value={newTrackedDebt.minPayment}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, minPayment: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Down Payment</label>
                                            <CurrencyInput
                                                className="light-accent-input"
                                                placeholder="$ (Opt)"
                                                value={newTrackedDebt.downPayment || ''}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, downPayment: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Due Date</label>
                                            <Input
                                                className="light-accent-input"
                                                type="number" min="1" max="31"
                                                placeholder="Day (1-31)"
                                                value={newTrackedDebt.dueDate}
                                                onChange={e => setNewTrackedDebt({ ...newTrackedDebt, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                                    <Button type="button" variant="secondary" onClick={() => setShowAddTrackerForm(false)} style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}>Cancel</Button>
                                    <Button type="submit" variant="primary" style={{ padding: '0 24px', background: activeColor || 'var(--accent-gradient)', border: 'none', color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : '#fff', boxShadow: activeColor ? `0 4px 12px ${activeColor}4d` : 'none' }}>Add Debt Pipeline</Button>
                                </div>
                            </form>
                        </Modal>

                        <Modal
                            isOpen={editingDebtId !== null}
                            onClose={() => setEditingDebtId(null)}
                            silent={true}
                            useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                            clearBlur={true}
                            transparentOverlay={true}
                            customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                            containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                            title={(() => {
                                const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                                        Edit <span style={{ color: activeColor }}>Tracked Debt</span>
                                    </div>
                                );
                            })()}
                        >
                            <form className="debt-form animate-fade-in" onSubmit={(e) => { e.preventDefault(); saveDebtEdit(editingDebtId); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Debt Name / Creditor</label>
                                            <Input
                                                className="light-accent-input dark-mode-black-text"
                                                placeholder="e.g. Chase Sapphire"
                                                value={editDebtForm.name}
                                                onChange={e => setEditDebtForm({ ...editDebtForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Category</label>
                                            <select 
                                                value={editDebtForm.type}
                                                onChange={e => setEditDebtForm({...editDebtForm, type: e.target.value})}
                                                className="dream-input light-accent-input dark-mode-black-text"
                                                style={{ width: '100%', backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid transparent', borderRadius: '50px', padding: '12px 16px', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="Auto Loan">Auto Loan</option>
                                                <option value="Student Loan">Student Loan</option>
                                                <option value="Personal Loan">Personal Loan</option>
                                                <option value="Mortgage">Mortgage</option>
                                                <option value="Medical">Medical</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'var(--surface-border)', opacity: 0.5, margin: '4px 0' }}></div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Total Balance</label>
                                            <CurrencyInput
                                                className="light-accent-input dark-mode-black-text"
                                                leftIcon={Wallet}
                                                placeholder="0.00"
                                                value={editDebtForm.balance}
                                                onChange={e => setEditDebtForm({ ...editDebtForm, balance: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Interest Rate</label>
                                            <Input
                                                className="light-accent-input dark-mode-black-text"
                                                leftIcon={Percent}
                                                type="number" step="0.01"
                                                placeholder="0.00"
                                                value={editDebtForm.rate}
                                                onChange={e => setEditDebtForm({ ...editDebtForm, rate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Monthly Min</label>
                                            <CurrencyInput
                                                className="light-accent-input dark-mode-black-text"
                                                placeholder="$"
                                                value={editDebtForm.minPayment}
                                                onChange={e => setEditDebtForm({ ...editDebtForm, minPayment: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>Due Date</label>
                                            <Input
                                                className="light-accent-input dark-mode-black-text"
                                                type="number" min="1" max="31"
                                                placeholder="Day (1-31)"
                                                value={editDebtForm.dueDate}
                                                onChange={e => setEditDebtForm({ ...editDebtForm, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                                    <Button type="button" variant="secondary" onClick={() => setEditingDebtId(null)} style={{ background: 'transparent', border: '1px solid var(--surface-border)' }}>Cancel</Button>
                                    <Button type="submit" variant="primary" style={{ padding: '0 24px', background: activeColor || 'var(--accent-gradient)', border: 'none', color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : '#fff', boxShadow: activeColor ? `0 4px 12px ${activeColor}4d` : 'none' }}>Save Changes</Button>
                                </div>
                            </form>
                        </Modal>

                        <div className="debts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {(trackedDebts || []).length === 0 ? (
                                <div className="empty-state" style={{ padding: '32px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--surface-border)' }}>
                                    <Flame size={32} style={{ color: 'var(--surface-border)', marginBottom: '8px', margin: '0 auto' }} />
                                    <p className="text-muted" style={{ margin: 0, fontWeight: 500 }}>No debts tracked yet.</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Add a debt above to start tracking payments.</p>
                                </div>
                            ) : (
                                (() => {
                                    // Calculate urgency & sort
                                    const today = new Date();
                                    const currentDay = today.getDate();
                                    
                                    const sortedDebts = [...(trackedDebts || [])].sort((a, b) => {
                                        const aPaidThisMonth = a.isPaid || (a.paidCircles && a.paidCircles.includes(0));
                                        const bPaidThisMonth = b.isPaid || (b.paidCircles && b.paidCircles.includes(0));

                                        // 1. Paid items always go to the very bottom
                                        if (aPaidThisMonth !== bPaidThisMonth) return aPaidThisMonth ? 1 : -1;
                                        
                                        // 2. Sort unpaid items by due date urgency
                                        const dueA = Number(a.dueDate) || 31;
                                        const dueB = Number(b.dueDate) || 31;
                                        
                                        let diffA = dueA - currentDay;
                                        let diffB = dueB - currentDay;
                                        
                                        // If due date has passed this month and wasn't paid, it's overdue (-)
                                        // Treat next month's dates as +30 days
                                        if (diffA < -5) diffA += 30; // Due early in the month, currently end of month
                                        if (diffB < -5) diffB += 30;
                                        
                                        return diffA - diffB;
                                    });

                                    const getIconForType = (type) => {
                                        switch(type) {
                                            case 'Auto Loan': return <Car size={14} />;
                                            case 'Mortgage': return <Home size={14} />;
                                            case 'Student Loan': return <GraduationCap size={14} />;
                                            case 'Medical': return <HeartPulse size={14} />;
                                            default: return <CreditCard size={14} />;
                                        }
                                    };

                                    return sortedDebts.map(debt => {
                                        let urgencyClass = 'badge';
                                        let statusText = debt.dueDate ? `Due: ${debt.dueDate}` : 'No due date';
                                        const isPaidForThisMonth = debt.paidCircles && debt.paidCircles.includes(0);
                                        
                                        if (debt.isPaid) {
                                            urgencyClass = 'badge success-badge';
                                            statusText = 'Paid Off';
                                        } else if (isPaidForThisMonth) {
                                            urgencyClass = 'badge success-badge';
                                            statusText = 'Paid';
                                        } else if (debt.dueDate) {
                                            const dueDay = Number(debt.dueDate);
                                            let diff = dueDay - currentDay;
                                            if (diff < -5) diff += 30; // Next month wrapping
                                            
                                            if (diff <= 3) {
                                                urgencyClass = 'badge danger-badge';
                                                statusText = diff < 0 ? `Overdue (${Math.abs(diff)}d)` : diff === 0 ? 'Due Today!' : `Due in ${diff}d`;
                                            } else if (diff <= 7) {
                                                urgencyClass = 'badge warning-badge';
                                                statusText = `Due in ${diff}d`;
                                            }
                                        }

                                        const extra = debt.extraPayment || 0;
                                        const totalPayment = debt.minimumPayment + extra;
                                        
                                        const basePayoff = calculatePayoffDetails(debt.balance, debt.interestRate, debt.minimumPayment);
                                        const newPayoff = calculatePayoffDetails(debt.balance, debt.interestRate, totalPayment);
                                        
                                        let savingsText = null;
                                        if (extra > 0 && basePayoff.months < Infinity && newPayoff.months < Infinity) {
                                            const monthsSaved = basePayoff.months - newPayoff.months;
                                            const interestSaved = basePayoff.totalInterest - newPayoff.totalInterest;
                                            if (monthsSaved > 0 || interestSaved > 0) {
                                                savingsText = `Saves ${monthsSaved > 0 ? monthsSaved + ' mos ' : ''}${monthsSaved > 0 && interestSaved > 0 ? '& ' : ''}${interestSaved > 0 ? '$' + Math.round(interestSaved).toLocaleString() : ''}!`;
                                            }
                                        }

                                        const payoffDateStr = newPayoff.dateStr;
                                        const isJustPaid = justPaidId === debt.id;

                                        const totalRemainingMonths = isFinite(newPayoff.months) ? newPayoff.months : 0;
                                        const displayMonths = Math.min(totalRemainingMonths + (debt.paidCircles?.length || 0), 360); // Total width includes paid ones
                                        
                                        const renderCircles = () => {
                                            if (displayMonths <= 0) return null;
                                            const circles = [];
                                            const currentMonth = new Date();
                                            const paidIndices = debt.paidCircles || [];

                                            for (let i = 0; i < displayMonths; i++) {
                                                const isBlackedOut = paidIndices.includes(i);
                                                
                                                const actualPaymentForMonth = debt.customPayments?.[i] || totalPayment;

                                                // Calculate the projected month for this circle
                                                const circleDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
                                                const monthLabel = circleDate.toLocaleString('default', { month: 'short' });

                                                circles.push(
                                                    <div key={i} className="payment-circle-wrapper">
                                                        <div 
                                                            onPointerDown={() => {
                                                                isLongPressActive.current = false;
                                                                pressTimerRef.current = setTimeout(() => {
                                                                    isLongPressActive.current = true;
                                                                    setCustomPaymentData({
                                                                        debtId: debt.id, monthIndex: i, monthLabel, currentAmount: totalPayment, isBlackedOut, amount: actualPaymentForMonth.toString()
                                                                    });
                                                                    setShowCustomPaymentModal(true);
                                                                }, 500);
                                                            }}
                                                            onPointerUp={() => {
                                                                if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                                            }}
                                                            onPointerLeave={() => {
                                                                if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                                                isLongPressActive.current = false;
                                                            }}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (isLongPressActive.current) return;
                                                                
                                                                if (isBlackedOut) {
                                                                    // Undo operation
                                                                    const undoBalance = debt.balance + actualPaymentForMonth;
                                                                    const newPaidCircles = paidIndices.filter(idx => idx !== i);
                                                                    const newCustomPayments = debt.customPayments ? { ...debt.customPayments } : {};
                                                                    delete newCustomPayments[i];
                                                                    
                                                                    handleEditTrackedDebt(debt.id, { 
                                                                        balance: undoBalance,
                                                                        paidCircles: newPaidCircles,
                                                                        customPayments: newCustomPayments,
                                                                        isPaid: false
                                                                    });
                                                                } else {
                                                                    playCheck();
                                                                    const newBalance = Math.max(0, debt.balance - actualPaymentForMonth);
                                                                    const newPaidCircles = [...paidIndices, i];
                                                                    
                                                                    handleEditTrackedDebt(debt.id, { 
                                                                        balance: newBalance,
                                                                        paidCircles: newPaidCircles,
                                                                        ...(newBalance === 0 ? { isPaid: true } : {})
                                                                    });
                                                                }
                                                            }}
                                                            className={`payment-circle ${isBlackedOut ? 'blacked-out' : ''}`}
                                                            title={isBlackedOut ? `Paid $${actualPaymentForMonth.toLocaleString()} in ${monthLabel} (Hold to edit amount)` : `Click to pay $${actualPaymentForMonth.toLocaleString()} for ${monthLabel} (Hold to edit amount)`}
                                                        />
                                                        <span className="payment-circle-month">{monthLabel}</span>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="payment-circles-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', maxWidth: '100%' }}>
                                                    {circles}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div key={debt.id} className={`debt-item glass stream-item ${debt.isPaid ? 'paid' : ''} ${isJustPaid ? 'just-paid' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', transition: 'all 0.3s ease' }} onDoubleClick={() => { if (playPop) playPop(); startEditingDebt(debt); }}>
                                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '16px' }}>
                                                    <div className="checkbox-wrapper" style={{ margin: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            className="expense-checkbox"
                                                            checked={debt.isPaid || false}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                if (isChecked) playCheck();
                                                                handleEditTrackedDebt(debt.id, { isPaid: isChecked });
                                                            }}
                                                            title={debt.isPaid ? "Mark as unpaid" : "Mark as paid this month"}
                                                            style={{ 
                                                                cursor: 'pointer',
                                                                width: '24px', 
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                border: debt.isPaid ? '2px solid var(--success)' : '2px solid var(--surface-border)'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="debt-info" style={{ opacity: debt.isPaid ? 0.6 : 1, transition: 'opacity 0.3s', flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <h3 className="stream-name" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                {debt.type ? getIconForType(debt.type) : <CreditCard size={14} />}
                                                                {debt.name}
                                                            </h3>
                                                            {debt.type && <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'transparent' }}>{debt.type}</span>}
                                                            <span className={urgencyClass} style={{ fontSize: '0.75rem', padding: '2px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                {debt.isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                                {statusText}
                                                            </span>
                                                        </div>
                                                        <div className="debt-stats stream-freq" style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                                            <span>Total: ${debt.balance.toLocaleString()}</span>
                                                            <span title="Projected Total Interest on Minimum Payment">Rate: {debt.interestRate}% <span style={{ color: 'var(--warning)', fontWeight: 500 }}>({isFinite(basePayoff.totalInterest) ? `$${Math.round(basePayoff.totalInterest).toLocaleString()} Int` : '∞ Int'})</span></span>
                                                            <span style={{ color: 'var(--surface-border)' }}>|</span>
                                                            <span style={{ color: debt.isPaid ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 600 }}>Mo: ${(debt.minimumPayment + extra).toLocaleString()}</span>
                                                        </div>

                                                        {!debt.isPaid && renderCircles()}
                                                        
                                                        {!debt.isPaid && (
                                                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '400px' }}>
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max={Math.max(500, debt.balance * 0.1)} 
                                                                    step="10" 
                                                                    value={extra}
                                                                    onChange={(e) => handleExtraPaymentChange(debt.id, e.target.value)}
                                                                    style={{ flex: 1, accentColor: 'var(--primary)' }}
                                                                />
                                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '40px' }}>
                                                                    +${extra}
                                                                </span>
                                                                {savingsText && (
                                                                    <span className="badge success-badge animate-fade-in" style={{ fontSize: '0.7rem', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                                                                        {savingsText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="stream-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            alignItems: 'flex-end', 
                                                            minWidth: '90px',
                                                            padding: '6px 10px',
                                                            background: 'var(--surface-hover)',
                                                            borderRadius: '12px',
                                                            border: '1px solid var(--surface-border)',
                                                            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.1)'
                                                        }}>
                                                            <span className="stream-amount text-warning" style={{ fontWeight: 'bold', margin: '0 0 2px 0', lineHeight: 1 }}>
                                                                ${debt.balance.toLocaleString()} left
                                                            </span>
                                                            {!debt.isPaid && payoffDateStr !== 'N/A' && (
                                                                <span style={{ fontSize: '0.7rem', color: payoffDateStr === 'Payment too low' ? 'var(--danger)' : '#000000', fontWeight: 500, lineHeight: 1 }}>
                                                                    Free by: <span style={{ color: payoffDateStr === 'Payment too low' ? 'var(--danger)' : '#000000', fontWeight: 600 }}>{payoffDateStr}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                                            <button className="btn-icon" style={{ padding: '4px' }} onClick={() => { if(playPop) playPop(); startEditingDebt(debt); }}><Edit2 size={16} /></button>
                                                            <button 
                                                                onClick={() => handleRemoveTrackedDebt(debt.id)} 
                                                                className="btn-icon danger"
                                                                style={{ opacity: debt.isPaid ? 0.6 : 1, padding: '4px' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                })()
                            )}
                        </div>
                    </Card>
                </AnimateOnScroll>
            </div>

            {/* Debt Destroyer Summary Section */}
            <AnimateOnScroll delay={0.1} yOffset={40} style={{ marginTop: '40px' }}>
                <Card glass className={`debt-destroyer-unified-card ${borderGlowClass}`} style={{ padding: '32px' }}>
                    <div className="unified-header" style={{ marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingDown className="text-danger" /> Projected Debt Payoff
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                            Automatically see how your chosen strategy eliminates your debt over time.
                        </p>
                    </div>

                    <div className="debt-destroyer-layout" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Attack Strategy */}
                        <div className="strategy-section strategy-card-box" style={{ display: 'flex', flexDirection: 'column', color: 'var(--text-primary)' }}>
                            <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Attack Strategy</h3>
                            <div className="strategy-toggle" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                {[
                                    { id: 'avalanche', label: 'Avalanche', icon: TrendingDown, color: 'var(--primary)', shadow: 'rgba(79, 70, 229, 0.4)' },
                                    { id: 'snowball', label: 'Snowball', icon: Flame, color: 'var(--danger)', shadow: 'rgba(255, 69, 58, 0.4)' },
                                    { id: 'snowflake', label: 'Snowflake', icon: CloudRain, color: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.4)' },
                                    { id: 'blizzard', label: 'Blizzard', icon: Wind, color: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.4)' }
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { playPop && playPop(); setStrategy(s.id); }}
                                        style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: strategy === s.id ? '#fff' : 'var(--text-secondary)', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.3s ease' }}
                                    >
                                        {strategy === s.id && (
                                            <motion.div 
                                                layoutId="strategy-glow"
                                                initial={false}
                                                style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${s.shadow.replace('0.4', '0.15')}, ${s.shadow.replace('0.4', '0.02')})`, border: `1px solid ${s.color}`, borderRadius: '12px', boxShadow: `0 4px 20px ${s.shadow.replace('0.4', '0.2')}, inset 0 0 12px ${s.shadow.replace('0.4', '0.1')}`, zIndex: -1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <motion.div animate={{ scale: strategy === s.id ? 1.15 : 1, rotate: strategy === s.id && s.id === 'snowball' ? [0, -10, 10, 0] : 0 }} transition={{ duration: 0.4 }}>
                                            <s.icon size={16} style={{ color: strategy === s.id ? s.color : 'var(--text-muted)' }} />
                                        </motion.div>
                                        <strong style={{ fontSize: '0.85rem', fontWeight: strategy === s.id ? 700 : 500, letterSpacing: '0.5px' }}>{s.label}</strong>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Burn Down Chart */}
                        <div className="burn-down-section" style={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--surface-border)', paddingTop: '32px' }}>
                            {(trackedDebts || []).length > 0 ? (
                                <>
                                    <div className="burn-down-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                        <div className="target-metric">
                                            <span className="label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Debt Free In</span>
                                            <div className="value glowing-danger" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
                                                {projectionData.monthsToZero === 360 ? '> 30 Years' : `${Math.floor(projectionData.monthsToZero / 12)}y ${projectionData.monthsToZero % 12}m`}
                                            </div>
                                        </div>
                                        <div className="target-metric" style={{ textAlign: 'right' }}>
                                            <span className="label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Interest Paid</span>
                                            <div className="value text-warning" style={{ fontSize: '2rem', fontWeight: 700, color: '#ff9f0a' }}>
                                                $<AnimatedNumber value={projectionData.totalInterest} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="burn-down-chart-wrapper" style={{ flex: 1, width: '100%', minHeight: '250px', position: 'relative' }}>
                                        {(() => {
                                            const chartColor = strategy === 'avalanche' ? 'var(--primary)' : 
                                                               strategy === 'snowball' ? 'var(--danger)' : 
                                                               strategy === 'snowflake' ? '#0ea5e9' : '#8b5cf6';
                                            return (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <AreaChart data={projectionData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorDebtDynamic" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.6} />
                                                                <stop offset="100%" stopColor={chartColor} stopOpacity={0.0} />
                                                            </linearGradient>
                                                            <filter id="glowDynamic" x="-20%" y="-20%" width="140%" height="140%">
                                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                                <feComponentTransfer in="blur" result="fadedBlur">
                                                                    <feFuncA type="linear" slope="0.4" />
                                                                </feComponentTransfer>
                                                                <feComposite in="SourceGraphic" in2="fadedBlur" operator="over" />
                                                            </filter>
                                                        </defs>
                                                        
                                                        {/* Extremely minimal stock chart axes */}
                                                        <XAxis 
                                                            dataKey="month" 
                                                            stroke="transparent" 
                                                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontWeight: 500 }} 
                                                            tickMargin={16}
                                                            minTickGap={30}
                                                        />
                                                        {/* Right-aligned Y-axis like Robinhood */}
                                                        <YAxis 
                                                            orientation="right"
                                                            stroke="transparent" 
                                                            tickFormatter={val => val >= 1000 ? `$${(val/1000).toFixed(1)}k` : `$${val}`} 
                                                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontWeight: 500 }} 
                                                            width={50}
                                                            tickMargin={8}
                                                        />
                                                        
                                                        {/* Stock-style Tooltip with physical crosshair */}
                                                        <Tooltip
                                                            contentStyle={{ 
                                                                backgroundColor: 'rgba(15,15,20,0.95)', 
                                                                border: 'none', 
                                                                backdropFilter: 'blur(16px)', 
                                                                borderRadius: '16px', 
                                                                boxShadow: '0 8px 32px rgba(0,0,0,0.6)', 
                                                                padding: '10px 18px' 
                                                            }}
                                                            itemStyle={{ color: '#fff', fontWeight: '700', fontSize: '1.25rem' }}
                                                            labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                                                            formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                                                            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }}
                                                            position={{ y: -20 }}
                                                        />
                                                        
                                                        {/* Linear type for rigid, mechanical stock lines */}
                                                        <Area 
                                                            type="linear" 
                                                            dataKey="balance" 
                                                            name="Remaining Balance" 
                                                            stroke={chartColor} 
                                                            fillOpacity={1} 
                                                            fill="url(#colorDebtDynamic)" 
                                                            strokeWidth={2.5} 
                                                            activeDot={{ r: 5, fill: chartColor, stroke: '#fff', strokeWidth: 2, filter: 'url(#glowDynamic)' }}
                                                            animationDuration={1500}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state" style={{ height: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <h3>No active debts</h3>
                                    <p>Add your loans or credit cards to see your burn-down projection.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </AnimateOnScroll>

            <Modal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                title={(() => {
                    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Wallet size={20} color={activeColor} /> 
                                <span style={{ color: activeColor }}>Recent Bank Activity</span>
                            </div>
                        </div>
                    );
                })()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '60%', margin: 0 }}>
                        These transactions were automatically securely synced from your connected Plaid bank accounts.
                        The Rules Engine uses their categories to automatically deduct from your Variable Expense budgets.
                    </p>
                    <div className="total-amount-box activity-blur-box" style={{ background: 'var(--surface-hover)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--surface-border)', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Total ({getFilterLabel(activityCategoryFilter)})</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: filteredTotalAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {filteredTotalAmount > 0 ? '-' : ''}${Math.abs(filteredTotalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="category-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
                    {[
                        { id: 'All', label: getFilterLabel('All') },
                        { id: 'PSEUDO_GAS', label: getFilterLabel('PSEUDO_GAS') },
                        { id: 'PSEUDO_RIDE_SHARE', label: getFilterLabel('PSEUDO_RIDE_SHARE') },
                        { id: 'PSEUDO_GROCERIES', label: getFilterLabel('PSEUDO_GROCERIES') },
                        { id: 'PSEUDO_HYGIENE_HOUSEHOLD', label: getFilterLabel('PSEUDO_HYGIENE_HOUSEHOLD') },
                        { id: 'PSEUDO_SUBSCRIPTIONS', label: getFilterLabel('PSEUDO_SUBSCRIPTIONS') },
                        ...uniqueCategories.filter(c => c !== 'All').map(c => ({ id: c, label: getFilterLabel(c) }))
                    ].map(catObj => (
                        <button
                            key={catObj.id}
                            onClick={() => { setActivityCategoryFilter(catObj.id); setActivityPage(1); }}
                            className={`badge ${activityCategoryFilter === catObj.id ? 'primary-badge' : ''}`}
                            style={{
                                cursor: 'pointer',
                                border: activityCategoryFilter === catObj.id ? 'none' : '1px solid var(--surface-border)',
                                background: activityCategoryFilter === catObj.id ? 'var(--primary)' : 'transparent',
                                color: activityCategoryFilter === catObj.id ? 'black' : 'var(--text-secondary)',
                                padding: '6px 16px',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {catObj.label}
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
                            <div key={tx.id} className="stream-item glass activity-blur-box" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', alignItems: 'center', padding: '16px', gap: '16px' }}>
                                <div className="tx-merchant" style={{ fontWeight: 600 }}>
                                    {tx.merchant_name || 'Unknown Merchant'}
                                    {tx.pending && <span className="badge warning-badge" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Pending</span>}
                                </div>
                                <div className="tx-date text-muted" style={{ fontSize: '0.85rem' }}>
                                    {new Date(tx.date).toLocaleDateString()}
                                </div>
                                <div className="tx-category">
                                    {editingTransactionId === tx.id && !tx.isSplitChild ? (
                                            <select
                                                autoFocus
                                                defaultValue={detectPseudoCategory(tx)}
                                                style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '4px', color: 'white', padding: '2px 8px', fontSize: '0.8rem', width: '150px', outline: 'none', cursor: 'pointer' }}
                                                onChange={(e) => {
                                                    const newCat = e.target.value;
                                                    setEditingTransactionId(null);
                                                    if (newCat && newCat !== detectPseudoCategory(tx)) {
                                                        const overrideCat = newCat + ' ';
                                                        
                                                        // ----------------------------------------------------
                                                        // MAGICAL SUBSCRIPTIONS COMMUNICATION HOOK
                                                        // The user requested that explicitly declaring a txn as a
                                                        // Subscription in this UI dropdown automatically generates it!
                                                        // ----------------------------------------------------
                                                        if (newCat === 'PSEUDO_SUBSCRIPTIONS') {
                                                            const newSub = {
                                                                id: crypto.randomUUID(),
                                                                user_id: tx.user_id,
                                                                name: (tx.merchant_name || tx.name || 'New Subscription').trim(),
                                                                cost: Math.abs(tx.amount),
                                                                cycle: 'Monthly'
                                                            };
                                                            // Persists directly utilizing store.setSubscriptions mapped into FinancialContext
                                                            setSubscriptions([...(subscriptions || []), newSub]);
                                                            if (playCheck) playCheck();
                                                        }

                                                        // Optimistic Update
                                                        useStore.setState(s => ({
                                                            transactions: s.transactions.map(t => String(t.id) === String(tx.id) ? { ...t, category: overrideCat } : t)
                                                        }));
                                                        
                                                        // Network Push (Fire and Forget)
                                                        supabase.from('transactions').update({ category: overrideCat }).eq('id', tx.id).then();
                                                    }
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => setEditingTransactionId(null), 150);
                                                }}
                                            >
                                                <option disabled value="">Select Category</option>
                                                <option value="PSEUDO_GAS">{getFilterLabel('PSEUDO_GAS')}</option>
                                                <option value="PSEUDO_RIDE_SHARE">{getFilterLabel('PSEUDO_RIDE_SHARE')}</option>
                                                <option value="PSEUDO_GROCERIES">{getFilterLabel('PSEUDO_GROCERIES')}</option>
                                                <option value="PSEUDO_HYGIENE_HOUSEHOLD">{getFilterLabel('PSEUDO_HYGIENE_HOUSEHOLD')}</option>
                                                <option value="PSEUDO_SUBSCRIPTIONS">{getFilterLabel('PSEUDO_SUBSCRIPTIONS')}</option>
                                                {uniqueCategories.filter(c => c !== 'All').map(c => (
                                                    <option key={c} value={c}>{getFilterLabel(c)}</option>
                                                ))}
                                            </select>
                                    ) : (
                                        <span 
                                            onClick={() => {
                                                if (!tx.isSplitChild) setEditingTransactionId(tx.id);
                                            }}
                                            className="badge badge-hover" 
                                            style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', cursor: tx.isSplitChild ? 'default' : 'pointer', transition: '0.2s', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', padding: '4px 10px' }}
                                            title={tx.isSplitChild ? "Edit category via the split menu" : "Click to edit category"}
                                        >
                                            {getFilterLabel(detectPseudoCategory(tx))}
                                        </span>
                                    )}
                                </div>
                                <div className={`tx-amount ${tx.amount > 0 ? 'text-danger' : 'text-success'}`} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                        {tx.amount > 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                                        <button 
                                            onClick={() => setSplittingTransaction(tx)}
                                            className="btn-icon" 
                                            style={{ opacity: 0.5, padding: '4px' }}
                                            title="Split Transaction"
                                        >
                                            <Scissors size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                

                {activityTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => setActivityPage(p => Math.max(p - 1, 1))} 
                            disabled={activityPage === 1}
                            style={activeColor ? { 
                                background: activeColor, 
                                borderColor: activeColor, 
                                color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                            } : {}}
                        >
                            Previous
                        </Button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {activityPage} of {activityTotalPages}</span>
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => setActivityPage(p => Math.min(p + 1, activityTotalPages))} 
                            disabled={activityPage === activityTotalPages}
                            style={activeColor ? { 
                                background: activeColor, 
                                borderColor: activeColor, 
                                color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                            } : {}}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Modal>


            {splittingTransaction && (
                <SplitTransactionModal 
                    tx={splittingTransaction} 
                    onClose={() => setSplittingTransaction(null)} 
                    uniqueCategories={uniqueCategories}
                />
            )}

            <Modal
                isOpen={showCustomPaymentModal}
                onClose={() => setShowCustomPaymentModal(false)}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                containerStyle={{ maxWidth: '500px', borderRadius: '24px' }}
                title={(() => {
                    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={20} color={activeColor} />
                            <span style={{ color: activeColor }}>Custom Payment: {customPaymentData.monthLabel}</span>
                        </div>
                    );
                })()}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: theme === 'dark' ? '#ffffff' : 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                        Enter the exact amount you paid or plan to pay. The default minimum + extra for this month is <strong className="text-primary">${Number(customPaymentData.currentAmount).toLocaleString()}</strong>.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Payment Amount ($)</label>
                        <Input 
                            type="number" step="0.01" 
                            value={customPaymentData.amount} 
                            onChange={e => setCustomPaymentData({ ...customPaymentData, amount: e.target.value })} 
                            autoFocus
                        />
                    </div>
                    <Button 
                        variant="primary" 
                        style={{ width: '100%', marginTop: '24px', padding: '12px', background: activeColor || 'var(--accent-gradient)', border: 'none', color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : '#fff', boxShadow: activeColor ? `0 4px 12px ${activeColor}4d` : 'none' }}
                        onClick={handleCustomPaymentSubmit}
                    >
                        Save Custom Payment
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Expenses;
