import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../store';
import { injectDemoData } from '../utils/mockDataGenerator';
import { 
    ArrowRight, Target, TrendingUp, Compass, CheckCircle, 
    Flag, Clock, AlertTriangle, DollarSign, Shield, Heart, Zap, Globe 
} from 'lucide-react';
import { useSound } from '../SoundContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Onboarding.css';

const ONBOARDING_QUESTIONS = [
    {
        id: 'mission',
        title: 'Step 1: Calibrate your primary wealth objective.',
        subtitle: 'We will tailor your analytical insights specifically to this strategic goal.',
        options: [
            { value: 'wealth', label: 'Aggressively Build Wealth', icon: TrendingUp, color: 'var(--accent-primary)' },
            { value: 'debt', label: 'Destroy Existing Debt', icon: Target, color: 'var(--danger)' },
            { value: 'save', label: 'Funding a Life Purchase', icon: Flag, color: 'var(--success)' },
            { value: 'fire', label: 'Financial Independence', icon: Globe, color: 'var(--warning)' },
        ]
    },
    {
        id: 'timeline',
        title: 'Step 2: Define your time horizon.',
        subtitle: 'Your timeline dictates the baseline velocity of your investment engine.',
        options: [
            { value: 'fast', label: 'Fast-track (1-3 years)', icon: Zap, color: 'var(--accent-primary)' },
            { value: 'accelerated', label: 'Accelerated (3-7 years)', icon: Clock, color: 'var(--success)' },
            { value: 'steady', label: 'Steady Scale (7-15 years)', icon: Target, color: 'var(--warning)' },
            { value: 'legacy', label: 'Permanent Legacy (15+ yrs)', icon: Shield, color: 'var(--text-secondary)' },
        ]
    },
    {
        id: 'dream',
        title: 'Step 3: What is the ultimate moonshot you are funding?',
        subtitle: 'The true purpose deeply driving your numbers.',
        options: [
            { value: 'freedom', label: 'Total Freedom & Early Retire', icon: Globe, color: 'var(--accent-primary)' },
            { value: 'legacy', label: 'Generational Family Wealth', icon: Heart, color: 'var(--danger)' },
            { value: 'travel', label: 'Endless Global Travel', icon: Compass, color: 'var(--success)' },
            { value: 'empire', label: 'Building a Business Empire', icon: Zap, color: 'var(--warning)' },
        ]
    }
];

const TOTAL_STEPS = ONBOARDING_QUESTIONS.length + 2;

const Onboarding = () => {
    const navigate = useNavigate();
    const { user, completeOnboarding } = useAuth();
    const { theme, expenseBorderColor } = useTheme();
    const { playPop } = useSound();
    const store = useStore();
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({});
    const [useDemoData, setUseDemoData] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#ff3b30', green: '#2ecc71', purple: '#8b5cf6',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#ffffff' : '#4FA3F7') : (theme === 'dark' ? '#ffffff' : '#4FA3F7');

    const firstName = user?.user_metadata?.first_name || 
                     user?.user_metadata?.full_name?.split(' ')[0] || 
                     'there';

    const handleNext = () => {
        if (playPop) playPop();
        if (step < TOTAL_STEPS) setStep(step + 1);
    };

    const handleBack = () => {
        if (playPop) playPop();
        if (step > 1) setStep(step - 1);
    };

    const handleSelectOption = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleComplete = async (startTour) => {
        if (playPop) playPop();
        setIsAnalyzing(true);
        
        // Artificial intelligence profile synthesis delay
        await new Promise(r => setTimeout(r, 1500));

        if (useDemoData) {
            await injectDemoData(store);
        }

        if (completeOnboarding) {
            // Forward answers to the backend if needed later, but complete locally instantly
            await completeOnboarding(startTour, answers);
        } else {
            console.warn("completeOnboarding function missing in AuthContext");
        }
        
        if (startTour) {
            navigate('/');
        } else {
            navigate('/dashboard'); 
        }
    };

    const progressPercentage = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className="onboarding-page-container slide-up-fade">
            <Modal
                isOpen={true}
                onClose={() => {}}
                useNeonGlow={theme !== 'dark' || expenseBorderColor !== 'none'}
                clearBlur={true}
                transparentOverlay={true}
                customClass={expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : ''}
                containerStyle={{ maxWidth: '600px', borderRadius: '24px' }}
                title={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={20} color={activeColor || 'var(--text-primary)'} /> 
                        <span style={{ color: activeColor || 'var(--text-primary)' }}>Engine Initialization</span>
                    </div>
                )}
            >
                
                {/* Modern Progress Bar instead of 10 crowded dots */}
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '32px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercentage}%`, height: '100%', background: activeColor || 'var(--accent-primary)', transition: 'width 0.4s ease-in-out' }} />
                </div>

                {step === 1 && (
                    <div className="slide-up-fade" key="step1">
                        <div className="onboarding-header">
                            <h1>Welcome, {firstName}.</h1>
                            <p>We're thrilled to have you here. Before we build out your massive wealth dashboard, let's calibrate your intelligence engine.</p>
                        </div>
                        <div className="onboarding-actions" style={{ marginTop: '40px' }}>
                            <Button style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={handleNext}>
                                Initiate Calibration <ArrowRight size={20} style={{ marginLeft: '8px' }}/>
                            </Button>
                        </div>
                    </div>
                )}

                {step >= 2 && step <= TOTAL_STEPS - 1 && (() => {
                    const qIndex = step - 2;
                    const question = ONBOARDING_QUESTIONS[qIndex];
                    const hasSelected = answers[question.id] !== undefined;
                    
                    return (
                        <div className="slide-up-fade" key={`step${step}`}>
                            <div className="onboarding-header">
                                <h2>{question.title}</h2>
                                <p>{question.subtitle}</p>
                            </div>

                            <div className="goal-selection-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                                {question.options.map((opt) => {
                                    const isSelected = answers[question.id] === opt.value;
                                    const Icon = opt.icon;
                                    return (
                                        <div 
                                            key={opt.value}
                                            className={`goal-option glass ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption(question.id, opt.value)}
                                            style={{ 
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 16px', gap: '16px',
                                                cursor: 'pointer', transition: 'all 0.2s', borderRadius: '16px',
                                                ...(isSelected ? { borderColor: opt.color || 'var(--accent-primary)', background: 'rgba(255,255,255,0.05)', boxShadow: `0 0 20px ${opt.color}33`, transform: 'scale(1.02)' } : { border: '1px solid var(--surface-border)' })
                                            }}
                                        >
                                            <Icon size={46} color={isSelected ? (opt.color || 'var(--accent-primary)') : 'var(--text-secondary)'} style={{ transition: 'all 0.2s' }} />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: isSelected ? '#fff' : 'inherit' }}>{opt.label}</h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="onboarding-actions" style={{ marginTop: '24px' }}>
                                <Button variant="secondary" onClick={handleBack}>Back</Button>
                                <Button disabled={!hasSelected} onClick={handleNext}>
                                    Next <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </Button>
                            </div>
                        </div>
                    );
                })()}

                {step === TOTAL_STEPS && (
                    <div className="slide-up-fade" key={`step${TOTAL_STEPS}`}>
                        <div className="onboarding-header">
                            <h2>Your 5-Year Dream Board.</h2>
                            <p>Based on your <strong>{answers.timeline === 'fast' ? "aggressive" : answers.timeline === 'accelerated' ? "accelerated" : "calculated"}</strong> timeline, here is your explosive 5-year trajectory towards funding your moonshot: <strong>{answers.dream === 'freedom' ? 'Total Financial Freedom' : answers.dream === 'legacy' ? 'Generational Family Wealth' : answers.dream === 'travel' ? 'Endless Global Travel' : 'Your Business Empire'}</strong>.</p>
                        </div>

                        {(() => {
                            // Exponential wealth curve scaling from baseline $100k strictly up to $1M
                            const projectionData = Array.from({ length: 5 }).map((_, i) => ({
                                year: `Year ${i + 1}`,
                                value: Math.round((100000 * Math.pow(1.7782794, i)) / 1000) * 1000
                            }));
                            return (
                                <div style={{ height: '220px', width: '100%', margin: '32px 0 16px 0', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '24px 24px 0px 8px', background: 'rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectionData}>
                                            <defs>
                                                <linearGradient id="colorGlow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.6}/>
                                                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                formatter={(value) => [`$${value.toLocaleString()}`, 'Projected Net Worth']}
                                                labelFormatter={(label) => label}
                                                contentStyle={{ background: 'var(--surface-hover)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white' }}
                                                itemStyle={{ color: 'var(--success)', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorGlow)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            );
                        })()}

                        <div 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                                background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid var(--surface-border)',
                                cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s',
                                borderLeft: useDemoData ? '4px solid var(--accent-primary)' : '1px solid var(--surface-border)'
                            }}
                            onClick={() => setUseDemoData(!useDemoData)}
                        >
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: useDemoData ? 'none' : '2px solid var(--text-muted)', background: useDemoData ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {useDemoData && <CheckCircle size={16} color="#fff" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Initialize with Demo Data</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pre-populates sample transactions and goals. Recommended for exploring.</p>
                            </div>
                        </div>

                        {isAnalyzing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '24px' }}>
                                <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--surface-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <h3 style={{ margin: 0, color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }}>Analyzing Profile...</h3>
                            </div>
                        ) : (
                            <div className="onboarding-actions" style={{ flexDirection: 'column' }}>
                                <Button style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => handleComplete(true)}>
                                    Take the Interactive Tour
                                </Button>
                                <Button variant="secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => handleComplete(false)}>
                                    Skip straight to Dashboard
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            </Modal>
        </div>
    );
};

export default Onboarding;
