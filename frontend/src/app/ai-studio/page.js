'use client';

import { useState, useEffect } from 'react';
import { getEmployees, generateAIContent, getEmployeeAIContent, approveAIContent, classifyEmail, chatWithBot } from '@/lib/api';
import { CONTENT_TYPES, TONES } from '@/lib/constants';

export default function AIStudioPage() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState('');
    const [genType, setGenType] = useState('welcome_writeup');
    const [genTone, setGenTone] = useState('professional');
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState([]);
    const [emailBody, setEmailBody] = useState('');
    const [classifyResult, setClassifyResult] = useState(null);
    const [classifying, setClassifying] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatting, setChatting] = useState(false);
    const [activeTab, setActiveTab] = useState('generate');

    useEffect(() => {
        getEmployees({ per_page: 100 }).then(d => setEmployees(d.employees)).catch(() => { });
    }, []);

    async function handleGenerate() {
        if (!selectedEmp) return alert('Select an employee first');
        setGenerating(true);
        try {
            await generateAIContent({ employee_id: selectedEmp, content_type: genType, tone: genTone });
            const contents = await getEmployeeAIContent(selectedEmp);
            setGeneratedContent(contents);
        } catch (err) { alert(err.message); }
        finally { setGenerating(false); }
    }

    async function handleClassify() {
        if (!emailBody.trim()) return;
        setClassifying(true);
        try {
            const result = await classifyEmail({ email_body: emailBody });
            setClassifyResult(result);
        } catch (err) { alert(err.message); }
        finally { setClassifying(false); }
    }

    async function handleChat(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
        setChatInput('');
        setChatting(true);
        try {
            const data = await chatWithBot(chatInput, chatMessages);
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        } finally { setChatting(false); }
    }

    const tabs = [
        { key: 'generate', label: 'Content Generator' },
        { key: 'classify', label: 'Email Classifier' },
        { key: 'chatbot', label: 'Chatbot' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>AI Studio</h1>
                <p>AI-powered content generation, email classification, and onboarding assistant</p>
            </div>

            <div className="tab-bar">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Generator */}
            {activeTab === 'generate' && (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '14px' }}>Generate Content</h3>
                        <div className="form-group">
                            <label className="form-label">Employee</label>
                            <select value={selectedEmp} onChange={(e) => { setSelectedEmp(e.target.value); setGeneratedContent([]); }}
                                className="form-select">
                                <option value="">Select employee...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name || e.personal_email}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Content Type</label>
                            <select value={genType} onChange={(e) => setGenType(e.target.value)} className="form-select">
                                {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tone</label>
                            <select value={genTone} onChange={(e) => setGenTone(e.target.value)} className="form-select">
                                {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <button onClick={handleGenerate} disabled={generating}
                            className="btn btn-primary" style={{ width: '100%' }}>
                            {generating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>

                    <div>
                        {generatedContent.length === 0 ? (
                            <div className="card"><div className="empty-state">
                                <h3>No content yet</h3><p>Select an employee and generate AI-powered content.</p>
                            </div></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {generatedContent.map(content => (
                                    <div key={content.id} className="ai-content-card">
                                        <div className="ai-content-card-header">
                                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-900)' }}>
                                                {CONTENT_TYPES.find(t => t.value === content.content_type)?.label} &middot; {content.tone}
                                            </span>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <span className={`badge ${content.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>{content.status}</span>
                                                {content.status === 'draft' && (
                                                    <button onClick={() => approveAIContent(content.id).then(() => getEmployeeAIContent(selectedEmp).then(setGeneratedContent))}
                                                        className="btn btn-sm btn-success">Approve</button>
                                                )}
                                            </div>
                                        </div>
                                        {content.content_type === 'linkedin_post' ? (
                                            <div style={{ padding: '16px' }}>
                                                <div className="linkedin-preview">
                                                    <div className="linkedin-preview-header">
                                                        <div className="linkedin-preview-avatar">SK</div>
                                                        <div>
                                                            <div className="linkedin-preview-name">Shellkode Technologies</div>
                                                            <div className="linkedin-preview-meta">IT Services &middot; Just now</div>
                                                        </div>
                                                    </div>
                                                    <div className="linkedin-preview-body">{content.content}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ai-content-body">{content.content}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Email Classifier */}
            {activeTab === 'classify' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '14px' }}>Paste Email Reply</h3>
                        <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                            className="form-textarea" rows="10"
                            placeholder="Paste the candidate's email reply here..." />
                        <button onClick={handleClassify} disabled={classifying}
                            className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                            {classifying ? 'Classifying...' : 'Classify with AI'}
                        </button>
                    </div>
                    <div className="card">
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '14px' }}>Result</h3>
                        {!classifyResult ? (
                            <div className="empty-state" style={{ padding: '24px' }}><p>Paste an email and click classify to see AI analysis.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-900)' }}>{classifyResult.status}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-400)' }}>Confidence: {(classifyResult.confidence * 100).toFixed(0)}%</div>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{ width: `${classifyResult.confidence * 100}%` }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-700)', marginBottom: '4px' }}>Summary</div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-500)' }}>{classifyResult.summary}</p>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-700)', marginBottom: '4px' }}>Suggested Action</div>
                                    <p style={{ fontSize: '13px', color: 'var(--brand-600)' }}>{classifyResult.suggested_action}</p>
                                </div>
                                {classifyResult.extracted_points?.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-700)', marginBottom: '4px' }}>Key Points</div>
                                        <ul style={{ fontSize: '12px', color: 'var(--text-500)', paddingLeft: '16px', margin: 0 }}>
                                            {classifyResult.extracted_points.map((p, i) => <li key={i} style={{ marginBottom: '2px' }}>{p}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chatbot */}
            {activeTab === 'chatbot' && (
                <div className="card" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '480px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '14px' }}>Onboarding Assistant</h3>
                    <div style={{
                        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px',
                        padding: '14px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '12px',
                        border: '1px solid var(--border)',
                    }}>
                        {chatMessages.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-400)', padding: '40px', fontSize: '13px' }}>
                                Ask anything about Shellkode's onboarding process, policies, or culture.
                            </div>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '75%', padding: '8px 14px', borderRadius: '12px', fontSize: '13px',
                                background: msg.role === 'user' ? 'var(--brand-500)' : 'white',
                                color: msg.role === 'user' ? 'white' : 'var(--text-700)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                            }}>{msg.content}</div>
                        ))}
                        {chatting && (
                            <div style={{
                                alignSelf: 'flex-start', padding: '8px 14px', background: 'white',
                                borderRadius: '12px', color: 'var(--text-400)', fontSize: '13px',
                                border: '1px solid var(--border)'
                            }}>Thinking...</div>
                        )}
                    </div>
                    <form onSubmit={handleChat} style={{ display: 'flex', gap: '8px' }}>
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                            className="form-input" placeholder="Ask a question..." style={{ flex: 1 }} disabled={chatting} />
                        <button type="submit" disabled={chatting} className="btn btn-primary">Send</button>
                    </form>
                </div>
            )}
        </div>
    );
}
