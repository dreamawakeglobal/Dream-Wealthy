import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Search, ChevronDown, ShieldCheck, RefreshCw, HelpCircle, DollarSign, Sparkles } from 'lucide-react';
import { useSound } from '../SoundContext';
import { useTheme } from '../contexts/ThemeContext';
import './FAQAccordion.css';

const FAQ_ITEMS = [
    {
        id: 'faq-1',
        category: 'security',
        question: 'Is my financial data secure on Dream Wealthy?',
        answer: 'Yes. Your security is our top priority. We use bank-grade 256-bit AES encryption at rest and TLS 1.3 encryption in transit. Your bank credentials are never seen, handled, or stored by Dream Wealthy. Access tokens are isolated in a private server database with strict Row Level Security (RLS).'
    },
    {
        id: 'faq-2',
        category: 'syncing',
        question: 'How does Plaid bank account syncing work?',
        answer: 'Dream Wealthy integrates with Plaid to create a read-only, encrypted bridge with over 12,000 financial institutions. Plaid securely transmits account balances and transaction histories into your dashboard without giving anyone access to move or touch your funds.'
    },
    {
        id: 'faq-3',
        category: 'pricing',
        question: 'Can I cancel or change my subscription anytime?',
        answer: 'Absolutely. You can upgrade, downgrade, or cancel your subscription at any time directly from your Settings page. If you cancel, your premium features remain active until the end of your current billing period.'
    },
    {
        id: 'faq-4',
        category: 'tools',
        question: 'Are AI Financial Advisor insights certified financial advice?',
        answer: 'No. The AI Financial Advisor and automated projections provide educational, algorithmic insights and budgeting analysis based on your numbers. They do not constitute certified financial planning, tax, or legal advice. We recommend consulting a licensed professional before making major financial moves.'
    },
    {
        id: 'faq-5',
        category: 'tools',
        question: 'How does the Debt Destroyer snowball & avalanche tool work?',
        answer: 'Our Debt Destroyer analyzes your interest rates, minimum payments, and balances to calculate exact payoff dates. You can toggle between the Snowball method (quickest wins) or Avalanche method (maximum interest saved) to see how extra monthly payments accelerate your financial freedom.'
    },
    {
        id: 'faq-6',
        category: 'security',
        question: 'What happens to my data if I delete my account?',
        answer: 'You own your data. If you delete your account or request account purging, all associated transactions, custom projections, income streams, and AI conversation records are permanently erased from our primary servers instantly.'
    },
    {
        id: 'faq-7',
        category: 'pricing',
        question: 'Is there a free trial or money-back guarantee?',
        answer: 'Yes! All paid subscription plans come with a 7-day money-back guarantee. If you are not completely satisfied within your first 7 days, contact our support team for a full refund.'
    },
    {
        id: 'faq-8',
        category: 'syncing',
        question: 'What should I do if my bank connection shows "Connection Paused"?',
        answer: 'Financial institutions occasionally require quick multi-factor authentication or password verification. When an account requires relinking, a security banner will appear allowing you to re-authenticate cleanly in seconds through Plaid Link.'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'security', label: 'Security & Privacy', icon: ShieldCheck },
    { id: 'syncing', label: 'Bank Syncing', icon: RefreshCw },
    { id: 'pricing', label: 'Pricing & Plans', icon: DollarSign },
    { id: 'tools', label: 'Debt & AI Tools', icon: Sparkles }
];

export const FAQAccordion = ({ title = "Frequently Asked Questions", subtitle = "Got questions? We've got answers. Explore our guides below." }) => {
    const { playPop } = useSound();
    const { theme, expenseBorderColor } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openId, setOpenId] = useState('faq-1');

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#10B981', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#38bdf8' : '#0284c7') : 'var(--accent-primary, #0ea5e9)';

    const toggleAccordion = (id) => {
        if (playPop) playPop();
        setOpenId(prev => prev === id ? null : id);
    };

    const filteredItems = useMemo(() => {
        return FAQ_ITEMS.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const matchesSearch = searchQuery === '' || 
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    return (
        <div className="faq-accordion-container animate-fade-in">
            <div className="faq-header text-center">
                <h2 className="faq-title">{title}</h2>
                {subtitle && <p className="faq-subtitle text-muted">{subtitle}</p>}
            </div>

            {/* Category Filter Tabs */}
            <div className="faq-category-tabs">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            className={`faq-cat-btn ${isActive ? 'active' : ''}`}
                            onClick={() => { if (playPop) playPop(); setSelectedCategory(cat.id); }}
                            style={isActive ? { borderColor: activeColor, color: activeColor } : {}}
                        >
                            <Icon size={16} />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Input Filter */}
            <div className="faq-search-wrapper">
                <Search size={18} className="faq-search-icon" />
                <input
                    type="text"
                    className="faq-search-input"
                    placeholder="Search security, Plaid, debt tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="faq-search-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
            </div>

            {/* Accordion List */}
            <div className="faq-list">
                {filteredItems.length === 0 ? (
                    <Card glass className="faq-empty-card text-center">
                        <HelpCircle size={36} className="faq-empty-icon" />
                        <p>No questions matching "{searchQuery}". Have a specific question?</p>
                        <a href="/contact" className="faq-contact-link">Contact Support →</a>
                    </Card>
                ) : (
                    filteredItems.map(item => {
                        const isOpen = openId === item.id;
                        return (
                            <Card 
                                key={item.id} 
                                glass 
                                className={`faq-card ${isOpen ? 'open' : ''}`}
                                style={isOpen ? { borderColor: `${activeColor}60` } : {}}
                            >
                                <button 
                                    className="faq-question-btn" 
                                    onClick={() => toggleAccordion(item.id)}
                                    aria-expanded={isOpen}
                                >
                                    <span className="faq-question-text">{item.question}</span>
                                    <ChevronDown 
                                        size={20} 
                                        className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
                                        style={isOpen ? { color: activeColor } : {}}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="faq-answer-body animate-fade-in">
                                        <p>{item.answer}</p>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FAQAccordion;
