# Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sticky top header with a fixed left sidebar + thin top bar layout, including a mobile bottom tab bar and slide-in drawer, without changing any page logic, routing, or Supabase queries.

**Architecture:** New `AppLayout` component wraps all four authenticated pages. The sidebar owns theme, API key, collapse, and mobile-open state (migrated from `Header.jsx`). Each page loses only its `<Header />` import and tag — nothing else changes.

**Tech Stack:** React 18, React Router v6 `NavLink` + `useLocation`, inline styles, CSS classes in `index.css`. No new dependencies.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/index.css` | Modify | Add sidebar layout CSS block at bottom (structure, transitions, responsive) |
| `src/components/AppLayout.jsx` | Create | Sidebar, top bar, mobile drawer, bottom tab bar — all navigation |
| `src/App.jsx` | Modify | Import AppLayout, wrap 4 protected routes |
| `src/pages/Dashboard.jsx` | Modify | Remove `import Header` + `<Header />` |
| `src/pages/AdminUsers.jsx` | Modify | Remove `import Header` + `<Header />` |
| `src/pages/CostControl.jsx` | Modify | Remove `import Header` + `<Header />` |
| `src/pages/QuoteHistory.jsx` | Modify | Remove `import Header` + `<Header />` |
| `src/components/Header.jsx` | Delete | Replaced entirely by AppLayout |

---

## Task 1: Add sidebar layout CSS to index.css

**Files:**
- Modify: `src/index.css` (append at the end)

No test runner is configured. Manual check: run `npm run dev` after each task and verify the app still renders. For this task — adding CSS to a currently-unused class won't change anything visible yet; just confirm the dev server compiles without errors.

- [ ] **Step 1: Append the layout CSS block**

Open `src/index.css` and append the following block at the very end:

```css
/* ── Sidebar Layout ───────────────────────────────────────────────────── */

.app-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 220px;
  background: #0a1628;
  border-right: 1px solid rgba(255,255,255,0.06);
  z-index: 40;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}
.app-sidebar.sidebar-collapsed { width: 60px; }

.app-main {
  margin-left: 220px;
  transition: margin-left 0.2s ease;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.app-main.main-collapsed { margin-left: 60px; }

.app-topbar {
  height: 48px;
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top);
}

.app-content { flex: 1; }

.bottom-tabbar { display: none; }

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 39;
  animation: fadeIn 0.2s ease;
}

/* Responsive visibility helpers */
.topbar-desktop-only { display: flex; }
.topbar-mobile-only  { display: none; }
.sidebar-collapse-toggle { display: block; }

@media (max-width: 767px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    width: 280px !important;
    z-index: 50;
  }
  .app-sidebar.sidebar-mobile-open { transform: translateX(0); }

  .app-main {
    margin-left: 0 !important;
    padding-bottom: 56px;
  }

  .bottom-tabbar {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 56px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    align-items: center;
    justify-content: space-around;
    z-index: 30;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .sidebar-collapse-toggle { display: none; }
  .topbar-desktop-only { display: none !important; }
  .topbar-mobile-only  { display: flex !important; }
}
```

- [ ] **Step 2: Verify dev server compiles**

```bash
npm run dev
```

Expected: server starts with no errors. Visit `http://localhost:5173` — the app looks exactly the same as before (the CSS classes are not used yet).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add sidebar layout CSS block to index.css"
```

---

## Task 2: Create AppLayout.jsx

**Files:**
- Create: `src/components/AppLayout.jsx`

This is the largest task. Write the complete file in one step.

- [ ] **Step 1: Create the file**

Create `src/components/AppLayout.jsx` with the following complete content:

```jsx
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
    () => localStorage.getItem('solar_sidebar_collapsed') === 'true'
  )
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [showSidebarApi, setShowSidebarApi] = useState(false)
  const [showTopbarApi, setShowTopbarApi]   = useState(false)
  const [apiKey, setApiKey]             = useState(() => localStorage.getItem('solar_openai_key') || '')
  const [showKey, setShowKey]           = useState(false)
  const [theme, setTheme]               = useState(() => localStorage.getItem('solar_theme') || 'dark')
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
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
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
        {showSidebarApi && (
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
              setShowSidebarApi(p => !p)
            }}
            active={showSidebarApi}
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
              alignItems: 'center', justifyContent: 'center',
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
              onClick={() => setShowTopbarApi(p => !p)}
              title="OpenAI API Key"
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: showTopbarApi ? 'var(--amber-bg)' : 'var(--surface2)',
                color: showTopbarApi ? 'var(--amber)' : 'var(--text-muted)',
                alignItems: 'center', justifyContent: 'center',
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
                alignItems: 'center', justifyContent: 'center',
              }}
            >{theme === 'dark' ? <SunSmallIcon /> : <MoonIcon />}</button>

            {/* Avatar dropdown — all breakpoints */}
            <div ref={avatarMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAvatarMenu(p => !p)}
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

        {/* Top bar API key panel (desktop, drops below topbar) */}
        {showTopbarApi && (
          <div className="topbar-desktop-only" style={{
            borderBottom: '1px solid var(--border)',
            padding: '10px 20px',
            background: 'var(--surface)',
            animation: 'fadeSlideIn 0.15s ease-out',
            alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => handleApiKeyChange(e.target.value)}
                placeholder="sk-..."
                autoFocus
                style={{
                  width: '100%', padding: '9px 44px 9px 12px',
                  background: 'var(--surface2)', borderRadius: 8,
                  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
                  border: `1px solid ${
                    apiKey && !apiKey.startsWith('sk-') ? 'var(--red)'
                    : apiKey.startsWith('sk-') ? 'var(--green)'
                    : 'var(--border)'
                  }`,
                }}
              />
              <button onClick={() => setShowKey(p => !p)} style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 11,
              }}>{showKey ? 'Hide' : 'Show'}</button>
            </div>
            {apiKey.startsWith('sk-') && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--green)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <button onClick={() => setShowTopbarApi(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

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
```

- [ ] **Step 2: Verify the file was created and the dev server compiles**

```bash
npm run dev
```

Expected: server starts with no errors. Visit `http://localhost:5173` — the app still looks the same (AppLayout is not wired in yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/AppLayout.jsx
git commit -m "feat: create AppLayout sidebar component"
```

---

## Task 3: Wire AppLayout into App.jsx and remove Header from all pages

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/pages/AdminUsers.jsx`
- Modify: `src/pages/CostControl.jsx`
- Modify: `src/pages/QuoteHistory.jsx`

- [ ] **Step 1: Update App.jsx**

Replace the contents of `src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Blocked from './pages/Blocked'
import Dashboard from './pages/Dashboard'
import CostControl from './pages/CostControl'
import AdminUsers from './pages/AdminUsers'
import QuoteHistory from './pages/QuoteHistory'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public / auth-only routes — no sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/blocked" element={<Blocked />} />

          {/* Authenticated routes — wrapped in AppLayout */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['master_admin','estimator','sales_agent']}>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cost-control" element={
            <ProtectedRoute allowedRoles={['master_admin','estimator']}>
              <AppLayout><CostControl /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['master_admin']}>
              <AppLayout><AdminUsers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/quotes" element={
            <ProtectedRoute allowedRoles={['master_admin','estimator','sales_agent']}>
              <AppLayout><QuoteHistory /></AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Remove Header from Dashboard.jsx**

In `src/pages/Dashboard.jsx`:
- Delete line: `import Header from '../components/Header'`
- Delete line: `<Header />` (appears around line 393)

- [ ] **Step 3: Remove Header from AdminUsers.jsx**

In `src/pages/AdminUsers.jsx`:
- Delete line: `import Header from '../components/Header'`
- Delete line: `<Header />` (appears around line 177)

- [ ] **Step 4: Remove Header from CostControl.jsx**

In `src/pages/CostControl.jsx`:
- Delete line: `import Header from '../components/Header'`
- Delete line: `<Header />` (appears around line 92)

- [ ] **Step 5: Remove Header from QuoteHistory.jsx**

In `src/pages/QuoteHistory.jsx`:
- Delete line: `import Header from '../components/Header'`
- Delete line: `<Header />` (appears around line 77)

- [ ] **Step 6: Verify — navigate the app**

```bash
npm run dev
```

Visit `http://localhost:5173` while logged in. Verify:
- Sidebar appears on the left at 220px
- Dashboard, My Quotes, Cost Control (and Users if master_admin) appear in the nav
- Inventory and Analytics show with "Soon" badge, grayed out
- Clicking a nav item navigates correctly
- Active item has amber left border + amber text
- Page title appears in the top bar

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/pages/Dashboard.jsx src/pages/AdminUsers.jsx src/pages/CostControl.jsx src/pages/QuoteHistory.jsx
git commit -m "feat: wire AppLayout into App.jsx, remove Header from pages"
```

---

## Task 4: Delete Header.jsx, verify all behaviors, final commit

**Files:**
- Delete: `src/components/Header.jsx`

- [ ] **Step 1: Delete Header.jsx**

```bash
rm src/components/Header.jsx
```

- [ ] **Step 2: Confirm no remaining imports**

```bash
grep -r "Header" src/ --include="*.jsx" --include="*.tsx"
```

Expected output: no matches (or only comments/unrelated strings).

- [ ] **Step 3: Full behavior check**

Run `npm run dev` and verify all of the following:

**Desktop expanded:**
- [ ] Sidebar is 220px, dark background (#0a1628)
- [ ] Logo + app name at top, role badge below
- [ ] Nav items with icons and labels, active item has amber left border + amber bg tint
- [ ] Inventory and Analytics are grayed out with "Soon" pill
- [ ] Bottom section: API Key button → opens inline input above it; Theme toggle switches light/dark
- [ ] Profile: avatar, name, email
- [ ] Sign out button works
- [ ] Collapse toggle: sidebar shrinks to 60px with icons only; labels hidden; state persists on refresh

**Desktop collapsed:**
- [ ] Icons only, active item shows amber icon
- [ ] `title` attribute on items shows item name on hover
- [ ] Clicking API Key button expands sidebar first, then shows input

**Mobile (resize browser to < 768px):**
- [ ] Sidebar is hidden; bottom tab bar is visible
- [ ] Tab bar shows correct items for the user's role
- [ ] Active tab is amber
- [ ] Top bar shows hamburger + logo + avatar
- [ ] Hamburger → sidebar drawer slides in from left with dark overlay
- [ ] Tapping overlay closes drawer
- [ ] Tapping a nav item navigates and closes drawer

**Theme:**
- [ ] Dark/light theme toggle in sidebar and top bar both work
- [ ] Theme persists on page refresh

**API Key:**
- [ ] Sidebar API key input saves to `localStorage` key `solar_openai_key`
- [ ] Top bar API key panel (desktop) also saves to the same key
- [ ] Both reflect the same stored value

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete sidebar navigation — remove old Header.jsx"
```

---

## Self-Review Notes

| Spec requirement | Covered in task |
|---|---|
| 220px desktop sidebar, collapsible to 60px | Task 1 (CSS), Task 2 (AppLayout state + CSS classes) |
| Dark sidebar #0a1628 always | Task 1 (CSS hardcoded), Task 2 (inline background) |
| Logo + role badge | Task 2 (logo section) |
| Nav items with icons + roles | Task 2 (NAV_ITEMS constant + render) |
| Inventory/Analytics disabled with "Soon" | Task 2 (disabled items render path) |
| Active: amber border + text + bg | Task 2 (navItemStyle function) |
| Collapsed: icons only + tooltip | Task 2 (collapsed checks + title attr) |
| Collapse toggle, persisted | Task 2 (toggleCollapsed + localStorage) |
| API Key in sidebar bottom | Task 2 (SidebarActionBtn + showSidebarApi) |
| Theme toggle in sidebar + top bar | Task 2 (toggleTheme, both locations) |
| Profile: avatar + name + email | Task 2 (profile section) |
| Sign out | Task 2 (signOut button) |
| Top bar 48px sticky | Task 1 (CSS .app-topbar) |
| Desktop top bar: page title + icons | Task 2 (topbar-desktop-only elements) |
| Mobile top bar: hamburger + logo + avatar | Task 2 (topbar-mobile-only elements) |
| Mobile: bottom tab bar | Task 1 (CSS) + Task 2 (nav.bottom-tabbar) |
| Mobile: slide-in drawer + overlay | Task 1 (CSS) + Task 2 (mobileOpen state) |
| Login/Pending/Blocked not wrapped | Task 3 (App.jsx — only authenticated routes get AppLayout) |
| No page logic changes | Tasks 3–4 (only import + tag removal) |
