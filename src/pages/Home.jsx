import React, { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { UserLevelBadge } from '../components/dashboard/UserLevelBadge';
import { BudgetWidget } from '../components/dashboard/BudgetWidget';
import { useFinancialContext } from '../FinancialContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
import { useXP } from '../contexts/XPContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { generateInsights } from '../utils/insightsEngine';
import { AnimateOnScroll } from '../components/ui/AnimateOnScroll';
import { MonthlyReportGenerator } from '../components/MonthlyReportGenerator';
import { GamificationCard } from '../components/GamificationCard';
import './Home.css';
// Custom Tooltip for Area Charts (Single Value)
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip" style={{ backgroundColor: 'rgba(15,15,20,0.95)', border: 'none', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', padding: '10px 18px' }}>
                <p className="tooltip-label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{label}</p>
                <p className="tooltip-value" style={{ color: '#fff', fontWeight: '700', fontSize: '1.25rem', margin: 0 }}>
                    ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Line Chart (Dual Value)
const DualLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip" style={{ backgroundColor: 'rgba(15,15,20,0.95)', border: 'none', backdropFilter: 'blur(16px)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', padding: '12px 18px' }}>
                <p className="tooltip-label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="tooltip-row" style={{ color: entry.stroke || entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px', margin: '4px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        <span className="tooltip-name">{entry.name}:</span>
                        <span className="tooltip-amount">${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playPop } = useSound();
    const { addXP } = useXP();
    const { theme, expenseBorderColor } = useTheme();
    const borderGlowClass = expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const contextData = useFinancialContext();
    const {
        getProjectionData,
        portfolio,
        plaidAccounts,
        totalExpenses
    } = contextData;

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7', white: '#ffffff', black: '#000000',
        red: '#FF0000', green: '#10B981', purple: '#8b5cf6', pink: '#ec4899',
        yellow: '#eab308', orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#818CF8' : '#4FA3F7') : (theme === 'dark' ? '#818CF8' : '#4FA3F7');

    const insights = useMemo(() => generateInsights(contextData), [contextData]);
    const _positiveInsight = insights.find(i => i.type === 'success');

    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.65;
            videoRef.current.play().catch(() => {});
        }

        // Gamification Daily Login Check
        const lastLogin = localStorage.getItem('dream_wealthy_last_login');
        const today = new Date().toDateString();
        
        if (lastLogin !== today) {
            localStorage.setItem('dream_wealthy_last_login', today);
            setTimeout(() => addXP(10, 'Daily Check-in'), 1500); // Slight delay for dramatic effect
        }
    }, [addXP]);


    // Fetch 6-month projection data starting from the current month
    // We only call getProjectionData once and map it for all three panels!
    const sixMonthProjection = getProjectionData(6, new Date().getMonth());

    const incomeExpenseData = sixMonthProjection.map(item => ({
        month: item.month.substring(0, 3),
        income: item.Income,
        expenses: item.Expenses
    }));

    // Panel 2: Portfolio Net Worth from Actual Investments Data
    const totalPortfolioValue = useMemo(() => {
        return (portfolio || []).reduce((acc, p) => acc + ((p.price || p.avgPrice || 0) * (p.quantity || 0)), 0);
    }, [portfolio]);


    const portfolioChartData = useMemo(() => {
        if (!totalPortfolioValue) {
            return sixMonthProjection.map(item => ({ month: item.month.substring(0, 3), value: 0 }));
        }

        const data = [];
        let currentValue = totalPortfolioValue * 0.85; // Assume 15% growth over 6 months
        const step = (totalPortfolioValue - currentValue) / 5;

        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const monthName = date.toLocaleString('default', { month: 'short' });
            
            const isLast = i === 5;
            const variance = Math.sin(i * 1.5) * (totalPortfolioValue * 0.02);
            let value = isLast ? totalPortfolioValue : currentValue + variance;

            data.push({
                month: monthName,
                value: Math.max(0, value)
            });
            currentValue += step;
        }
        return data;
    }, [totalPortfolioValue, sixMonthProjection]);

    const futureChartData = sixMonthProjection.map(item => ({
        month: item.month.substring(0, 3),
        value: item.Cumulative
    }));
    const projected6MonthTotal = futureChartData[futureChartData.length - 1]?.value || 0;

    return (
        <div className="home-container animate-fade-in">


            {/* Hero Section */}
            <section className="hero-section">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="hero-video-bg"
                >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-content" style={{ position: 'relative' }}>

                    <div className="fade-in-up" style={{ width: '100%', maxWidth: '480px', margin: '0 auto', marginTop: 'calc(40vh + 8px)' }}>
                        <Card glass className="hero-box" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', '--hero-border-color': activeColor, '--hero-shadow-color': `${activeColor}33` }}>
                            <div className="hero-actions" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                                <Button variant="secondary" style={{ flex: 1, padding: '16px 32px', fontSize: '1.1rem', height: 'auto' }} className={borderGlowClass} onClick={() => { playPop(); document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' }); }}>
                                    Enter Dashboard
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, padding: '16px 32px', fontSize: '1.1rem', height: 'auto' }} onClick={() => { playPop(); navigate(user ? '/income' : '/signup'); }}>
                                    Start Planning <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Overview Dashboard */}
            <section id="dashboard" className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Financial Overview</h2>
                    <MonthlyReportGenerator className={borderGlowClass} />
                </div>

                {/* Ultra Premium Profile Badge Engine */}
                <AnimateOnScroll delay={0.4}>
                    <UserLevelBadge />
                </AnimateOnScroll>

                {/* Monthly Autopilot Budget Widget */}
                <AnimateOnScroll delay={0.5}>
                    <BudgetWidget />
                </AnimateOnScroll>

                <div className="dashboard-panels">
                    {/* Panel 1: Income & Expenses Line Chart */}
                    <AnimateOnScroll delay={0.1}>
                        <Card glass className={`glass-panel-card ${borderGlowClass}`} style={{ height: '100%' }}>
                            <h3 className="panel-title">Income & Expenses</h3>
                            <p className="panel-subtitle">6-Month Trailing</p>

                            <div className="panel-chart flex-1" style={{ marginTop: 'auto' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={incomeExpenseData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <filter id="glowIncome" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                <feComponentTransfer in="blur" result="fadedBlur">
                                                    <feFuncA type="linear" slope="0.4" />
                                                </feComponentTransfer>
                                                <feComposite in="SourceGraphic" in2="fadedBlur" operator="over" />
                                            </filter>
                                            <filter id="glowExpenses" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                <feComponentTransfer in="blur" result="fadedBlur">
                                                    <feFuncA type="linear" slope="0.4" />
                                                </feComponentTransfer>
                                                <feComposite in="SourceGraphic" in2="fadedBlur" operator="over" />
                                            </filter>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} tickMargin={12} minTickGap={20} />
                                        <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`} width={40} tickMargin={8} />
                                        <Tooltip content={<DualLineTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowIncome)" />
                                        <Area type="linear" dataKey="expenses" name="Expenses" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenses)" activeDot={{ r: 5, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowExpenses)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button variant="secondary" className={`full-width-btn ${borderGlowClass}`} onClick={() => { playPop && playPop(); navigate('/income'); }}>
                                    Manage Entries
                                </Button>
                            </div>
                        </Card>
                    </AnimateOnScroll>

                    {/* Panel 2: Portfolio / Net Worth Chart */}
                    <AnimateOnScroll delay={0.2}>
                        <Card glass className={`glass-panel-card ${borderGlowClass}`} style={{ height: '100%' }}>
                            <h3 className="panel-title">Portfolio</h3>
                            <div className="panel-chart flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={portfolioChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <filter id="glowPortfolio" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                <feComponentTransfer in="blur" result="fadedBlur">
                                                    <feFuncA type="linear" slope="0.4" />
                                                </feComponentTransfer>
                                                <feComposite in="SourceGraphic" in2="fadedBlur" operator="over" />
                                            </filter>
                                            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4FA3F7" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#4FA3F7" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} tickMargin={12} minTickGap={20} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="value" stroke="#4FA3F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPortfolio)" activeDot={{ r: 5, fill: '#4FA3F7', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowPortfolio)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button variant="secondary" className={`full-width-btn ${borderGlowClass}`} onClick={() => { playPop && playPop(); navigate('/investments'); }}>View Investments</Button>
                            </div>
                        </Card>
                    </AnimateOnScroll>

                    {/* Panel 3: Financial Future / Savings Growth */}
                    <AnimateOnScroll delay={0.3}>
                        <Card glass className={`glass-panel-card ${borderGlowClass}`} style={{ height: '100%' }}>
                            <h3 className="panel-title">Your Financial Future</h3>
                            <p className="panel-subtitle">Savings growth in 6 months</p>
                            <h2 className="panel-hero-number text-gradient">${projected6MonthTotal.toLocaleString()}</h2>

                            <div className="panel-chart flex-1" style={{ marginTop: 'auto' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={futureChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <filter id="glowFuture" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                <feComponentTransfer in="blur" result="fadedBlur">
                                                    <feFuncA type="linear" slope="0.4" />
                                                </feComponentTransfer>
                                                <feComposite in="SourceGraphic" in2="fadedBlur" operator="over" />
                                            </filter>
                                            <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} tickMargin={12} minTickGap={20} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="value" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFuture)" activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowFuture)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button variant="secondary" className={`full-width-btn ${borderGlowClass}`} onClick={() => { playPop && playPop(); navigate('/projections'); }}>
                                    Run Projections
                                </Button>
                            </div>
                        </Card>
                    </AnimateOnScroll>
                </div>

                {/* Gamification & Rank Progression Matrix */}
                <AnimateOnScroll delay={0.35}>
                    <GamificationCard />
                </AnimateOnScroll>
            </section >
        </div >
    );
};

export default Home;
