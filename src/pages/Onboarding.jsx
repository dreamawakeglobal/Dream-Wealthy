import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import { injectDemoData } from '../utils/mockDataGenerator';
import { 
    ArrowRight, Target, TrendingUp, Compass, CheckCircle, 
    Flag, Clock, AlertTriangle, DollarSign, Shield, Heart, Zap, Globe 
} from 'lucide-react';
import { useSound } from '../SoundContext';
import './Onboarding.css';

const ONBOARDING_QUESTIONS = [
    {
        id: 'mission',
        title: 'What is your primary financial focus right now?',
        subtitle: 'We will tailor your insights specifically to this goal.',
        options: [
            { value: 'wealth', label: 'Aggressively Build Wealth', icon: TrendingUp, color: 'var(--accent-primary)' },
            { value: 'debt', label: 'Destroy Existing Debt', icon: Target, color: 'var(--danger)' },
            { value: 'save', label: 'Save for a Major Life Purchase', icon: Flag, color: 'var(--success)' },
            { value: 'fire', label: 'Achieve Total Financial Independence', icon: Globe, color: 'var(--warning)' },
        ]
    },
    {
        id: 'stage',
        title: 'How would you describe your current financial stage?',
        subtitle: 'This helps us benchmark your progress.',
        options: [
            { value: 'starting', label: 'Just starting our journey', icon: CheckCircle, color: 'var(--text-secondary)' },
            { value: 'stable', label: 'Stable, but seeking aggressive growth', icon: TrendingUp, color: 'var(--success)' },
            { value: 'high_earner', label: 'High-earner needing optimization', icon: Shield, color: 'var(--accent-primary)' },
            { value: 'rebuilding', label: 'Rebuilding and recovering', icon: AlertTriangle, color: 'var(--warning)' },
        ]
    },
    {
        id: 'timeline',
        title: 'When do you want to achieve your ultimate state of financial freedom?',
        subtitle: 'Your time horizon dictates your investment strategy.',
        options: [
            { value: 'fast', label: 'Fast-track (1-3 years)', icon: Zap, color: 'var(--accent-primary)' },
            { value: 'accelerated', label: 'Accelerated (3-7 years)', icon: Clock, color: 'var(--success)' },
            { value: 'steady', label: 'Steady & Strategic (7-15 years)', icon: Target, color: 'var(--warning)' },
            { value: 'legacy', label: 'Long-term Legacy (15+ years)', icon: Shield, color: 'var(--text-secondary)' },
        ]
    },
    {
        id: 'obstacle',
        title: 'What has historically been your biggest roadblock to financial success?',
        subtitle: 'Identifying obstacles is the first step to clearing them.',
        options: [
            { value: 'debt', label: 'Overwhelming Debt', icon: Target, color: 'var(--danger)' },
            { value: 'income', label: 'Income Ceiling / Lack of Capital', icon: TrendingUp, color: 'var(--warning)' },
            { value: 'habits', label: 'Poor Tracking & Spending Habits', icon: AlertTriangle, color: 'var(--accent-primary)' },
            { value: 'plan', label: 'Information Overload / Lack of Plan', icon: Compass, color: 'var(--success)' },
        ]
    },
    {
        id: 'income_goal',
        title: 'What is your target monthly income goal to feel completely secure?',
        subtitle: 'Dream big. We will help you chart the path.',
        options: [
            { value: '5k', label: '$5,000 / month', icon: DollarSign, color: 'var(--text-secondary)' },
            { value: '10k', label: '$10,000 / month', icon: DollarSign, color: 'var(--success)' },
            { value: '25k', label: '$25,000 / month', icon: DollarSign, color: 'var(--accent-primary)' },
            { value: '50k', label: '$50,000+ / month (Empire Status)', icon: Zap, color: 'var(--warning)' },
        ]
    },
    {
        id: 'strategy',
        title: 'How do you approach growing your money and investing?',
        subtitle: 'This determines your asset allocation velocity.',
        options: [
            { value: 'conservative', label: 'Conservative & Secure', icon: Shield, color: 'var(--success)' },
            { value: 'balanced', label: 'Balanced & Calculated', icon: Compass, color: 'var(--accent-primary)' },
            { value: 'aggressive', label: 'Aggressive & High-Yield', icon: Zap, color: 'var(--warning)' },
        ]
    },
    {
        id: 'dream',
        title: 'If money were no object, what is the ultimate dream you are funding?',
        subtitle: 'The true purpose behind the numbers.',
        options: [
            { value: 'freedom', label: 'Complete Freedom & Early Retirement', icon: Globe, color: 'var(--accent-primary)' },
            { value: 'legacy', label: 'Providing Generational Wealth', icon: Heart, color: 'var(--danger)' },
            { value: 'travel', label: 'Traveling the world endlessly', icon: Compass, color: 'var(--success)' },
            { value: 'empire', label: 'Building a business or empire', icon: Zap, color: 'var(--warning)' },
        ]
    },
    {
        id: 'commitment',
        title: 'How involved do you plan to be inside DreamWealthy?',
        subtitle: 'Your commitment guarantees your result.',
        options: [
            { value: 'daily', label: 'Quick daily check-ins (5 mins/day)', icon: Clock, color: 'var(--success)' },
            { value: 'weekly', label: 'Weekly deep dives (1 hour/week)', icon: Target, color: 'var(--accent-primary)' },
            { value: 'all_in', label: 'Fully engaged – whatever it takes', icon: Zap, color: 'var(--danger)' },
        ]
    }
];

const TOTAL_STEPS = ONBOARDING_QUESTIONS.length + 2;

const Onboarding = () => {
    const navigate = useNavigate();
    const { user, completeOnboarding } = useAuth();
    const { playPop } = useSound();
    const store = useStore();
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState({});
    const [useDemoData, setUseDemoData] = useState(true);

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
            <Card glass className="onboarding-card" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                
                {/* Modern Progress Bar instead of 10 crowded dots */}
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '32px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.4s ease-in-out' }} />
                </div>

                {step === 1 && (
                    <div className="slide-up-fade" key="step1">
                        <div className="onboarding-header">
                            <h1>Welcome, {firstName}!</h1>
                            <p>We're thrilled to have you. Before we construct your dashboard, let's architect your financial profile.</p>
                        </div>
                        <div className="onboarding-actions" style={{ marginTop: '40px' }}>
                            <Button style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={handleNext}>
                                Start Profiler <ArrowRight size={20} style={{ marginLeft: '8px' }}/>
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

                            <div className="goal-selection-container" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                                {question.options.map((opt) => {
                                    const isSelected = answers[question.id] === opt.value;
                                    const Icon = opt.icon;
                                    return (
                                        <div 
                                            key={opt.value}
                                            className={`goal-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption(question.id, opt.value)}
                                            style={{ 
                                                flexDirection: 'row', alignItems: 'center', textAlign: 'left', padding: '16px 20px', gap: '20px',
                                                ...(isSelected ? { borderColor: opt.color || 'var(--accent-primary)', background: 'rgba(255,255,255,0.05)' } : {})
                                            }}
                                        >
                                            <Icon size={28} color={isSelected ? (opt.color || 'var(--accent-primary)') : 'var(--text-secondary)'} />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: isSelected ? '#fff' : 'inherit' }}>{opt.label}</h3>
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
                            <h2>Profile Complete.</h2>
                            <p>Your dashboard is ready. Feel free to dive straight in, or take a quick interactive tour to see where the magic happens.</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                           <Compass size={64} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 16px var(--accent-glow))' }}/>
                        </div>

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

                        <div className="onboarding-actions" style={{ flexDirection: 'column' }}>
                            <Button style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => handleComplete(true)}>
                                Take the Interactive Tour
                            </Button>
                            <Button variant="secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => handleComplete(false)}>
                                Skip straight to Dashboard
                            </Button>
                        </div>
                    </div>
                )}

            </Card>
        </div>
    );
};

export default Onboarding;
