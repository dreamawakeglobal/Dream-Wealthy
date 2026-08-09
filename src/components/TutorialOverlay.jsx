import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../SoundContext';
import { supabase } from '../supabaseClient';
import './TutorialOverlay.css';

// Premium Custom Tooltip built with Framer Motion
const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    size
}) => {
    const { playPop } = useSound();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            {...tooltipProps}
            className="custom-joyride-tooltip glass"
            style={{
                minWidth: '450px',
                maxWidth: '500px',
                padding: '24px',
                borderRadius: '16px',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                backgroundColor: 'rgba(20, 20, 25, 0.85)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                zIndex: 10000
            }}
        >
            <div className="tooltip-inner-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: 'var(--accent-primary, #38bdf8)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}>
                        Step {index + 1} of {size}
                    </span>
                </div>
                {step.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} style={{
                            width: i === index ? '16px' : '6px',
                            height: '6px',
                            borderRadius: '4px',
                            backgroundColor: i === index ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {index > 0 && (
                        <button {...backProps} onClick={(e) => { if(playPop) playPop(); if(backProps.onClick) backProps.onClick(e); }} style={{
                            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 12px', fontWeight: 500, transition: 'color 0.2s'
                        }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                            Back
                        </button>
                    )}
                    <button {...primaryProps} onClick={(e) => { if (primaryProps.onClick) primaryProps.onClick(e); }} style={{
                        background: 'var(--accent-gradient, linear-gradient(135deg, var(--accent-primary) 0%, #00d4ff 100%))',
                        color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, padding: '10px 18px',
                        boxShadow: '0 4px 14px rgba(0, 150, 255, 0.3)', transition: 'transform 0.1s, filter 0.2s'
                    }} onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'} onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'} onMouseDown={(e) => e.target.style.transform = 'scale(0.96)'} onMouseUp={(e) => e.target.style.transform = 'scale(1)'}>
                        {continuous && index < size - 1 ? 'Next' : 'Finish Tour'}
                    </button>
                </div>
            </div>
            
            {/* Minimal Skip Button in corner */}
            {index < size - 1 && (
                <button {...closeProps} onClick={(e) => { if(playPop) playPop(); if(closeProps.onClick) closeProps.onClick(e); }} style={{
                    position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px'
                }} onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
                    Skip
                </button>
            )}
        </motion.div>
    );
};

export const TutorialOverlay = () => {
    const { isTutorialActive, setTutorialActive, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [stepIndex, setStepIndex] = useState(0);

    // Automatically advance steps if the user manually navigates instead of clicking "Next"
    useEffect(() => {
        if (isTutorialActive) {
            // If they are on step 0 and they navigate from Home to Dashboard manually
            if (location.pathname === '/dashboard' && stepIndex === 0) {
                // They clicked "Enter Dashboard", wait a split second for the view to render
                setTimeout(() => setStepIndex(1), 300);
            }
            
            // If they navigate from Dashboard to Income manually
            if (location.pathname === '/income' && stepIndex === 2) {
                setTimeout(() => setStepIndex(3), 400); // Wait for page transition
            }
            
            // If they navigate from Income to Expenses manually
            if (location.pathname === '/expenses' && stepIndex === 7) {
                setTimeout(() => setStepIndex(8), 400); // Wait for page transition
            }
            
            // If they navigate from Expenses to Projections manually
            if (location.pathname === '/projections' && stepIndex === 13) {
                setTimeout(() => setStepIndex(14), 400); // Wait for page transition
            }
            
            // If they navigate from Projections to Investments manually
            if (location.pathname === '/investments' && stepIndex === 18) {
                setTimeout(() => setStepIndex(19), 400); // Wait for page transition
            }
        }
    }, [location.pathname, isTutorialActive, stepIndex]);

    // Toggle document scroll lock based on tutorial state
    useEffect(() => {
        if (isTutorialActive) {
            // Prevent manual scrolling via the mousewheel or touch dragging, 
            // but keep structure intact so JS can still scrollTo elements programmatically!
            document.body.style.overflow = 'hidden';
            document.documentElement.style.scrollBehavior = 'smooth';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.scrollBehavior = '';
        }

        return () => {
            // Always clean up when component unmounts
            document.body.style.overflow = '';
            document.documentElement.style.scrollBehavior = '';
        };
    }, [isTutorialActive]);

    const steps = [
        {
            target: '.hero-actions button:first-child',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Welcome to the Engine</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        You've just unlocked your financial command center. Let's initialize your private wealth environment. Click here to boot up the Dashboard.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightPadding: 10,
            disableBeacon: true,
        },
        {
            target: '#dashboard',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Core Feed</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        This is your global financial heartbeat. Watch your net worth automatically compound and aggregate across all live data streams in real-time.
                    </p>
                </div>
            ),
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.nav-link[href="/income"]',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Wealth Architecture</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Every empire needs cash flow. Let's switch over to your Streams control panel to architect your precise flow of capital.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.income-column:first-child',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Current Streams</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Inject your active income metrics here—like salaries, dividends, and business yields. The engine automatically tracks these against live bank deposits.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.income-column:nth-child(2)',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Manifestation Drive</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        What you write here, becomes reality. Plot targets for future acquisitions or side hustles, and the engine will simulate how they accelerate your financial trajectory.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.goals-section',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Lock In Targets</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Set acquisition goals—a hypercar, an emergency fund, a luxury escape. The system algorithmically calculates the exact month you will cross the finish line.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.allocation-dashboard',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Command Your Capital</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Use these dynamic sliders to distribute surplus cash across your goals and investments. Automate the wealth pipeline so you passively grow richer by the minute.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.nav-link[href="/expenses"]',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Plugging The Leaks</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        It's not what you make; it's what you keep. Let's securely navigate to the Expenses terminal to bring order to your spending.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.fixed-expense-box',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Baseline Operations</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Configure your non-negotiables: rent, utilities, insurance. The engine will relentlessly monitor connected accounts to flag unexpected withdrawal spikes.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.variable-expense-box',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Tactical Spending Allowances</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Set hard limits on variable outflow like dining and lifestyle. Remaining under these thresholds maximizes the massive upside shown in your Allocations dashboard!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.subscription-box',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Subscription Radar</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Isolate and execute parasitic, unused recurring services here before they bleed your wealth potential over the decades.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.debt-tracker-card',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Debt Surveillance</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Aggregate every loan, credit card, and parasitic balance across your lifetime. Centralizing them prevents missed cross-fire payments and protects your credit score.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.strategy-card-box',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Destroyer Protocol</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Engage the Avalanche or Snowball methodology. The system calculates your precise 'Debt Free' zero-day instantly based on your excess capital firepower.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.nav-link[href="/projections"]',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Simulate Your Reality</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        You've built the engine. Now let's calculate the trajectory. Switch to the Projections core to simulate your life mathematically.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.chart-container',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Gravity Curve</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        This is the visual representation of your financial escape velocity. The curve maps your aggregated snowballing wealth across millions of data points over decades.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.table-container',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Molecular Breakdown</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Drill directly into the raw math. Every single projected month is itemized and clickable, allowing you to manually override nodes for ruthless precision.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.configure-projections-btn',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Simulation Parameters</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Access the master controls. Tweak inflation algorithms, market return thresholds, and theoretical income injects to stress-test your strategy against economic realities.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.nav-link[href="/investments"]',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Multiply Capital</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Saving alone guarantees a loss due to inflation. Navigate to the Investments wing to build a portfolio that hunts yields while you sleep.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.portfolio-bottom-chart',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Live Market Pulse</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Watch your portfolio breathe. This interactive terminal connects your local entries to external market tickers to simulate authentic volatility and alpha generation.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.sidebar-card',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>The Asset Drawer</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Access thousands of indexed assets natively. From tech giants to exotic crypto, use the categorized terminal to locate your ultimate acquisitions.
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.dropzone-card',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Your Vault Space</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Click & drag assets from the Drawer directly into this vault interface. Assign your cost basis and quantity to fuse them into your total net worth tracking.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.viz-card',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Diversification Visualizer</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Don't let a single volatile asset tank your timeline. Use the instant allocation map to ensure your risk exposure is precisely balanced against your horizon.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.floating-notes-btn',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Encrypted Cloud Brain</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Offload your thoughts. Map out complex trade execution plans and sudden epiphanies—they securely persist exactly on the page they were generated.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.ai-fab-button',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>High-Intelligence Persona</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        You're never operating alone. This embedded intelligence constantly interprets your exact portfolio layout and provides hyper-contextualized strategic counsel.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.profile-button',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Identity & Integrations</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Manage your secure biometric authentications, establish API pipelines directly to your banks via Plaid, and recalibrate your global metrics.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.bell-button',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Master Notification Terminal</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        The engine intercepts everything. Automated sync successes, broken bank connections, and system updates are permanently archived here for your review.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.audio-toggle-btn',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Atmospheric Modulation</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Building your legacy requires extreme focus. Toggle the native ambient acoustics here to completely tune out the noise.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.fixed-system-toggle',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Dark/Light Override</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Instantly cross paths between high-contrast dark mode aesthetics and precision light mode optics. You are officially plugged in. End simulation.
                    </p>
                </div>
            ),
            placement: 'top',
        }
    ];

    // Global click interceptor to catch clicks on tutorial targets
    useEffect(() => {
        if (!isTutorialActive) return;

        const handleDocumentClick = (e) => {
            const currentStep = steps[stepIndex];
            if (!currentStep || !currentStep.target) return;

            const targetElement = document.querySelector(currentStep.target);
            
            // If the user clicked ON the targeted element
            if (targetElement && targetElement.contains(e.target)) {
                // Determine next step
                const nextStepIndex = stepIndex + 1;
                
                // If it's the Enter Dashboard button (step 0), handle the route transition manually immediately
                if (stepIndex === 0) {
                     navigate('/dashboard');
                     setTimeout(() => setStepIndex(1), 300);
                     return;
                }
                
                // If it's the Stream tab (step 2), handle route transition
                if (stepIndex === 2) {
                     navigate('/income');
                     setTimeout(() => setStepIndex(3), 400);
                     return;
                }
                
                // If it's the Expenses tab (step 7), handle route transition
                if (stepIndex === 7) {
                     navigate('/expenses');
                     setTimeout(() => setStepIndex(8), 400);
                     return;
                }
                
                // If it's the Projections tab (step 13), handle route transition
                if (stepIndex === 13) {
                     navigate('/projections');
                     setTimeout(() => setStepIndex(14), 400);
                     return;
                }
                
                // If it's the Investments tab (step 18), handle route transition
                if (stepIndex === 18) {
                     navigate('/investments');
                     setTimeout(() => setStepIndex(19), 400);
                     return;
                }
                
                // Otherwise normal advancement
                if (nextStepIndex < steps.length) {
                    setStepIndex(nextStepIndex);
                } else {
                    setTutorialActive(false);
                    setStepIndex(0);
                }
            }
        };

        // Add to capture phase so it fires reliably
        document.addEventListener('click', handleDocumentClick, true);
        return () => document.removeEventListener('click', handleDocumentClick, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTutorialActive, stepIndex, navigate]);

    const handleJoyrideCallback = (data) => {
        const { status, action, index, type } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status) || action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
            setTutorialActive(false);
            setStepIndex(0);
            
            try {
                localStorage.setItem('dw_onboarding_completed', 'true');
            } catch (err) {
                console.debug(err);
            }

            if (user?.id) {
                supabase
                    .from('profiles')
                    .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.debug('Failed to update onboarding_completed in profile:', error);
                    });
            }
            return;
        }

        // Handle Next/Prev button clicks
        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            // If type is STEP_AFTER, it means they clicked Next or Prev
            const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            
            // Logic to force page navigation for seamless step transitions
            if (action === ACTIONS.NEXT) {
                if (index === 0) {
                    navigate('/dashboard');
                    setTimeout(() => setStepIndex(1), 400);
                    return;
                }
                if (index === 2) {
                    navigate('/income');
                    setTimeout(() => setStepIndex(3), 400);
                    return;
                }
                if (index === 7) {
                    navigate('/expenses');
                    setTimeout(() => setStepIndex(8), 400);
                    return;
                }
                if (index === 13) {
                    navigate('/projections');
                    setTimeout(() => setStepIndex(14), 400);
                    return;
                }
                if (index === 18) {
                    navigate('/investments');
                    setTimeout(() => setStepIndex(19), 400);
                    return;
                }
            }
            
            // Allow stepping past if missing
            if (type === EVENTS.TARGET_NOT_FOUND && action === ACTIONS.NEXT) {
               setStepIndex(index + 1);
            } else {
               setStepIndex(nextStepIndex);
            }
        } 
        
        // Handle direct clicks on spotlighted elements like the "Enter Dashboard" button
        if (type === EVENTS.TOOLTIP && action === ACTIONS.CLOSE) {
            // Custom close logic if they skip early via the tooltip 'x'
             setTutorialActive(false);
             setStepIndex(0);
        }

        // If a user clicks ON the spotlighted element, advance to the next step automatically 
        // if they are on Step 0 (Enter Dashboard button)
        if (type === EVENTS.BEACON || type === EVENTS.TOOLTIP) {
            // React joyride does not easily expose the raw click event on the target in continuous mode, 
            // so we rely on tracking route changes for 'Enter Dashboard' elsewhere if needed, 
            // OR manually advancing if they click 'Next' on the tooltip.
        }
    };

    if (!isTutorialActive) return null;

    // Prevent Joyride from mounting target-specific overlays if we are still on the wrong page.
    // This stops react-floater from crashing when it can't find a target immediately before navigation happens.
    const isReadyToRun = isTutorialActive;

    return (
        <Joyride
            steps={steps}
            stepIndex={stepIndex}
            run={isReadyToRun}
            continuous={true}
            showSkipButton={false} 
            showProgress={false}   
            tooltipComponent={CustomTooltip}
            callback={handleJoyrideCallback}
            disableOverlayClose={true} // Prevents closing on background click
            disableCloseOnEsc={true}   // Prevents hiding via ESC
            spotlightClicks={true}     // Allows clicking the highlighted target element!
            scrollOffset={250}         // Scroll enough to leave room for tooltips at the top 
            floaterProps={{ disableFlip: true }} // Forces placement (like 'top') to stay exactly where assigned
            styles={{
                options: {
                    arrowColor: 'rgba(20, 20, 25, 0.85)',
                    overlayColor: 'transparent',
                    zIndex: 10000,
                },
                spotlight: {
                    backgroundColor: 'transparent',
                    borderRadius: '16px',
                    border: '3px solid var(--accent-primary)',
                    boxShadow: '0 0 30px var(--accent-glow), inset 0 0 15px var(--accent-glow)',
                    animation: 'radarPulse 2.5s infinite ease-in-out'
                }
            }}
        />
    );
};

