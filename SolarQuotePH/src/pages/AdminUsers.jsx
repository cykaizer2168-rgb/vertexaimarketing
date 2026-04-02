import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { formatDate } from '../utils/compute'

const STATUS_COLORS = {
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  active: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  blocked: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
}

const ROLE_COLORS = {
  master_admin: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Master Admin' },
  estimator: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Estimator' },
  sales_agent: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: 'Sales Agent' },
}

function Badge({ text, bg, color }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: bg, color,
    }}>{text}</span>
  )
}

function Initials({ name, status }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const bg = status === 'active' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
             status === 'pending' ? 'linear-gradient(135deg, #f59e0b, #b45309)' :
             'linear-gradient(135deg, #6b7280, #4b5563)'
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: '#fff',
    }}>{initials}</div>
  )
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(null) // { type: 'approve'|'role', user }
  const [selectedRole, setSelectedRole] = useState('sales_agent')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const approve = async () => {
    if (!sheet?.user) return
    setActionLoading(true)
    await supabase.from('users').update({
      status: 'active',
      role: selectedRole,
      approved_at: new Date().toISOString(),
      approved_by: currentUser.id,
    }).eq('id', sheet.user.id)
    await fetchUsers()
    setActionLoading(false)
    setSheet(null)
  }

  const reject = async (userId) => {
    await supabase.from('users').update({ status: 'blocked' }).eq('id', userId)
    await fetchUsers()
  }

  const updateRole = async () => {
    if (!sheet?.user) return
    setActionLoading(true)
    await supabase.from('users').update({ role: selectedRole }).eq('id', sheet.user.id)
    await fetchUsers()
    setActionLoading(false)
    setSheet(null)
  }

  const toggleBlock = async (u) => {
    const newStatus = u.status === 'blocked' ? 'active' : 'blocked'
    await supabase.from('users').update({ status: newStatus }).eq('id', u.id)
    await fetchUsers()
  }

  const pending = users.filter(u => u.status === 'pending')
  const active = users.filter(u => u.status === 'active')
  const blocked = users.filter(u => u.status === 'blocked')

  const stats = [
    { label: 'Total', value: users.length, color: 'var(--text)' },
    { label: 'Pending', value: pending.length, color: 'var(--amber)' },
    { label: 'Active', value: active.length, color: 'var(--green)' },
    { label: 'Blocked', value: blocked.length, color: 'var(--red)' },
  ]

  const cardStyle = {
    background: 'var(--surface)', borderRadius: 12,
    border: '1px solid var(--border)', padding: '14px 16px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  }

  const btnStyle = (variant) => ({
    padding: '6px 14px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
    background: variant === 'approve' ? 'var(--green)' :
                variant === 'reject' ? 'var(--red-bg)' :
                variant === 'block' ? 'var(--red-bg)' :
                variant === 'unblock' ? 'var(--green-bg)' : 'var(--surface2)',
    color: variant === 'approve' ? '#fff' :
           variant === 'reject' ? 'var(--red)' :
           variant === 'block' ? 'var(--red)' :
           variant === 'unblock' ? 'var(--green)' : 'var(--text-muted)',
  })

  function UserCard({ u, section }) {
    const roleMeta = ROLE_COLORS[u.role] || ROLE_COLORS.sales_agent
    const statusMeta = STATUS_COLORS[u.status] || STATUS_COLORS.pending

    return (
      <div style={cardStyle}>
        <Initials name={u.display_name} status={u.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{u.display_name || u.email}</span>
            <Badge text={u.status} bg={statusMeta.bg} color={statusMeta.color} />
            <Badge text={roleMeta.label} bg={roleMeta.bg} color={roleMeta.color} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</div>
          {u.company && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.company}</div>}
          {u.mobile && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.mobile}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Joined {formatDate(u.created_at)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {section === 'pending' && (
              <>
                <button style={btnStyle('approve')} onClick={() => { setSelectedRole('sales_agent'); setSheet({ type: 'approve', user: u }) }}>
                  ✓ Approve
                </button>
                <button style={btnStyle('reject')} onClick={() => reject(u.id)}>
                  ✗ Reject
                </button>
              </>
            )}
            {section === 'active' && u.id !== currentUser?.id && (
              <>
                <button style={btnStyle('default')}
                  onClick={() => { setSelectedRole(u.role); setSheet({ type: 'role', user: u }) }}>
                  Edit Role
                </button>
                <button style={btnStyle('block')} onClick={() => toggleBlock(u)}>
                  Block
                </button>
              </>
            )}
            {section === 'blocked' && (
              <button style={btnStyle('unblock')} onClick={() => toggleBlock(u)}>
                Unblock
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
          User Management
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', borderRadius: 12, padding: '14px',
              border: '1px solid var(--border)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <Section title="Pending Approval" count={pending.length} color="var(--amber)">
                {pending.map(u => <UserCard key={u.id} u={u} section="pending" />)}
              </Section>
            )}
            {active.length > 0 && (
              <Section title="Active Users" count={active.length} color="var(--green)">
                {active.map(u => <UserCard key={u.id} u={u} section="active" />)}
              </Section>
            )}
            {blocked.length > 0 && (
              <Section title="Blocked Users" count={blocked.length} color="var(--red)">
                {blocked.map(u => <UserCard key={u.id} u={u} section="blocked" />)}
              </Section>
            )}
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No users yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheet && (
        <>
          <div className="sheet-overlay" onClick={() => setSheet(null)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {sheet.type === 'approve' ? 'Approve User' : 'Edit Role'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              {sheet.user.display_name} — {sheet.user.email}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                Assign role
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'estimator', label: 'Estimator' },
                  { id: 'sales_agent', label: 'Sales Agent' },
                ].map(r => (
                  <button key={r.id} onClick={() => setSelectedRole(r.id)} style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: `2px solid ${selectedRole === r.id ? 'var(--amber)' : 'var(--border)'}`,
                    background: selectedRole === r.id ? 'var(--amber-bg)' : 'var(--surface2)',
                    color: selectedRole === r.id ? 'var(--amber)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
            <button
              onClick={sheet.type === 'approve' ? approve : updateRole}
              disabled={actionLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: actionLoading ? 'var(--surface2)' : 'var(--amber)',
                color: actionLoading ? 'var(--text-muted)' : '#000',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {actionLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> :
                sheet.type === 'approve' ? 'Approve & Activate' : 'Update Role'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, count, color, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>{title}</h2>
        <span style={{
          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: 'var(--surface2)', color,
        }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}
