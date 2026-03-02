'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecruiterSidebar from '@/components/RecruiterSidebar';
import { fetchAgentStats, fetchFlaggedItems, fetchAgentActivity, approveDraft, dismissFlag } from '@/lib/api';

/* ═══════════════════════════════════════
   SVG Icons
   ═══════════════════════════════════════ */
const BotIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 15h0M16 15h0" /></svg>;
const FlagIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>;
const SendIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
const ClockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;

const STATUS_COLORS = {
    accepted: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
    rejected: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    negotiating: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    manual_review: { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' },
    offer_sent: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
};

const ACTIVITY_LABELS = {
    llm_classification: 'Classified Reply',
    followup_sent: 'Follow-up Sent',
    auto_reply_sent: 'Auto-Reply Sent',
    draft_queued: 'Draft Queued',
    approved_reply_sent: 'Approved & Sent',
    flag_dismissed: 'Flag Dismissed',
    candidate_reply: 'Candidate Replied',
};

export default function AgentDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({});
    const [flagged, setFlagged] = useState([]);
    const [activities, setActivities] = useState([]);
    const [tab, setTab] = useState('flagged');
    const [loaded, setLoaded] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [editingDraft, setEditingDraft] = useState({});

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

    async function loadData() {
        try {
            const [s, f, a] = await Promise.all([
                fetchAgentStats(),
                fetchFlaggedItems(),
                fetchAgentActivity(50),
            ]);
            setStats(s);
            setFlagged(f.flagged || []);
            setActivities(a.activities || []);
        } catch (e) { console.error('Agent load failed:', e); }
        setLoaded(true);
    }

    async function handleApprove(id, editedContent = null) {
        setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
        try {
            await approveDraft(id, editedContent);
            await loadData();
        } catch (e) { console.error(e); }
        setActionLoading(prev => ({ ...prev, [id]: null }));
        setEditingDraft(prev => ({ ...prev, [id]: undefined }));
    }

    async function handleDismiss(id) {
        setActionLoading(prev => ({ ...prev, [id]: 'dismiss' }));
        try {
            await dismissFlag(id, 'Handled manually by recruiter');
            await loadData();
        } catch (e) { console.error(e); }
        setActionLoading(prev => ({ ...prev, [id]: null }));
    }

    if (!loaded) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                <RecruiterSidebar />
                <div style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00ADEF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f4f7fc' }}>
            <RecruiterSidebar />
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <main style={{ flex: 1, marginLeft: 88, padding: '28px 36px' }}>
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}><BotIcon /></div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>AI Recruitment Agent</h1>
                            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Automated follow-ups, replies, and escalation management</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Flagged Items', value: stats.flagged_items || 0, color: '#dc2626', icon: <FlagIcon /> },
                        { label: 'Follow-ups Sent', value: stats.follow_ups_sent || 0, color: '#b45309', icon: <ClockIcon /> },
                        { label: 'Auto-Replies Sent', value: stats.auto_replies_sent || 0, color: '#15803d', icon: <SendIcon /> },
                        { label: 'Drafts Pending', value: stats.drafts_pending || 0, color: '#7c3aed', icon: <BotIcon /> },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: '#fff', borderRadius: 14, padding: '20px 24px',
                            border: '1px solid #e8ecf4', boxShadow: '0 2px 8px rgba(0,39,94,0.04)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: s.color }}>{s.icon}<span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</span></div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#e8ecf4', borderRadius: 10, padding: 3, width: 'fit-content' }}>
                    {['flagged', 'activity'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600,
                            background: tab === t ? '#fff' : 'transparent',
                            color: tab === t ? '#1e293b' : '#64748b',
                            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                        }}>{t === 'flagged' ? `Flagged (${flagged.length})` : 'Activity Log'}</button>
                    ))}
                </div>

                {/* ── Flagged Items Tab ── */}
                {tab === 'flagged' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {flagged.length === 0 ? (
                            <div style={{
                                background: '#fff', borderRadius: 14, padding: '48px 24px',
                                border: '1px solid #e8ecf4', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>
                                    <CheckIcon />
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>All clear!</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>No items need your attention right now.</div>
                            </div>
                        ) : flagged.map(item => {
                            const sc = STATUS_COLORS[item.status] || STATUS_COLORS.manual_review;
                            const isEditing = editingDraft[item.id] !== undefined;
                            const loading = actionLoading[item.id];

                            return (
                                <div key={item.id} style={{
                                    background: '#fff', borderRadius: 14, border: '1px solid #e8ecf4',
                                    boxShadow: '0 2px 8px rgba(0,39,94,0.04)',
                                    animation: 'fadeIn 0.3s ease-out',
                                    overflow: 'hidden',
                                }}>
                                    {/* Card Header */}
                                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #00275E, #003580)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: 14, fontWeight: 700,
                                            }}>{item.name?.charAt(0) || '?'}</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                                                <div style={{ fontSize: 12, color: '#64748b' }}>{item.designation} &middot; {item.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {item.ai_confidence != null && (
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '3px 8px' }}>
                                                    {Math.round(item.ai_confidence * 100)}% conf
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 10px',
                                                background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                            }}>{(item.status || '').replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    {/* Flag Reason */}
                                    <div style={{ padding: '12px 24px', background: '#fefce8', borderBottom: '1px solid #fef08a' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <span style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }}><FlagIcon /></span>
                                            <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{item.flag_reason}</span>
                                        </div>
                                    </div>

                                    {/* Candidate's Reply */}
                                    {item.latest_reply && (
                                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 }}>CANDIDATE'S REPLY</div>
                                            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, fontStyle: 'italic', background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                                                "{item.latest_reply}"
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Draft */}
                                    {item.ai_draft && (
                                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 }}>AI SUGGESTED RESPONSE</div>
                                            {isEditing ? (
                                                <textarea
                                                    value={editingDraft[item.id]}
                                                    onChange={e => setEditingDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    style={{
                                                        width: '100%', minHeight: 100, padding: '10px 14px', fontSize: 13,
                                                        border: '1.5px solid #00ADEF', borderRadius: 8, outline: 'none',
                                                        fontFamily: "'Inter', sans-serif", lineHeight: 1.6, resize: 'vertical',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    fontSize: 13, color: '#334155', lineHeight: 1.6,
                                                    background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px',
                                                }}>
                                                    {item.ai_draft}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                        {item.ai_draft && !isEditing && (
                                            <button onClick={() => setEditingDraft(prev => ({ ...prev, [item.id]: item.ai_draft }))} style={{
                                                padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                                                background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            }}>Edit Draft</button>
                                        )}
                                        {item.ai_draft && (
                                            <button
                                                disabled={!!loading}
                                                onClick={() => handleApprove(item.id, isEditing ? editingDraft[item.id] : null)}
                                                style={{
                                                    padding: '7px 16px', borderRadius: 8, border: 'none',
                                                    background: loading === 'approve' ? '#94a3b8' : '#15803d', color: '#fff',
                                                    fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                }}>
                                                <SendIcon /> {loading === 'approve' ? 'Sending...' : 'Approve & Send'}
                                            </button>
                                        )}
                                        <button
                                            disabled={!!loading}
                                            onClick={() => handleDismiss(item.id)}
                                            style={{
                                                padding: '7px 14px', borderRadius: 8, border: '1px solid #fecaca',
                                                background: loading === 'dismiss' ? '#94a3b8' : '#fff', color: '#dc2626',
                                                fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                            <XIcon /> {loading === 'dismiss' ? 'Dismissing...' : 'Dismiss'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Activity Log Tab ── */}
                {tab === 'activity' && (
                    <div style={{
                        background: '#fff', borderRadius: 14, border: '1px solid #e8ecf4',
                        boxShadow: '0 2px 8px rgba(0,39,94,0.04)', overflow: 'hidden',
                    }}>
                        {activities.length === 0 ? (
                            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: '#64748b' }}>No agent activity yet. AI actions will appear here.</div>
                            </div>
                        ) : (
                            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                                {activities.map((act, i) => {
                                    const sc = STATUS_COLORS[act.decision] || { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
                                    const label = ACTIVITY_LABELS[act.type] || act.type;
                                    const time = act.timestamp ? new Date(act.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

                                    return (
                                        <div key={i} style={{
                                            padding: '14px 24px', borderBottom: '1px solid #f1f5f9',
                                            display: 'flex', alignItems: 'flex-start', gap: 14,
                                            animation: 'fadeIn 0.2s ease-out',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                background: sc.bg, border: `1px solid ${sc.border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: sc.text, marginTop: 2,
                                            }}><BotIcon /></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{act.candidate_name}</span>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, borderRadius: 5, padding: '2px 8px',
                                                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                                    }}>{label}</span>
                                                    {act.confidence != null && (
                                                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{Math.round(act.confidence * 100)}%</span>
                                                    )}
                                                </div>
                                                {act.content && (
                                                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginTop: 2 }}>
                                                        {act.content.length > 200 ? act.content.slice(0, 200) + '...' : act.content}
                                                    </div>
                                                )}
                                                {act.reasoning && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                                                        {act.reasoning.length > 150 ? act.reasoning.slice(0, 150) + '...' : act.reasoning}
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
