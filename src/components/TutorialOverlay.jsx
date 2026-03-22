import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../SoundContext';
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
    const { isTutorialActive, setTutorialActive } = useAuth();
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
            target: '.hero-actions button:first-child', // Enter Dashboard button on Home
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Welcome to DreamWealthy</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Let's take a quick premium tour of your financial engine! First, we'll start at your Dashboard. Click this button to jump straight to your financial control center.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightPadding: 10,
            disableBeacon: true,
        },
        {
            target: '#dashboard', // ID attached to the main Home.jsx dashboard section
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Financial Overview</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        These charts aggregate your total net worth and cash flow over a 6-month trailing window. Watch your "Financial Future" chart compound as you optimize your spending.
                    </p>
                </div>
            ),
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.nav-link[href="/income"]', // The Income/Streams nav link
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Manage Your Streams</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Next, let's head over to the Streams page to design your cash flow architecture and manage your income and expenses.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true, // Allow clicking the link explicitly
        },
        {
            target: '.income-column:first-child .income-form-card', // Add Stream form
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Add Your Income Stream</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Start by adding your primary income source (e.g., Salary, Business). The engine will automatically track your progress against actual connected bank deposits.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.income-column:nth-child(2)', // Future Streams column
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Manifest Future Streams</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Design your future cash flow. Add your target or prospective income streams here to see how they will impact your financial projections and wealth distribution!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.goals-section', // Savings Goal inside Income
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Create Savings Goals</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Set a target for an emergency fund, vacation, or investment account. The engine calculates exactly how many months until you hit it based on your cash flow.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.allocation-dashboard', // Allocations section inside Income
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Define Your Allocations</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Use these sliders to distribute your remaining cash flow across your goals. Watch the dynamic pie chart react as you optimize your strategy passive wealth growth!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.nav-link[href="/expenses"]', // The Expenses nav link
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Track Your Spending</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Now let's head over to the Expenses page to configure your fixed bills, variable spending, and debt strategies.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.fixed-expense-box', // Fixed expenses
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Fixed Expenses</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        These are your essential, predictable monthly bills like rent, utilities, and insurance. The engine will automatically track these against your connected bank withdrawals.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.variable-expense-box', // Variable expenses
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Variable Spending Limits</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Set budgets for flexible expenses like groceries, dining out, and entertainment. Stay under these limits to maximize your wealth allocations at the end of the month!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.subscription-box', // Subscriptions
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Manage Subscriptions</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Keep an eye on recurring digital subscriptions quickly here so you don't leak money on unused services.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.debt-tracker-card', // Debt Tracker
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Monthly Debt Tracker</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Track your minimum payments and due dates across loans and credit cards. Managing all debts in one place builds credit and prevents slip-ups.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.strategy-card-box', // Attack Strategy
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Debt Attack Strategy</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Select your debt payoff methodology (Avalanche or Snowball) and project exactly when you'll reach ultimate freedom. The line chart adapts realistically as you allocate excess cash flow here.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.nav-link[href="/projections"]', // The Projections nav link
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Project Your Future</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Finally, let's explore the Projections page. This is where the DreamWealthy engine simulates your long-term wealth accumulation.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.chart-container', // Net Wealth Curve Area Chart
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Net Wealth Curve</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Visualize your financial trajectory. The curve maps your cumulative wealth growth over time, dynamically factoring in inflation and your customized flows.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.table-container', // Month-by-Month Breakdown Table
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Month-by-Month Breakdown</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Dive into the math. Analyze exactly how your cash flows month over month. You can even click on the numbers directly to override specific months for precision planning!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.configure-projections-btn', // Projection Engine Controls
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Projection Engine</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Fine-tune your simulation. Adjust your starting balances, add hypothetical extra flows, and tweak inflation and income growth rates to stress-test your wealth strategy.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.nav-link[href="/investments"]', // The Investments nav link
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Grow Your Wealth</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Lastly, welcome to the Investments page! Build your ultimate portfolio to passively outpace inflation.
                    </p>
                </div>
            ),
            placement: 'right',
            spotlightPadding: 5,
            spotlightClicks: true,
        },
        {
            target: '.portfolio-bottom-chart', // Portfolio Performance
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Portfolio Performance</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Watch your net worth come alive. This interactive candlestick chart simulates the real-world volatility of your custom portfolio over time based on actual market data.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.sidebar-card', // Market Drawer
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Market Drawer</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Browse live market assets across Stocks, Crypto, and Commodities. Use the category dropdown and search bar to find your favorite tickers.
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.dropzone-card', // Your Holdings
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Your Holdings</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Drag and drop assets from the Drawer directly into this zone! Edit your quantities and cost basis to accurately track your real-world gains and losses.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.viz-card', // Total Value Header Pie Chart
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Allocation Breakdown</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Keep your portfolio balanced. This pie chart provides a visual breakdown of your asset allocation, helping you manage risk and maintain your strategy.
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.floating-notes-btn', // Cloud Notepad
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Your Cloud Notepad</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Jot down strategies, reminders, or ideas. Your notes are automatically saved locally and attached to this specific page for easy context!
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.audio-toggle-btn', // Music Button
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Background Audio</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Control the ambient Lo-Fi focus tracks here. Toggle the music on or off while you plan your empire!
                    </p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '.fixed-system-toggle', // Theme Button
            content: (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Theme Toggle</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
                        Switch seamlessly between Dark Mode and Light Mode anytime. 
                        This concludes the grand tour. Start building your Dream Wealth!
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
                    borderRadius: '12px',
                    border: '4px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 0 25px rgba(255, 255, 255, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.3)',
                }
            }}
        />
    );
};

