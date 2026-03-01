'use client';

import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, markAllRead } from '@/lib/api';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { loadNotifications(); }, [filter]);

    async function loadNotifications() {
        setLoading(true);
        try {
            const params = {};
            if (filter === 'unread') params.unread_only = true;
            const data = await getNotifications(params);
            setNotifications(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleMarkRead(id) { await markNotificationRead(id); loadNotifications(); }
    async function handleMarkAllRead() { await markAllRead(); loadNotifications(); }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Notifications</h1>
                        <p>{notifications.filter(n => !n.read).length} unread</p>
                    </div>
                    <button onClick={handleMarkAllRead} className="btn btn-secondary">Mark All Read</button>
                </div>
            </div>

            <div className="tab-bar">
                {['all', 'unread'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`tab-btn ${filter === f ? 'active' : ''}`}>
                        {f === 'all' ? 'All' : 'Unread'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : notifications.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>No notifications</h3><p>You're all caught up.</p>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {notifications.map(notif => (
                        <div key={notif.id} className="card" style={{
                            padding: '14px 18px',
                            opacity: notif.read ? 0.65 : 1,
                            borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--brand-500)',
                            cursor: 'pointer',
                        }}
                            onClick={() => !notif.read && handleMarkRead(notif.id)}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div className="dot" style={{
                                    background: notif.notification_type === 'escalation' ? 'var(--red-600)'
                                        : notif.notification_type === 'action_required' ? 'var(--amber-600)'
                                            : 'var(--brand-400)',
                                    marginTop: '5px',
                                }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-900)', marginBottom: '2px' }}>{notif.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-500)' }}>{notif.message}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-400)', marginTop: '4px' }}>
                                        {new Date(notif.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {!notif.read && <div className="dot dot-blue" style={{ marginTop: '5px' }}></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
