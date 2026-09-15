import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X, Trash2, GripHorizontal, ShieldCheck } from 'lucide-react';
import { useFinancialContext } from '../../FinancialContext';
import { useSound } from '../../SoundContext';
import { GoalOrb } from './GoalOrb';
import { VerificationBadge } from './VerificationBadge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Card } from '../ui/Card';
import { LuxuryColorWheel } from '../ui/LuxuryColorWheel';
import { useTheme } from '../../contexts/ThemeContext';
import { Reorder } from 'framer-motion';
import '../ui/Modal.css';

const getGoalStats = (goal) => {
    const { targetAmount, currentAmount, contributionAmount, contributionFrequency } = goal;
    const remaining = Math.max(0, targetAmount - currentAmount);
    
    if (!contributionAmount || contributionAmount <= 0) {
        return { remaining, paymentsLeft: '?', estimatedDate: 'N/A', velocity: '0' };
    }
    
    const paymentsLeft = Math.ceil(remaining / contributionAmount);
    
    let daysPerPayment = 30.4368; // default monthly
    if (contributionFrequency === 'weekly') daysPerPayment = 7;
    if (contributionFrequency === 'biweekly') daysPerPayment = 14;
    if (contributionFrequency === 'yearly') daysPerPayment = 365;
    
    const daysToCompletion = paymentsLeft * daysPerPayment;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToCompletion);
    
    return {
        remaining,
        paymentsLeft,
        estimatedDate: completionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
    };
};

const calculateGoalProjections = (goals) => {
    let projections = {};
    const MAX_MONTHS = 1200; // 100 years max loop
    
    let state = goals.map(g => {
        let normalizedMonthly = g.contributionAmount || 0;
        if (g.contributionFrequency === 'weekly') normalizedMonthly *= 4.3333;
        else if (g.contributionFrequency === 'biweekly') normalizedMonthly *= 2.1666;
        else if (g.contributionFrequency === 'yearly') normalizedMonthly /= 12;

        return {
            id: g.id,
            remaining: Math.max(0, g.targetAmount - (g.currentAmount || 0)),
            monthly: normalizedMonthly,
            finished: false,
            hitMonth: null
        };
    });

    let activeGoalIndex = 0;

    for (let month = 1; month <= MAX_MONTHS; month++) {
        // Skip ahead to first unfinished goal in case some naturally start as 0
        while (activeGoalIndex < state.length && state[activeGoalIndex].remaining <= 0) {
            if (!state[activeGoalIndex].finished) {
                state[activeGoalIndex].finished = true;
                state[activeGoalIndex].hitMonth = month - 1;
            }
            activeGoalIndex++;
        }

        if (activeGoalIndex >= state.length) {
            break; // All goals finished!
        }

        let g = state[activeGoalIndex];
        if (g.monthly <= 0) {
            // This goal is blocking the sequence because it has 0 contribution and isn't finished!
            // We lock the cascade. Nothing further can project accurately.
            break; 
        }

        g.remaining -= g.monthly;

        if (g.remaining <= 0) {
            g.finished = true;
            g.hitMonth = month;
            
            // Apply leftover cash to the next goal in line immediately!
            let leftover = Math.abs(g.remaining);
            if (leftover > 0) {
                let nextIdx = activeGoalIndex + 1;
                while (nextIdx < state.length && leftover > 0) {
                    state[nextIdx].remaining -= leftover;
                    if (state[nextIdx].remaining <= 0) {
                        state[nextIdx].finished = true;
                        state[nextIdx].hitMonth = month;
                        leftover = Math.abs(state[nextIdx].remaining);
                        nextIdx++;
                    } else {
                        leftover = 0;
                    }
                }
            }
            activeGoalIndex++;
        }
    }

    state.forEach(g => {
        if (g.hitMonth === null || g.hitMonth === 0) {
             projections[g.id] = g.remaining <= 0 ? 'Reached 🎉' : 'N/A';
        } else {
             const d = new Date();
             d.setMonth(d.getMonth() + g.hitMonth);
             projections[g.id] = 'Hit by ' + d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    });

    return projections;
};

export const GoalsSection = () => {
    const { 
        goals, setGoals, 
        bankBalances = [], 
        goalAllocations = [], 
        unallocatedCashByAccount = {}, 
        saveGoalAllocation, 
        deleteGoalAllocation 
    } = useFinancialContext();
    const { playPop, playChime, playCrunch } = useSound();
    const { expenseBorderColor, theme } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;
    const borderGlowClass = expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const [showForm, setShowForm] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [detailsGoalId, setDetailsGoalId] = useState(null);
    const [newGoal, setNewGoal] = useState({ 
        name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7',
        contributionAmount: '', contributionFrequency: 'monthly',
        trackAuto: false, orderIndex: '1',
        allocatedBankId: '', allocatedAmount: ''
    });

    // Total unallocated liquid savings across all connected accounts
    const totalUnallocatedSavings = useMemo(() => {
        let sum = 0;
        Object.values(unallocatedCashByAccount || {}).forEach(acc => {
            if (acc.subtype === 'savings' || acc.type === 'depository') {
                sum += Number(acc.unallocatedBalance || 0);
            }
        });
        return sum;
    }, [unallocatedCashByAccount]);

    const handleReorderGoals = (newOrderedGoals) => {
        const updated = newOrderedGoals.map((g, idx) => ({ ...g, orderIndex: idx }));
        setGoals(updated);
    };

    const goalProjections = useMemo(() => calculateGoalProjections(goals), [goals]);

    const handleOpenDetails = (id) => {
        playPop();
        setDetailsGoalId(id);
    };

    const handleOpenForm = (id = null) => {
        setDetailsGoalId(null);
        playPop();
        if (id) {
            const goalToEdit = goals.find(g => g.id === id);
            if (goalToEdit) {
                const currentRank = goals.findIndex(g => g.id === id) + 1;
                const existingAlloc = (goalAllocations || []).find(a => String(a.goalId) === String(id) && a.bankBalanceId);
                setNewGoal({
                    name: goalToEdit.name,
                    targetAmount: (goalToEdit.targetAmount || 0).toString(),
                    currentAmount: (goalToEdit.currentAmount || 0).toString(),
                    color: goalToEdit.color,
                    contributionAmount: goalToEdit.contributionAmount ? goalToEdit.contributionAmount.toString() : '',
                    contributionFrequency: goalToEdit.contributionFrequency || 'monthly',
                    trackAuto: goalToEdit.trackAuto || false,
                    orderIndex: currentRank.toString(),
                    allocatedBankId: existingAlloc ? existingAlloc.bankBalanceId : '',
                    allocatedAmount: existingAlloc ? existingAlloc.allocatedAmount.toString() : ''
                });
                setEditingGoalId(id);
            }
        } else {
            setNewGoal({ 
                name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7',
                contributionAmount: '', contributionFrequency: 'monthly',
                trackAuto: false, orderIndex: (goals.length + 1).toString(),
                allocatedBankId: '', allocatedAmount: ''
            });
            setEditingGoalId(null);
        }
        setShowForm(true);
    };

    const handleSaveGoal = (e) => {
        e.preventDefault();
        if (newGoal.name && newGoal.targetAmount) {
            playChime();
            const requestedRank = Math.max(1, Number(newGoal.orderIndex) || goals.length + (editingGoalId ? 0 : 1));
            const newOrderScore = requestedRank - 1.5; 
            const targetGoalId = editingGoalId || crypto.randomUUID();
            const isBankAllocated = Boolean(newGoal.allocatedBankId && Number(newGoal.allocatedAmount) > 0);
            const verifiedTier = isBankAllocated ? 'BANK_VERIFIED' : 'SELF_REPORTED';
            
            let draftGoals = [];

            if (editingGoalId) {
                // Update existing
                draftGoals = goals.map(g => g.id === editingGoalId ? {
                    ...g,
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: isBankAllocated ? Number(newGoal.allocatedAmount) : Number(newGoal.currentAmount || 0),
                    color: newGoal.color,
                    contributionAmount: Number(newGoal.contributionAmount || 0),
                    contributionFrequency: newGoal.contributionFrequency,
                    trackAuto: newGoal.trackAuto,
                    orderIndex: newOrderScore,
                    verificationTier: verifiedTier
                } : { ...g });
            } else {
                // Create new
                draftGoals = [...goals, {
                    id: targetGoalId,
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: isBankAllocated ? Number(newGoal.allocatedAmount) : Number(newGoal.currentAmount || 0),
                    color: newGoal.color,
                    contributionAmount: Number(newGoal.contributionAmount || 0),
                    contributionFrequency: newGoal.contributionFrequency,
                    trackAuto: newGoal.trackAuto,
                    orderIndex: newOrderScore,
                    verificationTier: verifiedTier
                }];
            }
            
            // Re-normalize array layout
            draftGoals.sort((a, b) => a.orderIndex - b.orderIndex);
            const finalNormalized = draftGoals.map((g, idx) => ({ ...g, orderIndex: idx }));
            setGoals(finalNormalized);

            // Sync virtual envelope bank allocation
            if (isBankAllocated && saveGoalAllocation) {
                saveGoalAllocation(targetGoalId, newGoal.allocatedBankId, Number(newGoal.allocatedAmount));
            } else if (!isBankAllocated && editingGoalId && deleteGoalAllocation) {
                const oldAlloc = (goalAllocations || []).find(a => String(a.goalId) === String(editingGoalId));
                if (oldAlloc?.bankBalanceId) {
                    deleteGoalAllocation(editingGoalId, oldAlloc.bankBalanceId);
                }
            }

            setShowForm(false);
            setEditingGoalId(null);
        }
    };

    const handleRemoveGoal = (id) => {
        playCrunch();
        setGoals(goals.filter(g => g.id !== id));
        const alloc = (goalAllocations || []).find(a => String(a.goalId) === String(id));
        if (alloc?.bankBalanceId && deleteGoalAllocation) {
            deleteGoalAllocation(id, alloc.bankBalanceId);
        }
    };

    return (
        <section className="goals-section" style={{ position: 'relative', marginBottom: '60px' }}>
            <Card glass className={`goals-card ${borderGlowClass}`} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: theme === 'light' ? 'black' : 'white' }}>
                        <Target size={24} className="text-secondary" />
                        Savings Goals
                    </h2>
                    {totalUnallocatedSavings > 0 && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Cash sitting in your connected bank accounts not yet assigned to any goal">
                            <ShieldCheck size={14} />
                            ${totalUnallocatedSavings.toLocaleString()} Unallocated Bank Savings
                        </span>
                    )}
                </div>
                {!showForm && (
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleOpenForm()}
                        style={activeColor ? { 
                            background: activeColor, 
                            borderColor: activeColor, 
                            color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' 
                        } : {}}
                    >
                        <Plus size={16} /> Add Goal
                    </Button>
                )}
            </div>

            {showForm && typeof window !== 'undefined' && createPortal(
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }} style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    background: 'transparent'
                }}>
                    <Card glass className="savings-goal-popup" style={{ background: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', pointerEvents: 'auto', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: `3px solid ${newGoal.color}`, boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${newGoal.color}33`, animation: 'hologram-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                                {editingGoalId ? 'Edit' : 'Create'} <span style={{ color: newGoal.color }}>{editingGoalId ? 'Goal Settings' : 'New Goal'}</span>
                            </h3>
                            <button onClick={() => setShowForm(false)} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 3 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px' }}>Goal Name</label>
                                    <Input
                                        placeholder="e.g. Dream Car"
                                        value={newGoal.name}
                                        onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                                        required
                                        style={{ width: '100%', textShadow: theme === 'dark' ? `0 0 8px ${newGoal.color}` : 'none' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 8px 4px' }}>Priority #</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={goals.length + (editingGoalId ? 0 : 1)}
                                        placeholder="1"
                                        value={newGoal.orderIndex}
                                        onChange={e => setNewGoal({ ...newGoal, orderIndex: e.target.value })}
                                        required
                                        style={{ width: '100%', textShadow: theme === 'dark' ? `0 0 8px ${newGoal.color}` : 'none' }}
                                        title="1 is Highest Priority"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Amount ($)</label>
                                    <CurrencyInput
                                        placeholder="10000"
                                        value={newGoal.targetAmount}
                                        onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                        required
                                        style={{ width: '100%', textShadow: theme === 'dark' ? `0 0 8px ${newGoal.color}` : 'none' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Saved So Far ($)</label>
                                    <CurrencyInput
                                        placeholder="0"
                                        value={newGoal.currentAmount}
                                        onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                        style={{ width: '100%', textShadow: theme === 'dark' ? `0 0 8px ${newGoal.color}` : 'none' }}
                                    />
                                </div>
                            </div>
                            
                            {/* Bank Verification & Virtual Envelope Allocation */}
                            <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={18} style={{ color: '#fbbf24' }} />
                                            Bank Verification & Allocation
                                        </h4>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            Link a real connected bank balance to unlock Bank-Verified rewards
                                        </div>
                                    </div>
                                </div>
                                
                                {bankBalances && bankBalances.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                                Select Connected Bank Account (Optional)
                                            </label>
                                            <select
                                                value={newGoal.allocatedBankId || ''}
                                                onChange={(e) => {
                                                    const bankId = e.target.value;
                                                    const unallocInfo = unallocatedCashByAccount[bankId];
                                                    const suggested = unallocInfo ? Math.min(Number(newGoal.targetAmount) || unallocInfo.unallocatedBalance, unallocInfo.unallocatedBalance) : 0;
                                                    setNewGoal({
                                                        ...newGoal,
                                                        allocatedBankId: bankId,
                                                        allocatedAmount: bankId ? (newGoal.allocatedAmount || suggested.toString()) : '',
                                                        currentAmount: bankId && suggested > 0 ? suggested.toString() : newGoal.currentAmount
                                                    });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--surface-border)',
                                                    background: 'var(--surface)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="">○ Self-Reported / Manual Progress</option>
                                                {bankBalances.map(acc => {
                                                    const info = unallocatedCashByAccount[acc.id] || {};
                                                    const unalloc = info.unallocatedBalance != null ? info.unallocatedBalance : (acc.available_balance || 0);
                                                    return (
                                                        <option key={acc.id} value={acc.id}>
                                                            🛡️ {acc.name} (...{acc.mask || 'Bank'}) — ${unalloc.toLocaleString()} Unallocated (${Number(acc.available_balance || acc.current_balance || 0).toLocaleString()} Total)
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        {newGoal.allocatedBankId && (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        Verified Amount to Earmark ($)
                                                    </label>
                                                    {unallocatedCashByAccount[newGoal.allocatedBankId] && (
                                                        <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                                                            Max available: ${Number(unallocatedCashByAccount[newGoal.allocatedBankId].unallocatedBalance || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <CurrencyInput
                                                    placeholder="e.g. 5000"
                                                    value={newGoal.allocatedAmount || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNewGoal({ 
                                                            ...newGoal, 
                                                            allocatedAmount: val,
                                                            currentAmount: val
                                                        });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        No connected bank accounts found. Connect an account in Settings to unlock 🛡️ Bank-Verified savings.
                                    </div>
                                )}
                            </div>

                            {/* Auto-Contribution Settings */}
                            <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: newGoal.color }}>Contribution Plan</h4>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1.5 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Amount to Contribute ($)</label>
                                        <CurrencyInput
                                            placeholder="e.g. 200"
                                            value={newGoal.contributionAmount}
                                            onChange={e => setNewGoal({ ...newGoal, contributionAmount: e.target.value })}
                                            style={{ width: '100%', textShadow: theme === 'dark' ? `0 0 8px ${newGoal.color}` : 'none' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Frequency</label>
                                        <select
                                            value={newGoal.contributionFrequency}
                                            onChange={e => setNewGoal({ ...newGoal, contributionFrequency: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--surface-border)',
                                                background: 'var(--surface)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                outline: 'none',
                                            }}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Auto-Track via Bank Account</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically link deposits hitting your account</div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={newGoal.trackAuto} 
                                            onChange={(e) => setNewGoal({...newGoal, trackAuto: e.target.checked})}
                                            style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
                                        />
                                        <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: newGoal.trackAuto ? 'var(--primary)' : 'var(--surface-border)', position: 'relative', transition: 'background 0.3s' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: newGoal.trackAuto ? '22px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Theme Glow Color</label>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orb Hologram Aura</span>
                                </div>
                                <LuxuryColorWheel
                                    value={newGoal.color || '#00F0FF'}
                                    onChange={(newColor) => setNewGoal({ ...newGoal, color: newColor })}
                                    size={180}
                                />
                            </div>
                            <Button type="submit" variant="primary" style={{ padding: '16px', fontSize: '1.05rem', marginTop: '8px', background: newGoal.color || 'var(--accent-gradient)', border: 'none', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', boxShadow: newGoal.color ? `0 4px 12px ${newGoal.color}66` : '0 4px 12px rgba(0, 150, 255, 0.3)' }}>
                                {editingGoalId ? 'Update Goal' : 'Save Goal to Dashboard'}
                            </Button>
                        </form>
                    </Card>
                </div>
            , document.body)}

            {detailsGoalId && (() => {
                const goal = goals.find(g => g.id === detailsGoalId);
                if (!goal) return null;
                const stats = getGoalStats(goal);
                const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
                
                return typeof window !== 'undefined' ? createPortal(
                    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailsGoalId(null) }} style={{
                        position: 'fixed',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        background: 'transparent'
                    }}>
                        <Card glass className="savings-goal-popup details-popup" style={{ background: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', pointerEvents: 'auto', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: `3px solid ${goal.color}`, boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${goal.color}33`, animation: 'hologram-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                                        {goal.name} <span style={{ color: goal.color }}>Summary</span>
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Financial Progress & Projections</div>
                                        <VerificationBadge tier={goal.verificationTier || 'SELF_REPORTED'} size="sm" />
                                        {goal.trackAuto && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,255,100,0.1)', color: '#00e57f', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                <Target size={12} /> Auto-Tracking
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setDetailsGoalId(null)} className="btn-icon">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600 }}>
                                        <span style={{ color: goal.color }}>${goal.currentAmount.toLocaleString()} Saved</span>
                                        <span style={{ color: 'var(--text-muted)' }}>Target: ${goal.targetAmount.toLocaleString()}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '12px', background: 'var(--surface-border)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percentage}%`, height: '100%', background: goal.color, borderRadius: '6px', boxShadow: `0 0 10px ${goal.color}80` }} />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Remaining Amount</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>${stats.remaining.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Est. Completion</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{stats.estimatedDate}</div>
                                    </div>
                                </div>

                                {goal.allocations && goal.allocations.length > 0 && (
                                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={16} style={{ color: '#fbbf24' }} />
                                            <span>Bank-Verified Allocations</span>
                                        </div>
                                        {goal.allocations.map((alloc, aIdx) => {
                                            const acc = bankBalances.find(b => b.id === alloc.bankBalanceId);
                                            return (
                                                <div key={alloc.id || aIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                                                    <span>{acc ? `${acc.name} (...${acc.mask || ''})` : 'Manual Progress'}</span>
                                                    <strong style={{ color: '#fbbf24' }}>${Number(alloc.allocatedAmount || 0).toLocaleString()}</strong>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Contribution Plan</span>
                                        <span className="badge" style={{ background: goal.color, color: '#000', fontWeight: 600 }}>${(goal.contributionAmount || 0).toLocaleString()} / {goal.contributionFrequency || 'monthly'}</span>
                                    </div>
                                    
                                    {stats.paymentsLeft !== '?' ? (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '12px' }}>
                                            At this current velocity, it will take exactly <strong style={{color: 'var(--text-primary)', fontSize: '1rem'}}>{stats.paymentsLeft} more {(goal.contributionFrequency || 'monthly').replace('ly', ' payments')}</strong> to reach your target goal of ${goal.targetAmount.toLocaleString()}. 
                                            Keep up the consistency!
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--warning)', lineHeight: 1.5, marginTop: '12px' }}>
                                            Set up a contribution amount to unlock AI timeline projections and automated payment schedules!
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <Button variant="secondary" onClick={() => handleOpenForm(goal.id)} style={{ flex: 1, padding: '14px', border: '1px solid var(--surface-border)' }}>
                                        Edit Goal Settings
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                , document.body) : null;
            })()}

            {/* Orbs List */}
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '16px', margin: '0 -16px', padding: '16px' }}>
                {goals.length === 0 && !showForm ? (
                    <div className="text-muted" style={{ padding: '40px', textAlign: 'center', width: '100%', border: '1px dashed var(--surface-border)', borderRadius: '24px' }}>
                        No savings goals defined yet. Click "Add Goal" to start tracking.
                    </div>
                ) : (
                    <Reorder.Group 
                        axis="x" 
                        values={goals} 
                        onReorder={handleReorderGoals} 
                        style={{ display: 'flex', gap: '24px', listStyleType: 'none', margin: 0, padding: 0 }}
                    >
                        {goals.map((goal) => (
                            <Reorder.Item 
                                key={goal.id} 
                                value={goal}
                                style={{ position: 'relative', cursor: 'grab' }}
                                whileDrag={{ scale: 1.05, zIndex: 99 }}
                                onMouseEnter={(e) => {
                                    const btn = e.currentTarget.querySelector('.delete-goal-btn');
                                    if (btn) btn.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    const btn = e.currentTarget.querySelector('.delete-goal-btn');
                                    if (btn) btn.style.opacity = '0';
                                }}
                            >
                                <GoalOrb goal={goal} onDoubleClick={handleOpenDetails} />
                                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    {goalProjections[goal.id]}
                                </div>
                                <div 
                                    style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '50%', padding: '4px', opacity: 0.5 }}
                                    title="Drag to rank priority"
                                >
                                    <GripHorizontal size={14} />
                                </div>
                                <button
                                    onClick={() => handleRemoveGoal(goal.id)}
                                    className="btn-icon danger delete-goal-btn"
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--surface-border)',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                    }}
                                    title="Delete Goal"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>
            </Card>
        </section>
    );
};
