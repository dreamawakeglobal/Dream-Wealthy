import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, TrendingUp, Calendar } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { Button } from './ui/Button';

export const AssetProjectionTab = ({ asset, updateAsset, removeAsset }) => {
    const { name, monthlyContribution, annualReturnRate } = asset;
    const [projectionYears, setProjectionYears] = useState(1); // 1 or 2

    const handleUpdate = (field, value) => {
        updateAsset(asset.id, { ...asset, [field]: value });
    };

    const projectionData = useMemo(() => {
        let cumulative = 0;
        let totalInvested = 0;
        const data = [];

        const monthlyReturn = annualReturnRate / 100 / 12;
        const totalMonths = projectionYears * 12;

        // Start from January of current year
        const currentDate = new Date();
        let currentMonthIndex = 0; // Forced to start at January
        let currentYear = currentDate.getFullYear();

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (let month = 1; month <= totalMonths; month++) {
            totalInvested += monthlyContribution;
            cumulative += monthlyContribution;
            cumulative *= (1 + monthlyReturn);

            const displayMonth = `${monthNames[currentMonthIndex]} '${currentYear.toString().slice(-2)}`;

            data.push({
                month: displayMonth,
                Invested: Math.round(totalInvested),
                Balance: Math.round(cumulative),
                Growth: Math.round(cumulative - totalInvested)
            });

            currentMonthIndex++;
            if (currentMonthIndex > 11) {
                currentMonthIndex = 0;
                currentYear++;
            }
        }

        return data;
    }, [monthlyContribution, annualReturnRate, projectionYears]);

    const finalBalance = projectionData[projectionData.length - 1]?.Balance || 0;
    const finalGrowth = projectionData[projectionData.length - 1]?.Growth || 0;

    return (
        <div className="projection-dashboard animate-fade-in">
            {/* Controls Sidebar */}
            <div className="projection-controls">
                <Card glass className="controls-card">
                    <div className="controls-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2>{name} Asset</h2>
                        </div>
                        <button className="btn-icon danger" onClick={() => removeAsset(asset.id)} title="Delete Tab">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="controls-group">
                        <label>Asset Name</label>
                        <Input
                            type="text"
                            value={name}
                            onChange={e => handleUpdate('name', e.target.value)}
                        />
                    </div>

                    <div className="controls-group">
                        <label>Monthly Contribution ($)</label>
                        <Input
                            type="number"
                            value={monthlyContribution}
                            onChange={e => handleUpdate('monthlyContribution', Number(e.target.value))}
                        />
                    </div>

                    <div className="controls-divider" />

                    <div className="controls-group">
                        <label>Expected Annual Return (%)</label>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="-20" max="100" step="1"
                                value={annualReturnRate}
                                onChange={e => handleUpdate('annualReturnRate', Number(e.target.value))}
                                className="dream-slider"
                            />
                            <span className="slider-value">{annualReturnRate}%</span>
                        </div>
                    </div>

                    <div className="controls-divider" />

                    <div className="controls-group">
                        <label>Projection Timeline</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <Button
                                variant={projectionYears === 1 ? 'primary' : 'secondary'}
                                onClick={() => setProjectionYears(1)}
                                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                            >
                                1 Year
                            </Button>
                            <Button
                                variant={projectionYears === 2 ? 'primary' : 'secondary'}
                                onClick={() => setProjectionYears(2)}
                                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                            >
                                2 Years
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card glass className="projection-summary-card">
                    <div className="summary-header">
                        <span>{projectionYears} Year Balance</span>
                        <TrendingUp size={24} className="text-success" />
                    </div>
                    <div className="summary-total positive">
                        $<AnimatedNumber value={finalBalance} />
                    </div>
                    <p className="metric-subtext mt-2">
                        Net Growth: <span className="text-success">+${finalGrowth.toLocaleString()}</span>
                    </p>
                </Card>
            </div>

            {/* Charts and Tables */}
            <div className="projection-visuals">
                <Card glass className="chart-container">
                    <h3>Asset Growth Curve ({projectionYears * 12} Months)</h3>
                    <div className="area-chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`colorBalance-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" tickFormatter={val => `$${val}`} />
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value) => `$${value.toLocaleString()}`}
                                />
                                <Area type="monotone" dataKey="Balance" stroke="var(--accent-primary)" fillOpacity={1} fill={`url(#colorBalance-${asset.id})`} strokeWidth={3} />
                                <Area type="monotone" dataKey="Invested" stroke="var(--text-secondary)" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card glass className="table-container">
                    <h3>Month-by-Month Breakdown</h3>
                    <div className="table-wrapper">
                        <table className="projection-table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Contribution</th>
                                    <th>Total Invested</th>
                                    <th>Net Growth</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectionData.map((row) => (
                                    <tr key={row.month}>
                                        <td>{row.month}</td>
                                        <td className="text-secondary">${monthlyContribution.toLocaleString()}</td>
                                        <td className="text-secondary">${row.Invested.toLocaleString()}</td>
                                        <td className={row.Growth >= 0 ? 'text-success' : 'text-danger'}>
                                            {row.Growth >= 0 ? '+' : '-'}${Math.abs(row.Growth).toLocaleString()}
                                        </td>
                                        <td className="font-semibold" style={{ color: 'var(--accent-primary)' }}>${row.Balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
