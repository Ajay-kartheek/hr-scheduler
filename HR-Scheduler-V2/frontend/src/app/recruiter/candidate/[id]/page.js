'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RecruiterSidebar from '@/components/RecruiterSidebar';
import { fetchCandidate, generateOffer, sendOffer, checkReplies, convertToHire } from '@/lib/api';

const STATUS_CONFIG = {
    selected: { label: 'Selected', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
    offer_sent: { label: 'Offer Sent', bg: 'linear-gradient(135deg, #fef9ec, #fef3c7)', color: '#b45309' },
    negotiating: { label: 'Negotiating', bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed' },
    accepted: { label: 'Accepted', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#15803d' },
    rejected: { label: 'Declined', bg: 'linear-gradient(135deg, #fef2f2, #fecaca)', color: '#dc2626' },
    manual_review: { label: 'Needs Review', bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#c2410c' },
    converted: { label: 'Converted to Hire', bg: 'linear-gradient(135deg, #ecfdf5, #a7f3d0)', color: '#047857' },
};

export default function CandidateProfile() {
    const router = useRouter();
    const params = useParams();
    const candidateId = params.id;
    const fileInputRef = useRef(null);

    const [candidate, setCandidate] = useState(null);
    const [loaded, setLoaded] = useState(false);

    // Offer flow state
    const [generating, setGenerating] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const [showDraft, setShowDraft] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);
    const [customNotes, setCustomNotes] = useState('');

    // Convert state
    const [showConvert, setShowConvert] = useState(false);
    const [convertForm, setConvertForm] = useState({ doj: '', phone: '', recruiter_notes: '' });
    const [converting, setConverting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState(null);

    useEffect(() => { loadCandidate(); }, [candidateId]);

    async function loadCandidate() {
        try {
            const c = await fetchCandidate(candidateId);
            setCandidate(c);
            setCustomNotes(c.recruiter_notes || '');
        } catch (e) { console.error(e); }
        setLoaded(true);
    }

    async function handleGenerate() {
        setGenerating(true);
        try {
            const res = await generateOffer(candidateId, { custom_notes: customNotes });
            setDraftContent(res.offer_content);
            setShowDraft(true);
        } catch (e) { console.error(e); }
        setGenerating(false);
    }

    function handleAddFiles(e) {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
        e.target.value = '';
    }

    function handleRemoveFile(index) {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSendOffer() {
        if (!draftContent.trim()) return;
        setSending(true);
        try {
            await sendOffer(candidateId, draftContent, attachments);
            setShowDraft(false);
            setAttachments([]);
            await loadCandidate();
        } catch (e) { console.error(e); alert(e.message); }
        setSending(false);
    }

    async function handleCheckReplies() {
        setChecking(true);
        setCheckResult(null);
        try {
            const res = await checkReplies();
            setCheckResult(res);
            await loadCandidate();
        } catch (e) { console.error(e); }
        setChecking(false);
    }
    async function handleConvert() {
        if (!convertForm.doj) return;
        setConverting(true);
        try {
            await convertToHire(candidateId, convertForm);
            setShowConvert(false);
            await loadCandidate();
        } catch (e) { console.error(e); alert(e.message); }
        setConverting(false);
    }

    if (!loaded) return <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff' }}><RecruiterSidebar /><main style={{ flex: 1, marginLeft: 88, padding: 32 }} /></div>;
    if (!candidate) return <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff' }}><RecruiterSidebar /><main style={{ flex: 1, marginLeft: 88, padding: 32, fontFamily: "'Inter', sans-serif" }}><p>Candidate not found</p></main></div>;

    const c = candidate;
    const displayStatus = c.converted_hire_id ? 'converted' : c.status;
    const sc = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.selected;
    const name = `${c.first_name} ${c.last_name || ''}`.trim();
    const history = c.conversation_history || [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <RecruiterSidebar />

            <main style={{ flex: 1, marginLeft: 88, padding: '16px 32px 32px', minHeight: '100vh' }}>

                {/* Back + Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <button onClick={() => router.push('/recruiter')} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 8,
                        fontSize: 12, color: '#64748b', cursor: 'pointer', fontWeight: 500,
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        Back
                    </button>
                    <div>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px', letterSpacing: 0.5 }}>Candidate Profile</p>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>{name}</h1>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600 }}>
                        {sc.label}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>

                    {/* Left Column — Candidate Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Profile Card */}
                        <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #00ADEF20, #6366f120)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#00275E', marginBottom: 10 }}>
                                    {c.first_name?.[0]}{c.last_name?.[0] || ''}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{name}</div>
                                <div style={{ fontSize: 12, color: '#00ADEF', fontWeight: 500 }}>{c.designation}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { l: 'Email', v: c.email },
                                    { l: 'Phone', v: c.phone },
                                    { l: 'Company', v: c.current_company },
                                    { l: 'Experience', v: c.years_experience ? `${c.years_experience} years` : null },
                                    { l: 'Department', v: c.department_name },
                                    { l: 'Expected CTC', v: c.expected_ctc },
                                    { l: 'Offered CTC', v: c.offered_ctc },
                                ].filter(x => x.v).map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.l}</span>
                                        <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 500, textAlign: 'right', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.v}</span>
                                    </div>
                                ))}
                            </div>

                            {c.linkedin_url && (
                                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16,
                                    padding: '8px 0', borderRadius: 8, background: '#f8fafc', border: '1px solid #e8ecf4',
                                    fontSize: 11, fontWeight: 600, color: '#0077b6', textDecoration: 'none',
                                }}>
                                    LinkedIn Profile
                                </a>
                            )}
                        </div>

                        {/* Recruiter Notes */}
                        <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 20 }}>
                            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>Recruiter Notes</h3>
                            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{c.recruiter_notes || 'No notes'}</p>
                        </div>

                        {/* Convert to Hire CTA */}
                        {c.status === 'accepted' && !c.converted_hire_id && (
                            <button onClick={() => setShowConvert(true)} style={{
                                padding: '12px 20px', background: 'linear-gradient(135deg, #00275E, #003580)', color: '#fff',
                                border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(0,39,94,0.25)', transition: 'all 0.2s',
                            }}>
                                Add to HR Pipeline
                            </button>
                        )}
                        {c.converted_hire_id && (
                            <div style={{ padding: '12px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, fontSize: 12, color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
                                Converted to New Hire
                            </div>
                        )}
                    </div>

                    {/* Right Column — Offer & Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* ── Email Replies (Check Inbox) ── */}
                        {(c.status === 'offer_sent' || c.status === 'negotiating' || c.status === 'manual_review') && (
                            <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    Email Replies
                                </h3>
                                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>
                                    Inbox is polled automatically every 60 seconds. You can also check manually.
                                </p>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <button onClick={handleCheckReplies} disabled={checking} style={{
                                        padding: '10px 24px', background: checking ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                        color: checking ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10,
                                        fontSize: 12, fontWeight: 600, cursor: checking ? 'not-allowed' : 'pointer',
                                        boxShadow: checking ? 'none' : '0 4px 14px rgba(0,39,94,0.2)',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                                        </svg>
                                        {checking ? 'Checking inbox...' : 'Check for Replies'}
                                    </button>
                                </div>
                                {checkResult && (
                                    <div style={{ padding: '10px 14px', marginTop: 12, background: checkResult.new_replies > 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${checkResult.new_replies > 0 ? '#bbf7d0' : '#e8ecf4'}`, borderRadius: 8, fontSize: 11, color: checkResult.new_replies > 0 ? '#15803d' : '#64748b' }}>
                                        Checked {checkResult.checked} candidate(s) — {checkResult.new_replies > 0 ? `${checkResult.new_replies} new reply(s) found and classified` : 'No new replies'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 1: Generate Offer ── */}
                        {c.status === 'selected' && !showDraft && (
                            <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    Generate Offer Letter
                                </h3>
                                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
                                    AI will draft a personalized offer letter. You can review and edit the content before sending.
                                </p>
                                <textarea
                                    value={customNotes}
                                    onChange={e => setCustomNotes(e.target.value)}
                                    placeholder="Add context for the AI to generate a better offer..."
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8ecf4',
                                        fontSize: 12, color: '#1e293b', resize: 'vertical', fontFamily: "'Inter', sans-serif",
                                        outline: 'none', marginBottom: 12, boxSizing: 'border-box',
                                    }}
                                />
                                <button onClick={handleGenerate} disabled={generating} style={{
                                    padding: '10px 24px', background: generating ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: generating ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10,
                                    fontSize: 12, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
                                    boxShadow: generating ? 'none' : '0 4px 14px rgba(0,39,94,0.2)',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                    {generating ? 'Generating with AI...' : 'Generate Draft'}
                                </button>
                            </div>
                        )}

                        {/* ── Step 2: Edit + Attach + Send ── */}
                        {showDraft && (
                            <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        Review &amp; Edit Offer Letter
                                    </h3>
                                    <button onClick={() => { setShowDraft(false); setAttachments([]); }} style={{
                                        padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e8ecf4',
                                        borderRadius: 6, fontSize: 10, color: '#94a3b8', cursor: 'pointer',
                                    }}>Discard</button>
                                </div>

                                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                                    Edit the content below. This is what will be sent to <strong style={{ color: '#1e293b' }}>{c.email}</strong>
                                </p>

                                {/* Editable offer content */}
                                <textarea
                                    value={draftContent}
                                    onChange={e => setDraftContent(e.target.value)}
                                    rows={14}
                                    style={{
                                        width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid #e8ecf4',
                                        fontSize: 13, color: '#1e293b', resize: 'vertical', fontFamily: "'Inter', sans-serif",
                                        outline: 'none', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.7,
                                        background: '#fafbfd',
                                    }}
                                />

                                {/* Attachments */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>Attachments</span>
                                        <input type="file" ref={fileInputRef} onChange={handleAddFiles} multiple style={{ display: 'none' }} />
                                        <button onClick={() => fileInputRef.current?.click()} style={{
                                            padding: '4px 12px', background: '#f8fafc', border: '1px solid #e8ecf4',
                                            borderRadius: 6, fontSize: 11, color: '#64748b', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500,
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                                            Add File
                                        </button>
                                    </div>
                                    {attachments.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {attachments.map((file, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 10px', background: '#f0f4ff', border: '1px solid #dbeafe',
                                                    borderRadius: 6, fontSize: 11, color: '#1d4ed8',
                                                }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                                                    <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                                    <span onClick={() => handleRemoveFile(i)} style={{ cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 12, lineHeight: 1 }}>&times;</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Send button */}
                                <button onClick={handleSendOffer} disabled={sending || !draftContent.trim()} style={{
                                    padding: '10px 24px',
                                    background: sending ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: sending ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10,
                                    fontSize: 12, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
                                    boxShadow: sending ? 'none' : '0 4px 14px rgba(0,39,94,0.2)',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                    {sending ? 'Sending...' : `Send to ${c.email}`}
                                </button>
                            </div>
                        )}

                        {/* Conversation Timeline */}
                        {history.length > 0 && (
                            <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                    Conversation Timeline
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{
                                            padding: '14px 16px', borderRadius: 12,
                                            background: h.type === 'candidate_reply' ? '#f0f4ff' : h.type === 'llm_classification' ? '#faf5ff' : h.type === 'converted_to_hire' ? '#f0fdf4' : '#fefce8',
                                            border: `1px solid ${h.type === 'candidate_reply' ? '#dbeafe' : h.type === 'llm_classification' ? '#e9d5ff' : h.type === 'converted_to_hire' ? '#bbf7d0' : '#fde68a'}`,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: h.type === 'candidate_reply' ? '#1d4ed8' : h.type === 'llm_classification' ? '#7c3aed' : h.type === 'converted_to_hire' ? '#15803d' : '#b45309' }}>
                                                    {h.type === 'offer_sent' ? 'Offer Sent' : h.type === 'candidate_reply' ? 'Candidate Reply' : h.type === 'llm_classification' ? 'AI Classification' : h.type === 'converted_to_hire' ? 'Converted to Hire' : h.type}
                                                </span>
                                                <span style={{ fontSize: 9, color: '#94a3b8' }}>{new Date(h.timestamp).toLocaleString()}</span>
                                            </div>
                                            {h.content && (
                                                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line', maxHeight: h.type === 'offer_sent' ? 120 : 'none', overflow: h.type === 'offer_sent' ? 'hidden' : 'visible' }}>
                                                    {h.content}
                                                    {h.type === 'offer_sent' && <span style={{ color: '#94a3b8', fontSize: 10 }}>... (truncated)</span>}
                                                </div>
                                            )}
                                            {h.attachments && h.attachments.length > 0 && (
                                                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {h.attachments.map((a, j) => (
                                                        <span key={j} style={{ padding: '2px 8px', background: '#f0f4ff', border: '1px solid #dbeafe', borderRadius: 4, fontSize: 10, color: '#1d4ed8' }}>{a}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {h.decision && (
                                                <div style={{ marginTop: 6 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: h.decision === 'accepted' ? '#15803d' : h.decision === 'rejected' ? '#dc2626' : h.decision === 'negotiating' ? '#7c3aed' : '#c2410c' }}>
                                                        Decision: {h.decision.toUpperCase()}
                                                    </span>
                                                    {h.reasoning && <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>{h.reasoning}</p>}
                                                    {h.suggested_response && (
                                                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>Suggested response: </span>{h.suggested_response}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {h.email_status && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Email: {h.email_status}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Offer Letter Content (post-send view) */}
                        {c.offer_letter_content && !showDraft && (
                            <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, padding: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>Offer Letter Content</h3>
                                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line', padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e8ecf4' }}>
                                    {c.offer_letter_content}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Convert to Hire Modal */}
                {showConvert && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setShowConvert(false)}>
                        <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                            onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Add to HR Pipeline</h2>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 20px' }}>This will create a new hire entry for HR to start onboarding.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Date of Joining *</label>
                                    <input type="date" value={convertForm.doj} onChange={e => setConvertForm(f => ({ ...f, doj: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Phone</label>
                                    <input type="text" value={convertForm.phone} onChange={e => setConvertForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder={c.phone || 'Phone number'}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Notes for HR</label>
                                    <textarea value={convertForm.recruiter_notes} onChange={e => setConvertForm(f => ({ ...f, recruiter_notes: e.target.value }))}
                                        placeholder="Any notes for the HR team..."
                                        rows={3}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8ecf4', fontSize: 12, color: '#1e293b', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button onClick={() => setShowConvert(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e8ecf4', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleConvert} disabled={converting || !convertForm.doj} style={{
                                    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                                    background: converting || !convertForm.doj ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: converting || !convertForm.doj ? '#94a3b8' : '#fff',
                                    fontSize: 12, fontWeight: 600, cursor: converting || !convertForm.doj ? 'not-allowed' : 'pointer',
                                }}>
                                    {converting ? 'Converting...' : 'Add to HR Pipeline'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
