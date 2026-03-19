import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useFinancialContext } from '../FinancialContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../SoundContext';
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
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playPop } = useSound();
    const { expenseBorderColor } = useTheme();
    const borderGlowClass = expenseBorderColor !== 'none' ? `glow-color-${expenseBorderColor}` : '';
    const contextData = useFinancialContext();
    const {
        totalMonthlyIncome,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        get12MonthProjection,
        getProjectionData,
        portfolio
    } = contextData;

    const insights = useMemo(() => generateInsights(contextData), [contextData]);
    const positiveInsight = insights.find(i => i.type === 'success');

    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.65;
        }
    }, []);


    // Fetch 6-month projection data starting from the current month
    // We only call getProjectionData once and map it for all three panels!
    const sixMonthProjection = getProjectionData(6, new Date().getMonth(), new Date().getFullYear());

    const incomeExpenseData = sixMonthProjection.map(item => ({
        month: item.month.substring(0, 3),
        income: item.Income,
        expenses: item.Expenses
    }));

    // Panel 2: Portfolio Net Worth from Actual Investments Data
    const totalPortfolioValue = useMemo(() => {
        return (portfolio || []).reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);
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
            let value = isLast ? totalPortfolioValue : currentValue + (Math.random() - 0.5) * (totalPortfolioValue * 0.05);

            data.push({
                month: monthName,
                value: Math.max(0, value)
            });
            currentValue += step;
        }
        return data;
    }, [totalPortfolioValue]);

    const futureChartData = sixMonthProjection.map(item => ({
        month: item.month.substring(0, 3),
        value: item.Cumulative
    }));
    const projected6MonthTotal = futureChartData[futureChartData.length - 1]?.value || 0;

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
                    className="hero-video-bg"
                >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-content" style={{ position: 'relative' }}>
                    {positiveInsight && (
                        <div className="fade-in-up" style={{
                            position: 'absolute',
                            top: '20vh',
                            left: '0%',
                            transform: 'translate(-50%, -100%)', // Shift up so the *bottom* touches 40vh if it's supposed to sit above the buttons
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '0 20px',
                            zIndex: 10
                        }}>
                            <Card glass className="insight-card insight-success" style={{
                                margin: '0', display: 'flex', padding: '16px 24px', alignItems: 'center', gap: '16px', maxWidth: '600px', cursor: positiveInsight.actionLink ? 'pointer' : 'default', animation: 'float 6s ease-in-out infinite',
                                background: 'rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                borderTopWidth: '3px'
                            }} onClick={() => positiveInsight.actionLink && navigate(positiveInsight.actionLink)}>
                                <div className="insight-icon-wrapper" style={{ color: 'var(--success)', filter: 'drop-shadow(0 0 8px var(--success-glow))' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className="insight-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#000000' }}>{positiveInsight.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#000000' }}>{positiveInsight.message}</p>
                                </div>
                            </Card>
                        </div>
                    )}

                    <Card glass className="hero-box fade-in-up" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '480px', width: '100%', margin: '0 auto', marginTop: 'calc(40vh + 8px)' }}>
                        <div className="hero-actions" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                            <Button style={{ flex: 1, padding: '16px 32px', fontSize: '1.1rem', height: 'auto', borderRadius: '12px' }} onClick={() => { playPop(); document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' }); }}>
                                Enter Dashboard
                            </Button>
                            <Button variant="secondary" style={{ flex: 1, padding: '16px 32px', fontSize: '1.1rem', height: 'auto', borderRadius: '12px', color: 'black' }} onClick={() => { playPop(); navigate(user ? '/income' : '/signup'); }}>
                                Start Planning <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                            </Button>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Overview Dashboard */}
            <section id="dashboard" className="dashboard-section">
                <h2 className="section-title">Financial Overview</h2>

                <div className="metrics-grid">
                    <AnimateOnScroll delay={0.1}>
                        <Card glass className={`metric-card ${borderGlowClass}`}>
                            <div className="metric-icon-wrapper success">
                                <DollarSign size={24} />
                            </div>
                            <p className="metric-label">Total Monthly Income</p>
                            <h3 className="metric-value positive">
                                $<AnimatedNumber value={totalMonthlyIncome} />
                            </h3>
                        </Card>
                    </AnimateOnScroll>

                    <AnimateOnScroll delay={0.2}>
                        <Card glass className={`metric-card ${borderGlowClass}`}>
                            <div className="metric-icon-wrapper danger">
                                <Wallet size={24} />
                            </div>
                            <p className="metric-label">Total Monthly Expenses</p>
                            <h3 className="metric-value">
                                $<AnimatedNumber value={totalMonthlyExpenses} />
                            </h3>
                        </Card>
                    </AnimateOnScroll>

                    <AnimateOnScroll delay={0.3}>
                        <Card glass className={`metric-card ${borderGlowClass}`}>
                            <div className={`metric-icon-wrapper ${netMonthlyCashFlow >= 0 ? 'success' : 'danger'}`}>
                                <TrendingUp size={24} />
                            </div>
                            <p className="metric-label">Net Monthly Cash Flow</p>
                            <h3 className={`metric-value ${netMonthlyCashFlow >= 0 ? 'positive' : 'negative'}`}>
                                {netMonthlyCashFlow < 0 ? '-' : ''}$<AnimatedNumber value={Math.abs(netMonthlyCashFlow)} />
                            </h3>
                        </Card>
                    </AnimateOnScroll>
                </div>

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
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }} tickMargin={12} minTickGap={20} />
                                        <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }} tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`} width={40} tickMargin={8} />
                                        <Tooltip content={<DualLineTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowIncome)" />
                                        <Area type="linear" dataKey="expenses" name="Expenses" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenses)" activeDot={{ r: 5, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowExpenses)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button className="full-width-btn" onClick={() => navigate('/income')}>
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
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }} tickMargin={12} minTickGap={20} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="value" stroke="#4FA3F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPortfolio)" activeDot={{ r: 5, fill: '#4FA3F7', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowPortfolio)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button className="full-width-btn" onClick={() => { playPop && playPop(); navigate('/investments'); }}>View Investments</Button>
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
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }} tickMargin={12} minTickGap={20} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: 'none' }} wrapperStyle={{ outline: 'none', zIndex: 100 }} position={{ y: -20 }} />
                                        <Area type="linear" dataKey="value" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFuture)" activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} filter="url(#glowFuture)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="panel-footer">
                                <Button className="full-width-btn" onClick={() => navigate('/projections')}>
                                    Run Projections
                                </Button>
                            </div>
                        </Card>
                    </AnimateOnScroll>
                </div>
            </section >
        </div >
    );
};

export default Home;
