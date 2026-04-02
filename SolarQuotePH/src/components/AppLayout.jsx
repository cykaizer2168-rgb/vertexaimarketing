import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ── Constants ──────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  master_admin: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Master Admin' },
  estimator:    { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'Estimator'   },
  sales_agent:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', label: 'Sales Agent' },
}

const PAGE_TITLES = {
  '/dashboard':       'Dashboard',
  '/quotes':          'My Quotes',
  '/cost-control':    'Cost Control',
  '/admin/users':     'Users',
  '/admin/analytics': 'Analytics',
}

// Each nav item: { to, label, Icon, roles, disabled? }
// Dividers:      { divider: true, roles }  — renders a separator line
const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',   Icon: GridIcon,     roles: ['master_admin','estimator','sales_agent'] },
  { to: '/quotes',          label: 'My Quotes',   Icon: FileIcon,     roles: ['master_admin','estimator','sales_agent'] },
  { divider: true,                                                      roles: ['master_admin','estimator'] },
  { to: '/cost-control',    label: 'Cost Control',Icon: ChartIcon,    roles: ['master_admin','estimator'] },
  { to: '/inventory',       label: 'Inventory',   Icon: BoxIcon,      roles: ['master_admin','estimator'], disabled: true },
  { divider: true,                                                      roles: ['master_admin'] },
  { to: '/admin/users',     label: 'Users',       Icon: UsersIcon,    roles: ['master_admin'] },
  { to: '/admin/analytics', label: 'Analytics',   Icon: TrendingIcon, roles: ['master_admin'], disabled: true },
]

// ── Icons ──────────────────────────────────────────────────────────────────

function SunIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" fill="#f59e0b"/>
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <line key={i} x1="24" y1="24"
          x2={24 + 19 * Math.cos((angle * Math.PI) / 180)}
          y2={24 + 19 * Math.sin((angle * Math.PI) / 180)}
          stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}
function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}
function TrendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}
function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
    </svg>
  )
}
function SunSmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"    x2="12" y2="3"/>
      <line x1="12" y1="21"   x2="12" y2="23"/>
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"    y1="12"   x2="3"    y2="12"/>
      <line x1="21"   y1="12"   x2="23"   y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

// ── Initials avatar (same logic as old Header.jsx) ─────────────────────────

function Initials({ name, photo, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (photo) return (
    <img src={photo} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #f59e0b, #b45309)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.375), fontWeight: 700, color: '#000',
    }}>{initials}</div>
  )
}

// ── Shared nav item style function ─────────────────────────────────────────

function navItemStyle(isActive, disabled) {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 16px',
    paddingLeft: isActive ? 14 : 16,
    fontSize: 14, fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap', overflow: 'hidden',
    color: disabled ? 'rgba(122,139,168,0.4)' : isActive ? '#f59e0b' : '#7a8ba8',
    background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
    borderLeft: isActive ? '2px solid #f59e0b' : '2px solid transparent',
  }
}

// ── Sidebar action button (API Key, Theme) ─────────────────────────────────

function SidebarActionBtn({ onClick, active, icon, label, collapsed, title }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={collapsed ? title : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        gap: 10, padding: '9px 16px',
        background: active ? 'rgba(245,158,11,0.08)' : hovered ? 'rgba(255,255,255,0.04)' : 'none',
        border: 'none', cursor: 'pointer',
        color: active ? '#f59e0b' : hovered ? '#f0f4ff' : '#7a8ba8',
        fontSize: 14, fontWeight: 500, textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}
    >
      {icon}
      {!collapsed && label}
    </button>
  )
}

// ── AppLayout ──────────────────────────────────────────────────────────────

export default function AppLayout({ children }) {
  const { profile, role, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined'
      ? localStorage.getItem('solar_sidebar_collapsed') === 'true'
      : false
  )
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [showApiInput, setShowApiInput]     = useState(false)
  const [apiKey, setApiKey]                 = useState(() => typeof window !== 'undefined'
    ? localStorage.getItem('solar_openai_key') || ''
    : ''
  )
  const [showKey, setShowKey]               = useState(false)
  const [theme, setTheme]                   = useState(() => typeof window !== 'undefined'
    ? localStorage.getItem('solar_theme') || 'dark'
    : 'dark'
  )
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const avatarMenuRef = useRef(null)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('solar_sidebar_collapsed', String(next))
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('solar_theme', next)
  }

  const handleApiKeyChange = (v) => {
    setApiKey(v)
    if (v.startsWith('sk-')) localStorage.setItem('solar_openai_key', v)
    else localStorage.removeItem('solar_openai_key')
  }

  const roleMeta    = ROLE_COLORS[role] || ROLE_COLORS.sales_agent
  const pageTitle   = PAGE_TITLES[location.pathname] || ''
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  // Mobile tab bar items (max 4 + "More")
  const tabItems = [
    { to: '/dashboard',    label: 'Home',   Icon: GridIcon,  roles: ['master_admin','estimator','sales_agent'] },
    { to: '/quotes',       label: 'Quotes', Icon: FileIcon,  roles: ['master_admin','estimator','sales_agent'] },
    { to: '/cost-control', label: 'Costs',  Icon: ChartIcon, roles: ['master_admin','estimator'] },
    { to: '/admin/users',  label: 'Users',  Icon: UsersIcon, roles: ['master_admin'] },
  ].filter(t => t.roles.includes(role))

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>

      {/* Mobile overlay — tap to close drawer */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={[
        'app-sidebar',
        collapsed ? 'sidebar-collapsed' : '',
        mobileOpen ? 'sidebar-mobile-open' : '',
      ].filter(Boolean).join(' ')}>

        {/* Logo + role badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '18px 0' : '18px 16px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <SunIcon size={collapsed ? 22 : 26} />
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
                color: '#f0f4ff', whiteSpace: 'nowrap',
              }}>SolarQuote PH</div>
              <div style={{
                display: 'inline-block', marginTop: 4,
                padding: '2px 8px', borderRadius: 20,
                fontSize: 10, fontWeight: 600,
                background: roleMeta.bg, color: roleMeta.color,
              }}>{roleMeta.label}</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          paddingTop: 8, paddingBottom: 8,
        }}>
          {visibleItems.map((item, i) => {
            // Section divider
            if (item.divider) {
              if (collapsed) return null
              return (
                <div key={`div-${i}`} style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.06)',
                  margin: '6px 16px',
                }} />
              )
            }

            // Disabled placeholder item
            if (item.disabled) {
              return (
                <div key={item.to}
                  title={collapsed ? item.label : undefined}
                  style={navItemStyle(false, true)}>
                  <item.Icon />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                        padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                      }}>Soon</span>
                    </>
                  )}
                </div>
              )
            }

            // Active nav link
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => navItemStyle(isActive, false)}
              >
                <item.Icon />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar API key input (expands above bottom section) */}
        {showApiInput && (
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            animation: 'fadeSlideIn 0.15s ease-out',
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => handleApiKeyChange(e.target.value)}
                placeholder="sk-..."
                autoFocus
                style={{
                  width: '100%', padding: '8px 40px 8px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${
                    apiKey && !apiKey.startsWith('sk-') ? '#ef4444'
                    : apiKey.startsWith('sk-') ? '#22c55e'
                    : 'rgba(255,255,255,0.1)'
                  }`,
                  borderRadius: 7, color: '#f0f4ff', fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
              <button onClick={() => setShowKey(p => !p)} style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#7a8ba8', fontSize: 11,
              }}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {apiKey && !apiKey.startsWith('sk-') && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                Invalid key format
              </p>
            )}
            {apiKey.startsWith('sk-') && (
              <p style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>
                Key saved ✓
              </p>
            )}
          </div>
        )}

        {/* Bottom actions: API key + theme toggle */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 4, paddingBottom: 4, flexShrink: 0,
        }}>
          <SidebarActionBtn
            onClick={() => {
              // If collapsed, expand first so the input is visible
              if (collapsed) {
                setCollapsed(false)
                localStorage.setItem('solar_sidebar_collapsed', 'false')
              }
              setShowApiInput(p => !p)
            }}
            active={showApiInput}
            icon={<KeyIcon />}
            label="API Key"
            collapsed={collapsed}
            title="API Key"
          />
          <SidebarActionBtn
            onClick={toggleTheme}
            active={false}
            icon={theme === 'dark' ? <SunSmallIcon /> : <MoonIcon />}
            label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            collapsed={collapsed}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          />
        </div>

        {/* Profile section */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 0' : '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}>
          <Initials name={profile?.display_name} photo={profile?.photo_url} size={collapsed ? 28 : 32} />
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#f0f4ff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{profile?.display_name || 'User'}</div>
              <div style={{
                fontSize: 11, color: '#7a8ba8',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{profile?.email}</div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ padding: collapsed ? '0 8px 10px' : '0 14px 10px', flexShrink: 0 }}>
          <button
            onClick={signOut}
            aria-label="Sign out"
            title={collapsed ? 'Sign out' : undefined}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: collapsed ? '8px' : '8px 12px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8, cursor: 'pointer', color: '#ef4444',
              fontSize: 13, fontWeight: 500,
            }}
          >
            <SignOutIcon />
            {!collapsed && 'Sign out'}
          </button>
        </div>

        {/* Collapse toggle (desktop only — hidden on mobile via CSS) */}
        <div className="sidebar-collapse-toggle"
          style={{ padding: collapsed ? '0 8px 14px' : '0 14px 14px', flexShrink: 0 }}>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: '7px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 7, cursor: 'pointer', color: '#7a8ba8',
              fontSize: 12, fontWeight: 500,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s', flexShrink: 0,
              }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className={['app-main', collapsed ? 'main-collapsed' : ''].filter(Boolean).join(' ')}>

        {/* Top bar */}
        <header className="app-topbar">

          {/* Mobile: hamburger (hidden on desktop via CSS) */}
          <button
            className="topbar-mobile-only"
            onClick={() => setMobileOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--surface2)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', flexShrink: 0,
            }}
          >
            <MenuIcon />
          </button>

          {/* Mobile: logo text (hidden on desktop via CSS) */}
          <div className="topbar-mobile-only"
            style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <SunIcon size={20} />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontSize: 15,
              fontWeight: 700, color: 'var(--text)',
            }}>SolarQuote PH</span>
          </div>

          {/* Desktop: page title (hidden on mobile via CSS) */}
          <span className="topbar-desktop-only" style={{
            fontFamily: 'Syne, sans-serif', fontSize: 16,
            fontWeight: 700, color: 'var(--text)',
          }}>{pageTitle}</span>

          {/* Right actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* API key icon — desktop only */}
            <button
              className="topbar-desktop-only"
              onClick={() => setShowApiInput(p => !p)}
              title="OpenAI API Key"
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: showApiInput ? 'var(--amber-bg)' : 'var(--surface2)',
                color: showApiInput ? 'var(--amber)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><KeyIcon /></button>

            {/* Theme toggle — desktop only */}
            <button
              className="topbar-desktop-only"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--surface2)', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{theme === 'dark' ? <SunSmallIcon /> : <MoonIcon />}</button>

            {/* Avatar dropdown — all breakpoints */}
            <div ref={avatarMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAvatarMenu(p => !p)}
                aria-label={profile?.display_name || 'User menu'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, borderRadius: '50%', display: 'flex',
                }}
              >
                <Initials name={profile?.display_name} photo={profile?.photo_url} size={30} />
              </button>
              {showAvatarMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 8, minWidth: 180,
                  boxShadow: 'var(--shadow)', zIndex: 200,
                  animation: 'fadeSlideIn 0.15s ease-out',
                }}>
                  <div style={{
                    padding: '6px 10px 10px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                      {profile?.display_name || 'User'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {profile?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => { signOut(); setShowAvatarMenu(false) }}
                    style={{
                      width: '100%', padding: '8px 10px', marginTop: 4,
                      textAlign: 'left', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 14, color: 'var(--red)',
                      borderRadius: 6,
                    }}
                  >Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="app-content">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="bottom-tabbar">
          {tabItems.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, flex: 1, padding: '6px 0',
                color: isActive ? 'var(--amber)' : 'var(--text-muted)',
                textDecoration: 'none', fontSize: 10, fontWeight: 500,
              })}
            >
              <tab.Icon />
              {tab.label}
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, flex: 1, padding: '6px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 10, fontWeight: 500,
            }}
          >
            <MenuIcon />
            More
          </button>
        </nav>

      </div>
    </div>
  )
}
