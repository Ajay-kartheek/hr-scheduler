/**
 * HR Scheduler — App Constants
 */

export const STAGES = [
    { value: 'offer_sent', label: 'Offer Sent', color: '#d97706' },
    { value: 'offer_accepted', label: 'Offer Accepted', color: '#16a34a' },
    { value: 'pre_boarding', label: 'Pre-Boarding', color: '#4f46e5' },
    { value: 'ready_to_join', label: 'Ready to Join', color: '#0d9488' },
    { value: 'day_one', label: 'Day 1', color: '#7c3aed' },
    { value: 'onboarding', label: 'Onboarding', color: '#2563eb' },
    { value: 'completed', label: 'Completed', color: '#16a34a' },
];

export const DOMAINS = [
    { value: 'AI', label: 'Artificial Intelligence' },
    { value: 'Cloud', label: 'Cloud Solutions' },
    { value: 'Data', label: 'Data Engineering' },
    { value: 'DB', label: 'Database Services' },
    { value: 'MSP', label: 'Managed Services' },
    { value: 'Sales', label: 'Sales & Marketing' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'FullStack', label: 'Full Stack Development' },
    { value: 'Security', label: 'Security' },
];

export const STEP_STATUSES = {
    pending: { label: 'Pending', color: '#9ca3af', dotClass: 'dot-gray' },
    in_progress: { label: 'In Progress', color: '#2563eb', dotClass: 'dot-blue' },
    waiting_reply: { label: 'Waiting Reply', color: '#d97706', dotClass: 'dot-amber' },
    completed: { label: 'Completed', color: '#16a34a', dotClass: 'dot-green' },
    skipped: { label: 'Skipped', color: '#6b7280', dotClass: 'dot-gray' },
    failed: { label: 'Failed', color: '#dc2626', dotClass: 'dot-red' },
    hitl: { label: 'Action Required', color: '#dc2626', dotClass: 'dot-red' },
};

export const CONTENT_TYPES = [
    { value: 'welcome_writeup', label: 'Welcome Write-up' },
    { value: 'linkedin_post', label: 'LinkedIn Post' },
    { value: 'welcome_email', label: 'Welcome Email' },
    { value: 'followup_email', label: 'Follow-up Email' },
];

export const TONES = [
    { value: 'professional', label: 'Professional' },
    { value: 'celebratory', label: 'Celebratory' },
    { value: 'casual', label: 'Casual' },
];
