import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Trash2, Check, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CurrencyInput } from './ui/CurrencyInput';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { useStore } from '../store';
import { getFilterLabel } from '../pages/Expenses';

export const SplitTransactionModal = ({ tx, onClose, uniqueCategories }) => {
    const { expenseBorderColor, theme } = useTheme();
    const { playPop, playCheck } = useSound();
    const setTransactionSplits = useStore(state => state.setTransactionSplits);
    const profileData = useStore(state => state.profileData);
    
    // Initial State: 2 Splits
    const [splits, setSplits] = useState([]);

    const originalTargetId = tx?.isSplitChild ? tx.originalTxId : tx?.id;

    useEffect(() => {
        if (tx && originalTargetId) {
            // Check if already split
            const existing = profileData.transactionSplits?.find(s => s.originalTxId === originalTargetId);
            if (existing) {
                // Ensure categories are trimmed so they match the dropdown
                setSplits(existing.splits.map(s => ({ ...s, category: s.category ? s.category.trim() : 'Uncategorized' })));
            } else {
                setSplits([
                    { id: crypto.randomUUID(), amount: Math.abs(tx.amount || 0).toString(), category: (tx.category || 'Uncategorized').trim(), merchant: tx.merchant_name || tx.name || 'Merchant' },
                    { id: crypto.randomUUID(), amount: '0', category: 'Uncategorized', merchant: tx.merchant_name || tx.name || 'Merchant' }
                ]);
            }
        }
    }, [tx, originalTargetId, profileData.transactionSplits]);

    if (!tx) return null;

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : undefined;

    const absoluteTotal = Math.abs(tx.isSplitChild ? tx.originalAmount : tx.amount || 0);
    const currentSum = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const diff = absoluteTotal - currentSum;
    
    const isValid = Math.abs(diff) < 0.01 && splits.every(s => Number(s.amount) > 0);

    const handleSave = () => {
        if (!isValid) return;
        if (playCheck) playCheck();

        const newSplitsArray = [...(profileData.transactionSplits || [])];
        const existingIdx = newSplitsArray.findIndex(s => s.originalTxId === originalTargetId);
        
        // Plaid uses positive amounts for expenses, negative for income.
        // If it's a split child, we need to read the original parent's sign.
        const parentAmount = tx.isSplitChild ? tx.originalAmount : tx.amount;
        const sign = parentAmount < 0 ? -1 : 1; 

        const payload = {
            originalTxId: originalTargetId,
            splits: splits.map(s => ({ ...s, amount: Number(s.amount) * sign, category: s.category }))
        };

        if (existingIdx !== -1) {
            newSplitsArray[existingIdx] = payload;
        } else {
            newSplitsArray.push(payload);
        }

        setTransactionSplits(newSplitsArray);
        onClose();
    };

    const handleRemoveSplit = () => {
        const newSplitsArray = [...(profileData.transactionSplits || [])].filter(s => s.originalTxId !== originalTargetId);
        setTransactionSplits(newSplitsArray);
        if (playCheck) playCheck();
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
            clearBlur={true}
            transparentOverlay={true}
            customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
            containerStyle={{ maxWidth: '600px', borderRadius: '24px' }}
            title={(
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColor || 'var(--text-primary)' }}>
                    <Scissors size={20} />
                    <span>Split Transaction</span>
                </div>
            )}
        >
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Original Amount</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{tx.merchant_name || tx.name}</div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: tx.amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ${absoluteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {splits.map((split, i) => (
                        <div key={split.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ flex: 1.5 }}>
                                <select 
                                    value={split.category} 
                                    onChange={e => {
                                        const newSplits = [...splits];
                                        newSplits[i].category = e.target.value;
                                        setSplits(newSplits);
                                    }}
                                    style={{ width: '100%', background: 'var(--surface)', border: `2px solid ${activeColor || 'var(--surface-border)'}`, color: 'var(--text-primary)', outline: 'none', padding: '10px 16px', borderRadius: '50px', cursor: 'pointer' }}
                                >
                                    <option value="Uncategorized">Uncategorized</option>
                                    <option value="PSEUDO_GAS">{getFilterLabel('PSEUDO_GAS')}</option>
                                    <option value="PSEUDO_RIDE_SHARE">{getFilterLabel('PSEUDO_RIDE_SHARE')}</option>
                                    <option value="PSEUDO_GROCERIES">{getFilterLabel('PSEUDO_GROCERIES')}</option>
                                    <option value="PSEUDO_HYGIENE_HOUSEHOLD">{getFilterLabel('PSEUDO_HYGIENE_HOUSEHOLD')}</option>
                                    <option value="PSEUDO_SUBSCRIPTIONS">{getFilterLabel('PSEUDO_SUBSCRIPTIONS')}</option>
                                    {uniqueCategories?.filter(c => c !== 'All').map(c => <option key={c} value={c}>{getFilterLabel(c)}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <CurrencyInput
                                    placeholder="0.00"
                                    value={split.amount}
                                    onChange={e => {
                                        const newSplits = [...splits];
                                        newSplits[i].amount = e.target.value;
                                        
                                        // Auto-balance if exactly 2 splits
                                        if (newSplits.length === 2 && e.target.value) {
                                            const editedVal = Number(e.target.value);
                                            const otherIndex = i === 0 ? 1 : 0;
                                            if (editedVal <= absoluteTotal) {
                                                newSplits[otherIndex].amount = (absoluteTotal - editedVal).toFixed(2);
                                            }
                                        }
                                        
                                        setSplits(newSplits);
                                    }}
                                    style={{ color: 'var(--text-primary)', border: `2px solid ${activeColor || 'var(--surface-border)'}`, borderRadius: '50px', width: '100%' }}
                                />
                            </div>
                            {splits.length > 2 && (
                                <button 
                                    onClick={() => setSplits(splits.filter((_, idx) => idx !== i))}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                            if (playPop) playPop();
                            setSplits([...splits, { id: crypto.randomUUID(), amount: '', category: 'Uncategorized', merchant: tx.merchant_name || tx.name }]);
                        }}
                        style={{ borderRadius: '50px' }}
                    >
                        <Plus size={16} style={{ marginRight: '6px' }} /> Add Split
                    </Button>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: Math.abs(diff) > 0.01 ? 'rgba(255,59,48,0.1)' : 'rgba(46,204,113,0.1)', borderRadius: '16px', border: `1px solid ${Math.abs(diff) > 0.01 ? 'var(--danger)' : 'var(--success)'}` }}>
                    <div style={{ color: Math.abs(diff) > 0.01 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        {Math.abs(diff) < 0.01 ? 'Balanced!' : `${diff > 0 ? `${diff.toFixed(2)} remaining` : `Over by ${Math.abs(diff).toFixed(2)}`}`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {profileData.transactionSplits?.find(s => s.originalTxId === originalTargetId) && (
                            <Button variant="secondary" onClick={handleRemoveSplit} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                Remove Split
                            </Button>
                        )}
                        <Button 
                            onClick={handleSave} 
                            disabled={!isValid}
                            style={activeColor && isValid ? { background: activeColor, borderColor: activeColor, color: (expenseBorderColor === 'white' || expenseBorderColor === 'yellow') ? 'black' : 'white' } : {}}
                        >
                            Save Splits
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
