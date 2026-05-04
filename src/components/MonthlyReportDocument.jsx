import React from 'react';
import { useFinancialContext } from '../FinancialContext';

// This is a visually optimized component meant exclusively for PDF rendering
export const MonthlyReportDocument = React.forwardRef(({ monthLabel }, ref) => {
    const {
        totalMonthlyIncome,
        totalFixedExpenses,
        totalVariableExpenses,
        totalSubscriptionCost,
        totalTrackedMonthlyPayments,
        totalMonthlyExpenses,
        netMonthlyCashFlow,
        savingsRate,
        currentIncome,
        fixedExpenses,
        variableExpenses,
        trackedDebts,
        subscriptions,
        portfolio,
        getProjectionData,
        theme // We might want to force light theme for PDFs, but we can let it render however it is
    } = useFinancialContext();

    const projectionData = getProjectionData(12, new Date().getMonth());

    const pdfTheme = 'light'; // Forced light mode for cleaner PDFs
    const textColor = '#1E293B';
    const borderColor = '#E2E8F0';

    return (
        <div 
            ref={ref} 
            style={{ 
                padding: '40px', 
                background: '#ffffff', 
                color: textColor,
                width: '800px', // Fixed width for consistent PDF A4 scaling
                fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: `2px solid ${borderColor}`, paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0F172A' }}>Dream Wealthy</h1>
                <h2 style={{ fontSize: '18px', fontWeight: 'normal', margin: 0, color: '#64748B' }}>Monthly Financial Report — {monthLabel}</h2>
            </div>

            {/* Section 1: Dashboard Summaries */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: '#0F172A' }}>1. Executive Summary</h3>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748B' }}>Total Monthly Income</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>${totalMonthlyIncome.toLocaleString()}</p>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748B' }}>Total Monthly Expenses</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#EF4444' }}>${totalMonthlyExpenses.toLocaleString()}</p>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748B' }}>Net Cash Flow</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: netMonthlyCashFlow >= 0 ? '#10B981' : '#EF4444' }}>${netMonthlyCashFlow.toLocaleString()}</p>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748B' }}>Savings Rate</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>{savingsRate}%</p>
                    </div>
                </div>
            </div>

            {/* Section 2: Income Streams */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: '#0F172A' }}>2. Income Streams</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: `2px solid ${borderColor}` }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Stream Name</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Monthly Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentIncome.map((income) => (
                            <tr key={income.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <td style={{ padding: '12px' }}>{income.name}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>${income.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Section 3: Expenses Data */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: '#0F172A' }}>3. Expenses Breakdown</h3>
                
                <div style={{ display: 'flex', gap: '32px' }}>
                    {/* Fixed Expenses */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#334155' }}>Fixed Expenses (${totalFixedExpenses.toLocaleString()})</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {fixedExpenses.map((exp) => (
                                    <tr key={exp.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                        <td style={{ padding: '8px 4px' }}>{exp.name}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>${exp.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Variable Expenses */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#334155' }}>Variable Expenses (${totalVariableExpenses.toLocaleString()})</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {variableExpenses.map((exp) => (
                                    <tr key={exp.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                        <td style={{ padding: '8px 4px' }}>{exp.name}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>${exp.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
                    {/* Tracked Debts */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#334155' }}>Tracked Debt Payments (${totalTrackedMonthlyPayments.toLocaleString()})</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {trackedDebts.map((debt) => (
                                    <tr key={debt.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                        <td style={{ padding: '8px 4px' }}>{debt.name}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>${(debt.minimumPayment + (Number(debt.extraPayment) || 0)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Subscriptions */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#334155' }}>Subscriptions (${totalSubscriptionCost.toLocaleString()})</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                        <td style={{ padding: '8px 4px' }}>{sub.name}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>${sub.cost.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 4: Investments Data */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: '#0F172A' }}>4. Investment Portfolio</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: `2px solid ${borderColor}` }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Asset Name</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Shares</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Avg Price</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Total Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolio && portfolio.length > 0 ? portfolio.map((item) => (
                            <tr key={item.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <td style={{ padding: '12px' }}>{item.name || item.symbol}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>{item.quantity}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>${(item.avgPrice || item.price || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>${((item.avgPrice || item.price || 0) * (item.quantity || 0)).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>No investments recorded</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Section 5: 12-Month Projection Breakdown */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: '#0F172A' }}>5. 12-Month Projections</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: `2px solid ${borderColor}` }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Month</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Income</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Expenses</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Net Cash Flow</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>Cumulative Wealth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectionData && projectionData.length > 0 ? projectionData.map((row, index) => (
                            <tr key={index} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.month}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#10B981' }}>+${(row.Income || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#EF4444' }}>-${(row.Expenses || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: row.Net >= 0 ? '#10B981' : '#EF4444' }}>
                                    {row.Net >= 0 ? '+' : '-'}${Math.abs(row.Net || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>${(row.Cumulative || 0).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>No projection data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#94A3B8' }}>
                <p>Generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
});
