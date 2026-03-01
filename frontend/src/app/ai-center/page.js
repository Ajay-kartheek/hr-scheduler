'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getEmailActivity, copilotChat, getSmartSuggestions } from '@/lib/api';
import Link from 'next/link';

const CATEGORY_CONFIG = {
    candidate_offer_reply: { label: 'Offer Reply', color: '#00ADEF' },
    laptop_approval: { label: 'Laptop', color: '#3b82f6' },
    id_card_confirmation: { label: 'ID Card', color: '#10b981' },
    access_card_confirmation: { label: 'Access Card', color: '#f59e0b' },
    company_email_confirmation: { label: 'Email Setup', color: '#8b5cf6' },
    buddy_acknowledgment: { label: 'Buddy', color: '#0d9488' },
    general_inquiry: { label: 'General', color: '#6b7280' },
    irrelevant: { label: 'Irrelevant', color: '#9ca3af' },
};

const ACTION_LABELS = {
    complete_step: { label: 'Step Completed', bg: '#ecfdf5', color: '#065f46' },
    accept_offer: { label: 'Accepted', bg: '#ecfdf5', color: '#065f46' },
    decline_offer: { label: 'Declined', bg: '#fef2f2', color: '#991b1b' },
    negotiate_offer: { label: 'Negotiation', bg: '#fffbeb', color: '#92400e' },
    no_action: { label: 'No Action', bg: '#f3f4f6', color: '#6b7280' },
    needs_review: { label: 'Review Needed', bg: '#fffbeb', color: '#92400e' },
};

const SUGGESTION_STYLES = {
    action: { bg: '#eef2ff', border: '#c7d2fe', color: '#00275E', icon: '→' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '!' },
    info: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', icon: 'i' },
};

export default function AICenter() {
    const [activeTab, setActiveTab] = useState('copilot');
    const [emails, setEmails] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Copilot chat state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const loadData = useCallback(async () => {
        try {
            const [emailData, sugData] = await Promise.all([
                getEmailActivity(50).catch(() => []),
                getSmartSuggestions().catch(() => []),
            ]);
            setEmails(Array.isArray(emailData) ? emailData : emailData?.emails || []);
            setSuggestions(Array.isArray(sugData) ? sugData : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    // Send copilot message
    async function handleSend(e) {
        e?.preventDefault();
        const q = input.trim();
        if (!q || thinking) return;

        const userMsg = { role: 'user', content: q };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setThinking(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const data = await copilotChat(q, history);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setThinking(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }

    const filteredEmails = filter === 'all' ? emails : emails.filter(e => e.ai_classification?.category === filter);

    const tabs = [
        { key: 'copilot', label: 'Copilot' },
        { key: 'suggestions', label: `Suggestions${suggestions.length ? ` (${suggestions.length})` : ''}` },
        { key: 'activity', label: 'Activity Log' },
    ];

    const quickQuestions = [
        "What's the current pipeline status?",
        "Who needs follow-up?",
        "Which employees are in pre-boarding?",
        "Any blocked workflows?",
    ];

    return (
        <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.35s ease', overflowX: 'hidden' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', letterSpacing: -0.3, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 24, height: 24 }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    AI Command Center
                </h1>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Chat with your HR copilot, view smart suggestions, and monitor AI activity
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f0f0f0', marginBottom: 20 }}>
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        color: activeTab === tab.key ? '#1e293b' : '#9ca3af',
                        borderBottom: activeTab === tab.key ? '2px solid #1e293b' : '2px solid transparent',
                        transition: 'all 0.15s', marginBottom: -1,
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* ═══ Copilot Tab ═══ */}
            {activeTab === 'copilot' && (
                <div style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                    display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)',
                    overflow: 'hidden',
                }}>
                    {/* Chat Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                        {messages.length === 0 && !thinking && (
                            <div style={{ textAlign: 'center', paddingTop: 60 }}>
                                <div style={{
                                    width: 56, height: 56, margin: '0 auto 18px',
                                    background: '#f9fafb', borderRadius: 16,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                                    HR Copilot
                                </h3>
                                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                                    Ask me anything about your onboarding pipeline. I have live access to your employee data.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {quickQuestions.map((q, i) => (
                                        <button key={i} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }} style={{
                                            padding: '8px 16px', fontSize: 12, fontWeight: 500,
                                            background: '#f9fafb', color: '#374151', border: '1px solid #f0f0f0',
                                            borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                                        >{q}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: 12, marginBottom: 20,
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    background: msg.role === 'user' ? '#1e293b' : '#f3f4f6',
                                    color: msg.role === 'user' ? '#fff' : '#6b7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700,
                                }}>
                                    {msg.role === 'user' ? 'HR' : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    )}
                                </div>
                                <div style={{
                                    maxWidth: '75%', padding: '12px 16px', borderRadius: 12,
                                    background: msg.role === 'user' ? '#1e293b' : '#f9fafb',
                                    color: msg.role === 'user' ? '#fff' : '#374151',
                                    fontSize: 13, lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {thinking && (
                            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                </div>
                                <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: 6, height: 6, borderRadius: '50%', background: '#9ca3af',
                                                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '16px 20px', borderTop: '1px solid #f0f0f0',
                        display: 'flex', gap: 10,
                    }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask about your pipeline, employees, or onboarding status..."
                            disabled={thinking}
                            style={{
                                flex: 1, padding: '11px 16px', fontSize: 13,
                                border: '1px solid #e2e8f0', borderRadius: 10,
                                outline: 'none', color: '#1e293b', transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#00ADEF'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <button type="submit" disabled={!input.trim() || thinking} style={{
                            padding: '10px 20px', fontSize: 13, fontWeight: 600,
                            background: input.trim() && !thinking ? '#1e293b' : '#e2e8f0',
                            color: input.trim() && !thinking ? '#fff' : '#9ca3af',
                            border: 'none', borderRadius: 10, cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* ═══ Suggestions Tab ═══ */}
            {activeTab === 'suggestions' && (
                <div>
                    {suggestions.length === 0 ? (
                        <div style={{
                            background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                            padding: '64px 24px', textAlign: 'center',
                        }}>
                            <div style={{
                                width: 48, height: 48, margin: '0 auto 16px', background: '#f9fafb',
                                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.8" style={{ width: 24, height: 24 }}>
                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>All clear</p>
                            <p style={{ fontSize: 13, color: '#9ca3af' }}>No actionable suggestions right now. Everything looks on track.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {suggestions.map((sug, i) => {
                                const style = SUGGESTION_STYLES[sug.type] || SUGGESTION_STYLES.info;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', gap: 14, padding: '16px 20px',
                                        background: style.bg, borderRadius: 12,
                                        border: `1px solid ${style.border}`,
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: `${style.color}15`, color: style.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 800, flexShrink: 0,
                                        }}>{style.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                                                {sug.title}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                                                {sug.description}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                                                background: sug.priority === 'high' ? '#fef2f2' : sug.priority === 'medium' ? '#fffbeb' : '#f3f4f6',
                                                color: sug.priority === 'high' ? '#991b1b' : sug.priority === 'medium' ? '#92400e' : '#6b7280',
                                                textTransform: 'uppercase', letterSpacing: 0.3,
                                            }}>{sug.priority}</span>
                                            {sug.employee_id && (
                                                <Link href={`/employees/${sug.employee_id}`} style={{
                                                    padding: '6px 12px', fontSize: 11, fontWeight: 600,
                                                    background: '#fff', color: '#374151', border: '1px solid #e2e8f0',
                                                    borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap',
                                                }}>View</Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Activity Log Tab ═══ */}
            {activeTab === 'activity' && (
                <div>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', padding: 4, background: '#f9fafb', borderRadius: 10, width: 'fit-content' }}>
                        <button onClick={() => setFilter('all')} style={{
                            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: filter === 'all' ? '#fff' : 'transparent',
                            color: filter === 'all' ? '#1e293b' : '#6b7280',
                            boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        }}>All ({emails.length})</button>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                            const count = emails.filter(e => e.ai_classification?.category === key).length;
                            if (count === 0) return null;
                            return (
                                <button key={key} onClick={() => setFilter(key)} style={{
                                    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                    background: filter === key ? '#fff' : 'transparent',
                                    color: filter === key ? cfg.color : '#6b7280',
                                    boxShadow: filter === key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                }}>{cfg.label} ({count})</button>
                            );
                        })}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        {filteredEmails.length === 0 ? (
                            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                                <p style={{ fontSize: 13, color: '#9ca3af' }}>No activity to display.</p>
                            </div>
                        ) : (
                            filteredEmails.map((item, i) => {
                                const cls = item.ai_classification || {};
                                const cat = CATEGORY_CONFIG[cls.category] || CATEGORY_CONFIG.general_inquiry;
                                const act = ACTION_LABELS[cls.action] || ACTION_LABELS.no_action;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', gap: 16, padding: '16px 22px',
                                        borderBottom: '1px solid #fafafa', transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10, background: '#f9fafb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, color: '#6b7280',
                                        }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
                                                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.subject || 'Email processed'}</div>
                                                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                                                        {item.from_email || 'Unknown'}{cls.employee_name && ` \u2192 ${cls.employee_name}`}
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: 11, color: '#d1d5db', flexShrink: 0 }}>
                                                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                                                </span>
                                            </div>
                                            {cls.summary && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 1.5 }}>{cls.summary}</div>}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: `${cat.color}12`, color: cat.color }}>{cat.label}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: act.bg, color: act.color }}>{act.label}</span>
                                                {cls.confidence && <span style={{ fontSize: 11, fontWeight: 500, color: cls.confidence > 0.8 ? '#059669' : '#d97706' }}>{Math.round(cls.confidence * 100)}%</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
