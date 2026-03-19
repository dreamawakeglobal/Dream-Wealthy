import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Target, TrendingUp, Compass } from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user, completeOnboarding } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // Extract first name gracefully
    const firstName = user?.user_metadata?.first_name || 
                     user?.user_metadata?.full_name?.split(' ')[0] || 
                     'there';

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleComplete = async (startTour) => {
        if (completeOnboarding) {
            await completeOnboarding(startTour);
        } else {
            console.warn("completeOnboarding function missing in AuthContext");
        }
        // Ensure redirect if startTour is chosen, the TutorialOverlay handles the rest.
        if (startTour) {
            navigate('/');
        } else {
            navigate('/dashboard'); 
        }
    };

    return (
        <div className="onboarding-page-container slide-up-fade">
            <Card glass className="onboarding-card">
                
                <div className="onboarding-step-indicator">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
                    <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
                </div>

                {step === 1 && (
                    <div className="slide-up-fade" key="step1">
                        <div className="onboarding-header">
                            <h1>Welcome, {firstName}!</h1>
                            <p>We're thrilled to have you. Let's get your dashboard set up precisely how you want it.</p>
                        </div>
                        <div className="onboarding-actions" style={{ marginTop: '40px' }}>
                            <Button style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={handleNext}>
                                Get Started <ArrowRight size={20} style={{ marginLeft: '8px' }}/>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="slide-up-fade" key="step2">
                        <div className="onboarding-header">
                            <h2>What is your primary focus?</h2>
                            <p>We will tailor your insights specifically to this goal.</p>
                        </div>

                        <div className="goal-selection-container">
                            <div 
                                className={`goal-option ${selectedGoal === 'wealth' ? 'selected' : ''}`}
                                onClick={() => setSelectedGoal('wealth')}
                            >
                                <TrendingUp size={28} color={selectedGoal === 'wealth' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                                <h3>Build Wealth</h3>
                                <p>Grow assets and compound portfolio value</p>
                            </div>
                            
                            <div 
                                className={`goal-option ${selectedGoal === 'debt' ? 'selected' : ''}`}
                                onClick={() => setSelectedGoal('debt')}
                            >
                                <Target size={28} color={selectedGoal === 'debt' ? 'var(--danger)' : 'var(--text-secondary)'} />
                                <h3>Destroy Debt</h3>
                                <p>Aggressively pay down liabilities</p>
                            </div>
                        </div>

                        <div className="onboarding-actions">
                            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                            <Button disabled={!selectedGoal} onClick={handleNext}>
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="slide-up-fade" key="step3">
                        <div className="onboarding-header">
                            <h2>Choose Your Path</h2>
                            <p>Your dashboard is ready. Feel free to dive straight in, or take a quick 3-step interactive tour to see where the magic happens.</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                           <Compass size={64} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 16px var(--accent-glow))' }}/>
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
