'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEmployees } from '@/lib/api';
import { STAGES, DOMAINS } from '@/lib/constants';

export default function EmployeesPage() {
    const [data, setData] = useState({ employees: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => { loadEmployees(); }, [page, stageFilter, domainFilter]);

    async function loadEmployees() {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (stageFilter) params.stage = stageFilter;
            if (domainFilter) params.domain = domainFilter;
            if (search) params.search = search;
            const result = await getEmployees(params);
            setData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        loadEmployees();
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Employees</h1>
                        <p>{data.total} total employees</p>
                    </div>
                    <Link href="/employees/new" className="btn btn-primary">+ Add New Hire</Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '16px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
                        <input type="text" className="form-input" placeholder="Search by name, email, role ID..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{ background: 'white' }} />
                    </form>
                    <select className="form-select" value={stageFilter}
                        onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                        style={{ width: '150px', background: 'white' }}>
                        <option value="">All Stages</option>
                        {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select className="form-select" value={domainFilter}
                        onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
                        style={{ width: '150px', background: 'white' }}>
                        <option value="">All Domains</option>
                        {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : data.employees.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <h3>No employees found</h3>
                        <p>Add your first hire to get started with the onboarding pipeline.</p>
                        <Link href="/employees/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Add New Hire</Link>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Role ID</th>
                                <th>Designation</th>
                                <th>Domain</th>
                                <th>Stage</th>
                                <th>DOJ</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.employees.map(emp => {
                                const stage = STAGES.find(s => s.value === emp.current_stage);
                                const initial = (emp.first_name?.[0] || emp.personal_email[0]).toUpperCase();
                                const colors = ['#4f46e5', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#2563eb'];
                                const bgColor = colors[initial.charCodeAt(0) % colors.length];

                                return (
                                    <tr key={emp.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="avatar avatar-md" style={{ background: bgColor }}>{initial}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-900)' }}>
                                                        {emp.full_name || emp.personal_email}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-400)' }}>{emp.personal_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--brand-600)' }}>
                                            {emp.role_id || '\u2014'}
                                        </td>
                                        <td>{emp.designation}</td>
                                        <td><span className="badge badge-info">{emp.domain}</span></td>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <span className="dot" style={{ background: stage?.color }}></span>
                                                <span style={{ fontSize: '12px' }}>{stage?.label}</span>
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-400)' }}>
                                            {emp.doj ? new Date(emp.doj).toLocaleDateString() : '\u2014'}
                                        </td>
                                        <td>
                                            <Link href={`/employees/${emp.id}`} className="btn btn-ghost btn-sm">View</Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
