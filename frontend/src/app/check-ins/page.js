'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CheckInsPage() {
    const [checkins, setCheckins] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [ciData, empData] = await Promise.all([
                fetch(`${API}/api/check-ins/`).then(r => r.json()),
                fetch(`${API}/api/employees/?per_page=100`).then(r => r.json()),
            ]);
            setCheckins(ciData);
            setEmployees(empData.employees || []);
        } catch { }
        setLoading(false);
    }

    async function scheduleForEmployee(empId) {
        try {
            await fetch(`${API}/api/check-ins/auto-schedule/${empId}`, { method: 'POST' });
            loadData();
        } catch (err) { alert(err.message); }
    }

    async function completeCheckin(id, responses, rating, notes) {
        try {
            await fetch(`${API}/api/check-ins/${id}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses, rating: parseInt(rating), manager_notes: notes }),
            });
            loadData();
            setExpandedId(null);
        } catch (err) { alert(err.message); }
    }

    const statusColors = {
        scheduled: { bg: '#dbeafe', color: '#2563eb' },
        completed: { bg: '#dcfce7', color: '#16a34a' },
        overdue: { bg: '#fee2e2', color: '#dc2626' },
        skipped: { bg: '#f0f1f5', color: '#6b7280' },
    };

    const typeLabels = { day_30: '30 Day', day_60: '60 Day', day_90: '90 Day' };
    const typeColors = { day_30: '#3b82f6', day_60: '#8b5cf6', day_90: '#f59e0b' };

    const scheduledEmps = new Set(checkins.map(c => c.employee_id));
    const unscheduled = employees.filter(e => !scheduledEmps.has(e.id));

    const scheduled = checkins.filter(c => c.status === 'scheduled').length;
    const completed = checkins.filter(c => c.status === 'completed').length;
    const overdue = checkins.filter(c => c.status === 'overdue').length;

    if (loading) return <div className="page-header"><h1>Check-ins</h1><p>Loading...</p></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>30-60-90 Day Check-ins</h1>
                        <p>Automated pulse checks with AI-generated questions</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: 'var(--brand-600)' }}>{checkins.length}</div>
                    <div className="stat-card-label">Total Check-ins</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: '#2563eb' }}>{scheduled}</div>
                    <div className="stat-card-label">Scheduled</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: '#16a34a' }}>{completed}</div>
                    <div className="stat-card-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: overdue > 0 ? '#dc2626' : '#22c55e' }}>{overdue}</div>
                    <div className="stat-card-label">Overdue</div>
                </div>
            </div>

            {/* Unscheduled employees */}
            {unscheduled.length > 0 && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                        Schedule Check-ins
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {unscheduled.map(emp => (
                            <button key={emp.id} onClick={() => scheduleForEmployee(emp.id)}
                                className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                                📅 {emp.full_name || emp.personal_email}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Check-in Timeline */}
            <div className="card">
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Check-in Timeline</h3>
                {checkins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-400)' }}>
                        <p style={{ fontSize: '14px', marginBottom: '4px' }}>No check-ins scheduled yet</p>
                        <p style={{ fontSize: '12px' }}>Click an employee above to auto-schedule 30-60-90 day check-ins</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {checkins.map(ci => (
                            <div key={ci.id}>
                                <div style={{
                                    padding: '14px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)',
                                    borderLeft: `4px solid ${typeColors[ci.check_in_type] || '#6b7280'}`,
                                    cursor: 'pointer',
                                }} onClick={() => setExpandedId(expandedId === ci.id ? null : ci.id)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '10px',
                                                background: typeColors[ci.check_in_type] || '#6b7280', color: 'white',
                                            }}>
                                                {typeLabels[ci.check_in_type] || ci.check_in_type}
                                            </span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-900)' }}>
                                                {ci.employee_name}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-500)' }}>
                                                {ci.designation}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-400)' }}>{ci.scheduled_date}</span>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                                                ...statusColors[ci.status],
                                            }}>
                                                {ci.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {ci.rating && (
                                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-500)' }}>
                                            Rating: {'⭐'.repeat(ci.rating)} ({ci.rating}/5)
                                        </div>
                                    )}
                                </div>

                                {/* Expanded view */}
                                {expandedId === ci.id && (
                                    <div style={{
                                        padding: '16px', background: 'white', border: '1px solid var(--border)',
                                        borderRadius: '0 0 var(--radius-md) var(--radius-md)', marginTop: '-4px',
                                    }}>
                                        {ci.ai_questions && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>AI-Generated Questions</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {ci.ai_questions.map((q, i) => (
                                                        <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-700)' }}>{q.question}</div>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-400)' }}>
                                                                {q.type === 'scale' ? '📊 Scale (1-5)' : '💬 Open-ended'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {ci.status !== 'completed' && (
                                            <CompletionForm id={ci.id} onComplete={completeCheckin} />
                                        )}

                                        {ci.employee_responses && (
                                            <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: 'var(--radius-sm)' }}>
                                                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>Responses</h4>
                                                {Object.entries(ci.employee_responses).map(([k, v]) => (
                                                    <div key={k} style={{ fontSize: '12px', color: 'var(--text-700)', marginBottom: '4px' }}>
                                                        <strong>Q{parseInt(k) + 1}:</strong> {v}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CompletionForm({ id, onComplete }) {
    const [responses, setResponses] = useState({});
    const [rating, setRating] = useState('4');
    const [notes, setNotes] = useState('');

    return (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Complete Check-in</h4>
            <div className="form-group">
                <label className="form-label">Overall Rating</label>
                <select value={rating} onChange={e => setRating(e.target.value)} className="form-select" style={{ width: '120px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Manager Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    className="form-textarea" rows={3} placeholder="Key observations, action items..." />
            </div>
            <button onClick={() => onComplete(id, responses, rating, notes)} className="btn btn-primary btn-sm">
                ✓ Mark Complete
            </button>
        </div>
    );
}
