import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import Layout from '../src/components/Layout';
import Navigation from '../src/components/Navigation';
import AudioPlayer from '../src/components/AudioPlayer';
import FloatingNotes from '../src/components/FloatingNotes';
import PointerGlow from '../src/components/PointerGlow';
import { TutorialOverlay } from '../src/components/TutorialOverlay';
import HelpLauncher from '../src/components/HelpLauncher';
import { AICoachModal } from '../src/components/dashboard/AICoachModal';
import { FinancialProvider } from '../src/FinancialContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { SoundProvider } from '../src/SoundContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { XPProvider } from '../src/contexts/XPContext';
import Home from '../src/pages/Home';
import Income from '../src/pages/Income';
import Expenses from '../src/pages/Expenses';
import Waitlist from '../src/pages/Waitlist';
import Onboarding from '../src/pages/Onboarding';
import { GoalsSection } from '../src/components/dashboard/GoalsSection';
import { useStore } from '../src/store';

const AllProviders = ({ children }) => (
    <BrowserRouter>
        <ThemeProvider>
            <AuthProvider>
                <SoundProvider>
                    <XPProvider>
                        <FinancialProvider>
                            {children}
                        </FinancialProvider>
                    </XPProvider>
                </SoundProvider>
            </AuthProvider>
        </ThemeProvider>
    </BrowserRouter>
);

describe('Component Rendering Check', () => {
    beforeEach(() => {
        // Populate sample transaction data and split data to test all reducers
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const dateStr = `${y}-${m}-15`;

        useStore.setState({
            transactions: [
                { id: 'tx_1', merchant_name: 'Target', amount: 100, date: dateStr, category: 'Shopping' },
                { id: 'tx_2', merchant_name: 'Shell', amount: 45, date: dateStr, category: 'Gas' },
                { id: 'tx_3', merchant_name: 'Employer Payroll', amount: -2500, date: dateStr, category: 'Income' }
            ],
            profileData: {
                transactionSplits: [
                    {
                        originalTxId: 'tx_1',
                        splits: [
                            { id: 'split_1_1', amount: 60, category: 'Groceries' },
                            { id: 'split_1_2', amount: 40, category: 'Hygiene & Household' }
                        ]
                    }
                ]
            }
        });
    });

    it('renders App without error', () => {
        try {
            render(<App />);
        } catch (e) {
            console.error('APP ERROR:', e);
            throw e;
        }
    });

    it('renders Layout without error', () => {
        try {
            render(<Layout />, { wrapper: AllProviders });
        } catch (e) {
            console.error('LAYOUT ERROR:', e);
            throw e;
        }
    });

    it('renders Navigation without error', () => {
        try {
            render(<Navigation />, { wrapper: AllProviders });
        } catch (e) {
            console.error('NAVIGATION ERROR:', e);
            throw e;
        }
    });

    it('renders Waitlist without error', () => {
        try {
            render(<Waitlist />, { wrapper: AllProviders });
        } catch (e) {
            console.error('WAITLIST ERROR:', e);
            throw e;
        }
    });

    it('renders Onboarding without error', () => {
        try {
            render(<Onboarding />, { wrapper: AllProviders });
        } catch (e) {
            console.error('ONBOARDING ERROR:', e);
            throw e;
        }
    });

    it('renders AudioPlayer without error', () => {
        try {
            render(<AudioPlayer />, { wrapper: AllProviders });
        } catch (e) {
            console.error('AUDIOPLAYER ERROR:', e);
            throw e;
        }
    });

    it('renders FloatingNotes without error', () => {
        try {
            render(<FloatingNotes />, { wrapper: AllProviders });
        } catch (e) {
            console.error('FLOATINGNOTES ERROR:', e);
            throw e;
        }
    });

    it('renders TutorialOverlay without error', () => {
        try {
            render(<TutorialOverlay />, { wrapper: AllProviders });
        } catch (e) {
            console.error('TUTORIALOVERLAY ERROR:', e);
            throw e;
        }
    });

    it('renders GoalsSection without error', () => {
        try {
            render(<GoalsSection />, { wrapper: AllProviders });
        } catch (e) {
            console.error('GOALSSECTION ERROR:', e);
            throw e;
        }
    });

    it('renders Income page without error', () => {
        try {
            render(<Income />, { wrapper: AllProviders });
        } catch (e) {
            console.error('INCOME ERROR:', e);
            throw e;
        }
    });

    it('renders Expenses page without error', () => {
        try {
            render(<Expenses />, { wrapper: AllProviders });
        } catch (e) {
            console.error('EXPENSES ERROR:', e);
            throw e;
        }
    });

    it('renders Home page without error', () => {
        try {
            render(<Home />, { wrapper: AllProviders });
        } catch (e) {
            console.error('HOME ERROR:', e);
            throw e;
        }
    });
});
