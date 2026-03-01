'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDashboardMetrics, getPipeline, getEmailActivity } from '@/lib/api';
import styles from './page.module.css';

const PIPELINE_STAGES = [
  { key: 'offer_sent', label: 'Offer Sent', color: '#f59e0b' },
  { key: 'pre_boarding', label: 'Pre-Boarding', color: '#00ADEF' },
  { key: 'ready_to_join', label: 'Ready to Join', color: '#10b981' },
  { key: 'day_one', label: 'Day 1', color: '#8b5cf6' },
  { key: 'completed', label: 'Onboarded', color: '#059669' },
];

/* SVG icon components */
const Icons = {
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  laptop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M2 17h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" /></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>,
  arrowRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  sparkle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [aiActivity, setAiActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [m, p, ai] = await Promise.all([
        getDashboardMetrics().catch(() => null),
        getPipeline().catch(() => null),
        getEmailActivity(15).catch(() => []),
      ]);
      setMetrics(m);
      setPipeline(p);
      setAiActivity(Array.isArray(ai) ? ai : ai?.emails || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active Hires', value: metrics?.total_employees || 0,
      icon: Icons.users, bg: '#eef2ff', iconColor: '#00ADEF',
    },
    {
      label: 'Pre-boarding', value: metrics?.active_onboardings || 0,
      icon: Icons.activity, bg: '#fef3c7', iconColor: '#d97706',
    },
    {
      label: 'Pending Actions', value: metrics?.pending_actions || 0,
      icon: Icons.clock, bg: '#fce7f3', iconColor: '#db2777',
    },
    {
      label: 'AI Actions', value: aiActivity.length,
      icon: Icons.zap, bg: '#ecfdf5', iconColor: '#059669',
    },
  ];

  const pipelineColumns = PIPELINE_STAGES.map(stage => {
    const col = pipeline?.columns?.find(c => c.stage === stage.key);
    return { ...stage, count: col?.count || 0, employees: col?.employees || [] };
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'laptop_approval': return Icons.laptop;
      case 'id_card_confirmation': return Icons.shield;
      case 'candidate_offer_reply': return Icons.mail;
      case 'company_email_confirmation': return Icons.mail;
      default: return Icons.check;
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Onboarding pipeline overview</p>
        </div>
        <Link href="/employees/new" className={styles.addBtn}>
          {Icons.plus}
          Add New Hire
        </Link>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: stat.bg, color: stat.iconColor }}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="5" height="18" rx="1" /><rect x="9.5" y="6" width="5" height="15" rx="1" /><rect x="17" y="9" width="5" height="12" rx="1" /></svg>
            Pipeline
          </h2>
          <Link href="/pipeline" className={styles.viewAllLink}>
            View Full Board {Icons.arrowRight}
          </Link>
        </div>
        <div className={styles.kanban}>
          {pipelineColumns.map(col => (
            <div key={col.key} className={styles.kanbanColumn}>
              <div className={styles.kanbanHeader}>
                <div className={styles.kanbanDot} style={{ background: col.color }} />
                <span className={styles.kanbanLabel}>{col.label}</span>
                <span className={styles.kanbanCount}>{col.count}</span>
              </div>
              <div className={styles.kanbanCards}>
                {col.employees.length === 0 ? (
                  <div className={styles.kanbanEmpty}>No employees</div>
                ) : (
                  col.employees.slice(0, 4).map(emp => (
                    <Link key={emp.id} href={`/employees/${emp.id}`} className={styles.empCard}>
                      <div className={styles.empAvatar} style={{ background: col.color }}>
                        {(emp.first_name || '?')[0]}
                      </div>
                      <div className={styles.empInfo}>
                        <div className={styles.empName}>{emp.first_name} {emp.last_name || ''}</div>
                        <div className={styles.empRole}>{emp.designation || emp.domain || 'New Hire'}</div>
                      </div>
                      {emp.workflow_progress !== undefined && (
                        <div className={styles.empProgress}>
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${emp.workflow_progress || 0}%` }} />
                          </div>
                          <span className={styles.progressLabel}>{emp.workflow_progress || 0}%</span>
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Activity Feed */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {Icons.zap}
            AI Activity
          </h2>
          <Link href="/ai-center" className={styles.viewAllLink}>
            View All {Icons.arrowRight}
          </Link>
        </div>
        <div className={styles.aiFeed}>
          {aiActivity.length === 0 ? (
            <div className={styles.aiEmpty}>
              <div className={styles.aiEmptyIcon}>{Icons.zap}</div>
              <p>No AI activity yet. Emails will appear here as they are processed.</p>
            </div>
          ) : (
            aiActivity.slice(0, 8).map((item, i) => {
              const classification = item.ai_classification || {};
              return (
                <div key={i} className={styles.aiItem}>
                  <div className={styles.aiIcon}>
                    {getCategoryIcon(classification.category)}
                  </div>
                  <div className={styles.aiContent}>
                    <div className={styles.aiText}>
                      <strong>{item.from_email || 'Unknown'}</strong>
                      {' — '}
                      {classification.summary || item.subject || 'Email processed'}
                    </div>
                    <div className={styles.aiMeta}>
                      {classification.action && (
                        <span className={`${styles.aiBadge} ${styles[`badge_${classification.action}`] || ''}`}>
                          {classification.action?.replace(/_/g, ' ')}
                        </span>
                      )}
                      {classification.confidence && (
                        <span className={styles.aiConfidence}>
                          {Math.round(classification.confidence * 100)}% confident
                        </span>
                      )}
                      <span className={styles.aiTime}>
                        {item.received_at ? new Date(item.received_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
