import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X } from 'lucide-react';
import { useFinancialContext } from '../../FinancialContext';
import { useSound } from '../../SoundContext';
import { GoalOrb } from './GoalOrb';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';
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

export const GoalsSection = () => {
    const { goals, setGoals } = useFinancialContext();
    const { playPop, playChime, playCrunch } = useSound();
    const { expenseBorderColor, theme } = useTheme();

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#9d4edd' : '#4FA3F7') : undefined;
    const borderGlowClass = expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const [showForm, setShowForm] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [detailsGoalId, setDetailsGoalId] = useState(null);
    const [newGoal, setNewGoal] = useState({ 
        name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7',
        contributionAmount: '', contributionFrequency: 'monthly',
        trackAuto: false
    });

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
                setNewGoal({
                    name: goalToEdit.name,
                    targetAmount: goalToEdit.targetAmount.toString(),
                    currentAmount: goalToEdit.currentAmount.toString(),
                    color: goalToEdit.color,
                    contributionAmount: goalToEdit.contributionAmount ? goalToEdit.contributionAmount.toString() : '',
                    contributionFrequency: goalToEdit.contributionFrequency || 'monthly',
                    trackAuto: goalToEdit.trackAuto || false
                });
                setEditingGoalId(id);
            }
        } else {
            setNewGoal({ 
                name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7',
                contributionAmount: '', contributionFrequency: 'monthly',
                trackAuto: false
            });
            setEditingGoalId(null);
        }
        setShowForm(true);
    };

    const handleSaveGoal = (e) => {
        e.preventDefault();
        if (newGoal.name && newGoal.targetAmount) {
            playChime();
            if (editingGoalId) {
                // Update existing
                setGoals(goals.map(g => g.id === editingGoalId ? {
                    ...g,
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: Number(newGoal.currentAmount || 0),
                    color: newGoal.color,
                    contributionAmount: Number(newGoal.contributionAmount || 0),
                    contributionFrequency: newGoal.contributionFrequency,
                    trackAuto: newGoal.trackAuto
                } : g));
            } else {
                // Create new
                setGoals([...goals, {
                    id: crypto.randomUUID(),
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: Number(newGoal.currentAmount || 0),
                    color: newGoal.color,
                    contributionAmount: Number(newGoal.contributionAmount || 0),
                    contributionFrequency: newGoal.contributionFrequency,
                    trackAuto: newGoal.trackAuto
                }]);
            }
            setShowForm(false);
            setEditingGoalId(null);
        }
    };

    const handleRemoveGoal = (id) => {
        playCrunch();
        setGoals(goals.filter(g => g.id !== id));
    };

    return (
        <section className="goals-section" style={{ position: 'relative', marginBottom: '60px' }}>
            <Card glass className={`goals-card ${borderGlowClass}`} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: theme === 'light' ? 'black' : 'white' }}>
                    <Target size={24} className="text-secondary" />
                    Savings Goals
                </h2>
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
                    <Card glass className="savings-goal-popup" style={{ pointerEvents: 'auto', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: `3px solid ${newGoal.color}`, boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${newGoal.color}33`, animation: 'hologram-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>
                                {editingGoalId ? 'Edit' : 'Create'} <span style={{ color: newGoal.color }}>{editingGoalId ? 'Goal Settings' : 'New Goal'}</span>
                            </h3>
                            <button onClick={() => setShowForm(false)} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Goal Name</label>
                                <Input
                                    placeholder="e.g. Dream Car"
                                    value={newGoal.name}
                                    onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Amount ($)</label>
                                    <Input
                                        type="number" step="0.01"
                                        placeholder="10000"
                                        value={newGoal.targetAmount}
                                        onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Saved So Far ($)</label>
                                    <Input
                                        type="number" step="0.01"
                                        placeholder="0"
                                        value={newGoal.currentAmount}
                                        onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            
                            {/* Auto-Contribution Settings */}
                            <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: newGoal.color }}>Contribution Plan</h4>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1.5 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Amount to Contribute ($)</label>
                                        <Input
                                            type="number" step="0.01"
                                            placeholder="e.g. 200"
                                            value={newGoal.contributionAmount}
                                            onChange={e => setNewGoal({ ...newGoal, contributionAmount: e.target.value })}
                                            style={{ width: '100%' }}
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
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Theme Glow Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="color"
                                        value={newGoal.color}
                                        onChange={e => setNewGoal({ ...newGoal, color: e.target.value })}
                                        style={{ width: '48px', height: '48px', padding: '0', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer', background: 'transparent' }}
                                    />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pick a color for the orb's hologram effect</span>
                                </div>
                            </div>
                            <Button type="submit" variant="primary" style={{ padding: '16px', fontSize: '1.05rem', marginTop: '8px' }}>
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
                        <Card glass className="savings-goal-popup details-popup" style={{ pointerEvents: 'auto', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: `3px solid ${goal.color}`, boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${goal.color}33`, animation: 'hologram-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#fff' }}>
                                        {goal.name} <span style={{ color: goal.color }}>Summary</span>
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Financial Progress & Projections</div>
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
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>${stats.remaining.toLocaleString()}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Est. Completion</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{stats.estimatedDate}</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                    <div style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Contribution Plan</span>
                                        <span className="badge" style={{ background: goal.color, color: '#000', fontWeight: 600 }}>${(goal.contributionAmount || 0).toLocaleString()} / {goal.contributionFrequency || 'monthly'}</span>
                                    </div>
                                    
                                    {stats.paymentsLeft !== '?' ? (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '12px' }}>
                                            At this current velocity, it will take exactly <strong style={{color: '#fff', fontSize: '1rem'}}>{stats.paymentsLeft} more {(goal.contributionFrequency || 'monthly').replace('ly', ' payments')}</strong> to reach your target goal of ${goal.targetAmount.toLocaleString()}. 
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
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -16px', padding: '16px' }}>
                {goals.length === 0 && !showForm ? (
                    <div className="text-muted" style={{ padding: '40px', textAlign: 'center', width: '100%', border: '1px dashed var(--surface-border)', borderRadius: '24px' }}>
                        No savings goals defined yet. Click "Add Goal" to start tracking.
                    </div>
                ) : (
                    goals.map(goal => (
                        <div key={goal.id} style={{ position: 'relative' }}>
                            <GoalOrb goal={goal} onDoubleClick={handleOpenDetails} />
                            <button
                                onClick={() => handleRemoveGoal(goal.id)}
                                className="btn-icon danger"
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
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
            </Card>
        </section>
    );
};
