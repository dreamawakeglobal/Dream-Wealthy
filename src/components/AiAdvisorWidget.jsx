import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useSound } from '../SoundContext';
import { supabase } from '../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFinancialContext } from '../FinancialContext';
import { useStore } from '../store';
import './AiAdvisorWidget.css';

const AiAdvisorWidget = () => {
    const { playWhoosh, playPop, playChime } = useSound();
    const { theme, expenseBorderColor } = useTheme();
    const { user } = useAuth();
    const { getProjectionData, transactionsByCategory, mapUserExpenseToPlaidCategory } = useFinancialContext();
    const { variableExpenses, fixedExpenses } = useStore();
    const location = useLocation();
    
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your dedicated AI Financial Advisor. How can I help you maximize your wealth today?" }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Dynamically calculate the Persona string for both the Header and Greeting
    const personaId = user?.user_metadata?.advisor_persona || 'wealth_manager';
    const personaName = {
        'accountability_coach': 'Accountability Coach',
        'visionary_guide': 'Visionary Guide',
        'cfo': 'Agentic C.F.O.',
        'wealth_manager': 'Wealth Manager'
    }[personaId] || 'AI Advisor';

    // Dynamically build the Initial Greeting based on their Persona mapping
    useEffect(() => {
        if (user) {
            const firstName = user.user_metadata?.first_name || '';

            const greeting = firstName 
                ? `Hello ${firstName}! I'm your dedicated ${personaName}. How can I help you maximize your wealth today?`
                : `Hello! I'm your dedicated ${personaName}. How can I assist you today?`;
            
            setMessages(prev => {
                // If the user hasn't sent any real messages yet, swap out the default greeting
                if (prev.length === 1 && prev[0].role === 'assistant') {
                    return [{ role: 'assistant', content: greeting }];
                }
                return prev;
            });
        }
    }, [user, user?.user_metadata?.advisor_persona]);

    const activeColor = expenseBorderColor !== 'none' ? {
        blue: '#4FA3F7',
        white: '#ffffff',
        black: '#000000',
        red: '#FF0000',
        green: '#10B981',
        purple: '#8b5cf6',
        pink: '#ec4899',
        yellow: '#eab308',
        orange: '#f97316'
    }[expenseBorderColor] || (theme === 'dark' ? '#818CF8' : '#4FA3F7') : (theme === 'dark' ? '#818CF8' : '#4FA3F7');

    const handleOpenToggle = () => {
        playPop();
        setIsOpen(!isOpen);
    };

    if (location.pathname === '/onboarding') return null;

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isThinking) return;

        playWhoosh();
        const userMsg = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsThinking(true);

        try {
            // Get secure token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-advisor`;
            
            const baseProjections = getProjectionData ? getProjectionData(60, 0) : [];
            const currentYear = new Date().getFullYear();
            const projectionsWithYear = baseProjections.map((p, index) => {
                const yearOffset = Math.floor(index / 12);
                return { ...p, month: `${p.month} ${currentYear + yearOffset}` };
            });

            const trackerContext = {
                variableExpenses: (variableExpenses || []).map(exp => ({
                    name: exp.name,
                    budget: exp.amount,
                    spent: exp.manualSpent != null ? Number(exp.manualSpent) : (Number(transactionsByCategory[exp.targetCategory || (mapUserExpenseToPlaidCategory ? mapUserExpenseToPlaidCategory(exp.name) : exp.name)]) || 0)
                }))
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    messages: newMessages,
                    projections: projectionsWithYear,
                    trackerContext: trackerContext
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`STATUS ${response.status}: ${errText.substring(0, 150)}`);
            }

            // Stream handler
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            
            // Add an empty assistant message to append chunks to
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });

                if (chunkValue) {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (updated[lastIndex].role === 'assistant') {
                            // Deep clone the object so React StrictMode doesn't mutate it twice per physical chunk pass!
                            updated[lastIndex] = { 
                                ...updated[lastIndex], 
                                content: updated[lastIndex].content + chunkValue 
                            };
                        }
                        return updated;
                    });
                }
            }
            playChime(); // Success finish
        } catch (err) {
            console.error("AI CHAT ERROR DUMP:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: `DEBUG TRACE: ${err.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className={`ai-advisor-wrapper ${isOpen ? 'open' : ''}`}>
            
            {/* The Floating Chat Window */}
            {isOpen && (
                <div 
                    className="ai-chat-window" 
                    style={{ 
                        borderColor: activeColor, 
                        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 15px ${activeColor}33` 
                    }}
                >
                    <div className="ai-chat-header" style={{ borderBottomColor: `${activeColor}33` }}>
                        <div className="ai-chat-title">
                            <Sparkles size={18} color={activeColor} />
                            <span>{personaName} <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '4px' }}>powered by Gemini</span></span>
                        </div>
                        <button onClick={handleOpenToggle} className="ai-chat-close">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`ai-message-row ${msg.role}`}>
                                {msg.role === 'assistant' && (
                                    <div className="ai-avatar" style={{ background: `${activeColor}22`, color: activeColor }}>
                                        <Sparkles size={14} />
                                    </div>
                                )}
                                <div className={`ai-bubble ${msg.role}`} style={msg.role === 'user' ? { background: activeColor } : {}}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="ai-message-row assistant">
                                <div className="ai-avatar" style={{ background: `${activeColor}22`, color: activeColor }}>
                                    <Sparkles size={14} />
                                </div>
                                <div className="ai-bubble assistant thinking">
                                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ai-chat-input-area" onSubmit={handleSend} style={{ borderTopColor: `${activeColor}33` }}>
                        <input 
                            type="text" 
                            placeholder="Ask me a financial question..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isThinking}
                        />
                        <button 
                            type="submit" 
                            className="ai-chat-send"
                            disabled={!input.trim() || isThinking}
                            style={{ background: input.trim() ? activeColor : 'var(--surface-hover)' }}
                        >
                            <Send size={16} color={input.trim() ? '#fff' : 'var(--text-muted)'} />
                        </button>
                    </form>
                </div>
            )}

            {/* The Floating Action Button */}
            <button 
                className="ai-fab-button glass" 
                onClick={handleOpenToggle}
                style={{ 
                    boxShadow: `0 4px 20px ${activeColor}44`,
                    borderColor: `${activeColor}88`
                }}
            >
                {isOpen ? <X size={24} color={activeColor} /> : <Sparkles size={24} color={activeColor} />}
                {!isOpen && <span className="ai-fab-shimmer"></span>}
            </button>
        </div>
    );
};

export default AiAdvisorWidget;
