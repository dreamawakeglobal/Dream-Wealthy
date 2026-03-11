import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Zap, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useFinancialContext } from '../../FinancialContext';
import { generateInsights } from '../../utils/insightsEngine';
import './InsightsFeed.css';

const IconMap = {
    warning: AlertTriangle,
    success: TrendingUp,
    info: Zap,
    default: Info
};

export const InsightsFeed = () => {
    const contextData = useFinancialContext();
    const navigate = useNavigate();

    const insights = useMemo(() => {
        return generateInsights(contextData).filter(i => i.type !== 'success');
    }, [contextData]);

    if (!insights || insights.length === 0) return null;

    return (
        <div className="insights-feed-wrapper animate-fade-in">
            <h3 className="insights-header">
                <Zap size={18} className="insights-header-icon" />
                Algorithmic Insights
            </h3>
            <div className="insights-feed-container">
                {insights.map((insight) => {
                    const IconComponent = IconMap[insight.type] || IconMap.default;

                    return (
                        <Card
                            glass
                            key={insight.id}
                            className={`insight-card insight-${insight.type}`}
                        >
                            <div className="insight-icon-wrapper">
                                <IconComponent size={24} />
                            </div>
                            <div className="insight-content">
                                <h4>{insight.title}</h4>
                                <p>{insight.message}</p>
                            </div>
                            {insight.actionText && insight.actionLink && (
                                <div className="insight-action">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => navigate(insight.actionLink)}
                                    >
                                        {insight.actionText}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
