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
