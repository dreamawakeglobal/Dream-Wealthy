import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { useFinancialContext } from '../FinancialContext';

export const useNotifications = () => {
    const store = useStore();
    const { totalMonthlyIncome, netMonthlyCashFlow } = useFinancialContext();

    // Persist dismissed notifications in localStorage
    const [localDismissed, setLocalDismissed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dw_dismissed_notifications')) || [];
        } catch (e) {
            const _ignore = e;
            return [];
        }
    });

    const cloudDismissed = store.profileData?.dismissedNotifications || [];
    const dismissedIds = useMemo(() => {
        return [...new Set([...localDismissed, ...cloudDismissed])];
    }, [localDismissed, cloudDismissed]);

    useEffect(() => {
        localStorage.setItem('dw_dismissed_notifications', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const notifications = useMemo(() => {
        const alerts = [];
        const todayDate = new Date();
        const todayDay = todayDate.getDate();
        const currentMonth = todayDate.getMonth();
        const currentYear = todayDate.getFullYear();

        // Helper to check days until a monthly due date AND return the target month to prevent ID shifting
        const getDueInfo = (dueDateStr) => {
            if (!dueDateStr) return null;
            const dueDay = Number(dueDateStr);
            if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return null;

            let targetMonth = currentMonth;
            let targetDate = new Date(currentYear, currentMonth, dueDay);

            // If target date's day is in the past by more than 15 days, we assume it's meant for next month
            if (todayDay - dueDay > 15) {
                targetMonth = currentMonth + 1;
                targetDate = new Date(currentYear, targetMonth, dueDay);
            }

            const diffTime = targetDate.getTime() - todayDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return { diffDays, targetMonth: targetMonth % 12 };
        };

        // 1. Budget Warning
        if (totalMonthlyIncome > 0 && netMonthlyCashFlow < 0) {
            alerts.push({
                id: `budget_warning_${currentMonth}_${currentYear}`,
                type: 'warning',
                title: 'Budget Over-Allocated',
                message: `You have allocated $${Math.abs(netMonthlyCashFlow).toLocaleString()} more than your monthly income. Adjust your streams!`,
                icon: 'AlertTriangle'
            });
        }

        // 2. Tracked Debts
        store.trackedDebts?.forEach(debt => {
            if (debt.balance <= 0) {
                // Celebration
                alerts.push({
                    id: `debt_paid_${debt.id}`,
                    type: 'success',
                    title: 'Debt Finished!',
                    message: `Congratulations! You have totally paid off ${debt.name}.`,
                    icon: 'Trophy'
                });
                return;
            }

            const dueInfo = getDueInfo(debt.dueDate);
            if (dueInfo !== null) {
                const { diffDays, targetMonth } = dueInfo;
                if (diffDays < 0 && diffDays >= -15 && !debt.isPaid) {
                    alerts.push({
                        id: `debt_alert_${debt.id}_${targetMonth}`,
                        type: 'danger',
                        title: 'Payment Overdue',
                        message: `Your payment for ${debt.name} was due ${Math.abs(diffDays)} day(s) ago.`,
                        icon: 'AlertCircle'
                    });
                } else if (diffDays >= 0 && diffDays <= 5 && !debt.isPaid) {
                    alerts.push({
                        id: `debt_alert_${debt.id}_${targetMonth}`,
                        type: 'info',
                        title: 'Upcoming Payment',
                        message: `Your payment for ${debt.name} is due ${diffDays === 0 ? 'today' : `in ${diffDays} day(s)`}.`,
                        icon: 'Calendar'
                    });
                }
            }
        });

        // 3. Fixed Expenses
        store.fixedExpenses?.forEach(exp => {
            const dueInfo = getDueInfo(exp.dueDate);
            if (dueInfo !== null) {
                const { diffDays, targetMonth } = dueInfo;
                if (diffDays < 0 && diffDays >= -15 && !exp.isPaid) {
                    alerts.push({
                        id: `exp_alert_${exp.id}_${targetMonth}`,
                        type: 'danger',
                        title: 'Bill Overdue',
                        message: `Your ${exp.name} bill was due ${Math.abs(diffDays)} day(s) ago.`,
                        icon: 'AlertCircle'
                    });
                } else if (diffDays >= 0 && diffDays <= 5 && !exp.isPaid) {
                    alerts.push({
                        id: `exp_alert_${exp.id}_${targetMonth}`,
                        type: 'info',
                        title: 'Upcoming Bill',
                        message: `Your ${exp.name} bill is due ${diffDays === 0 ? 'today' : `in ${diffDays} day(s)`}.`,
                        icon: 'Calendar'
                    });
                }
            }
        });

        // 4. Subscriptions
        store.subscriptions?.forEach(sub => {
            const dueInfo = getDueInfo(sub.dueDate);
            if (dueInfo !== null) {
                const { diffDays, targetMonth } = dueInfo;
                if (diffDays < 0 && diffDays >= -15) {
                    alerts.push({
                        id: `sub_alert_${sub.id}_${targetMonth}`,
                        type: 'danger',
                        title: 'Subscription Overdue',
                        message: `Your ${sub.name} subscription (${sub.cost}) was due ${Math.abs(diffDays)} day(s) ago.`,
                        icon: 'AlertCircle'
                    });
                } else if (diffDays >= 0 && diffDays <= 5) {
                    alerts.push({
                        id: `sub_alert_${sub.id}_${targetMonth}`,
                        type: 'info',
                        title: 'Upcoming Subscription',
                        message: `Your ${sub.name} subscription (${sub.cost}) is renewing ${diffDays === 0 ? 'today' : `in ${diffDays} day(s)`}.`,
                        icon: 'Calendar'
                    });
                }
            }
        });

        // 5. Wealthy Insights Weekly Action
        const startOfYear = new Date(currentYear, 0, 1);
        const pastDaysOfYear = (todayDate - startOfYear) / 86400000;
        const currentWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        
        // Weekly Insight Alert matches the calendar week. This allows the persistent cache to track if the user has dismissed it this week.
        const coachAlertId = `coach_alert_${currentYear}_w${currentWeekNumber}`;
        
        alerts.push({
            id: coachAlertId,
            type: 'info', 
            title: 'Weekly Insight Ready',
            message: 'Wealthy Insights has completely analyzed your financial trajectory. Click to view.',
            icon: 'Sparkles',
            action: 'OPEN_COACH'
        });

        // Add timestamps to them so we can sort (newest created first? We don't have created, so let's just sort by severity)
        const severityOrder = { danger: 1, warning: 2, info: 3, success: 4 };
        alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

        // Filter out dismissed notifications
        // Native debug removed
        return alerts.filter(alert => !dismissedIds.includes(alert.id));
    }, [store.trackedDebts, store.fixedExpenses, store.subscriptions, totalMonthlyIncome, netMonthlyCashFlow, dismissedIds]);

    const dismiss = (id) => {
        const newDismissed = [...new Set([...dismissedIds, id])];
        setLocalDismissed(newDismissed);
        if (store.user) {
            store.updateProfileField('dismissedNotifications', newDismissed);
        }
    };

    const clearAll = () => {
        const activeIds = notifications.map(n => n.id);
        const newDismissed = [...new Set([...dismissedIds, ...activeIds])];
        setLocalDismissed(newDismissed);
        if (store.user) {
            store.updateProfileField('dismissedNotifications', newDismissed);
        }
    };

    return { notifications, dismiss, clearAll, unreadCount: notifications.length };
};
