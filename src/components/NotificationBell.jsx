import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Calendar, Trophy, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useStore } from '../store';
import './NotificationBell.css';

const IconMap = {
    AlertTriangle: AlertTriangle,
    AlertCircle: AlertCircle,
    Calendar: Calendar,
    Trophy: Trophy,
    Sparkles: Sparkles
};

export const NotificationBell = () => {
    const { notifications, dismiss, clearAll, unreadCount } = useNotifications();
    const { setIsCoachModalOpen } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button 
                className={`bell-button glass ${unreadCount > 0 ? 'has-notifications' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown glass">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="clear-all-btn" onClick={clearAll}>Close All</button>
                        )}
                    </div>
                    
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">
                                <CheckCircle2 size={32} className="empty-icon" />
                                <p>You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                        const IconComp = IconMap[notif.icon] || Bell;
                                        
                                        const handleItemClick = () => {
                                            if (notif.action === 'OPEN_COACH') {
                                                setIsCoachModalOpen(true);
                                                setIsOpen(false); // Close the dropdown
                                                dismiss(notif.id); 
                                            }
                                        };

                                        return (
                                            <div 
                                                key={notif.id} 
                                                className={`notification-item ${notif.type} ${notif.action ? 'actionable' : ''}`}
                                                onClick={notif.action ? handleItemClick : undefined}
                                                style={notif.action ? { cursor: 'pointer' } : {}}
                                            >
                                                <div className="notification-icon-wrapper">
                                                    <IconComp size={18} />
                                                </div>
                                                <div className="notification-content">
                                                    <h4>{notif.title}</h4>
                                                    <p>{notif.message}</p>
                                                </div>
                                                <button 
                                                    className="dismiss-btn" 
                                                    onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
