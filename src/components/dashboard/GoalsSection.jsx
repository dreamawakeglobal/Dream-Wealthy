import React, { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { useFinancialContext } from '../../FinancialContext';
import { GoalOrb } from './GoalOrb';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export const GoalsSection = () => {
    const { goals, setGoals } = useFinancialContext();
    const [showForm, setShowForm] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7' });

    const handleOpenForm = (id = null) => {
        if (id) {
            const goalToEdit = goals.find(g => g.id === id);
            if (goalToEdit) {
                setNewGoal({
                    name: goalToEdit.name,
                    targetAmount: goalToEdit.targetAmount.toString(),
                    currentAmount: goalToEdit.currentAmount.toString(),
                    color: goalToEdit.color
                });
                setEditingGoalId(id);
            }
        } else {
            setNewGoal({ name: '', targetAmount: '', currentAmount: '', color: '#4FA3F7' });
            setEditingGoalId(null);
        }
        setShowForm(true);
    };

    const handleSaveGoal = (e) => {
        e.preventDefault();
        if (newGoal.name && newGoal.targetAmount) {
            if (editingGoalId) {
                // Update existing
                setGoals(goals.map(g => g.id === editingGoalId ? {
                    ...g,
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: Number(newGoal.currentAmount || 0),
                    color: newGoal.color
                } : g));
            } else {
                // Create new
                setGoals([...goals, {
                    id: Date.now().toString(),
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: Number(newGoal.currentAmount || 0),
                    color: newGoal.color
                }]);
            }
            setShowForm(false);
            setEditingGoalId(null);
        }
    };

    const handleRemoveGoal = (id) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    return (
        <section className="goals-section" style={{ position: 'relative', marginBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Target size={24} className="text-secondary" />
                    Savings Goals
                </h2>
                {!showForm && (
                    <Button variant="secondary" size="sm" onClick={() => handleOpenForm()}>
                        <Plus size={16} /> Add Goal
                    </Button>
                )}
            </div>

            {showForm && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '0 20px',
                    pointerEvents: 'none'
                }}>
                    <Card glass style={{ pointerEvents: 'auto', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', animation: 'hologram-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{editingGoalId ? 'Edit Goal' : 'Create New Goal'}</h3>
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
                                        type="number"
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
                                        type="number"
                                        placeholder="0"
                                        value={newGoal.currentAmount}
                                        onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
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
            )}

            {/* Orbs List */}
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -16px', padding: '16px' }}>
                {goals.length === 0 && !showForm ? (
                    <div className="text-muted" style={{ padding: '40px', textAlign: 'center', width: '100%', border: '1px dashed var(--surface-border)', borderRadius: '24px' }}>
                        No savings goals defined yet. Click "Add Goal" to start tracking.
                    </div>
                ) : (
                    goals.map(goal => (
                        <div key={goal.id} style={{ position: 'relative' }}>
                            <GoalOrb goal={goal} onEdit={handleOpenForm} />
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
        </section>
    );
};
