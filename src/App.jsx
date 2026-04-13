import React, { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'
import DesktopLayout from './layouts/DesktopLayout'
import MobileLayout from './layouts/MobileLayout'
import Login from './pages/Login'

// Lazy-load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MobileDashboard = lazy(() => import('./pages/mobile/MobileDashboard'))
const Students = lazy(() => import('./pages/Students'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const FormationGroups = lazy(() => import('./pages/FormationGroups'))
const GroupDetail = lazy(() => import('./pages/GroupDetail'))
const Attendance = lazy(() => import('./pages/Attendance'))
const WeeklyReports = lazy(() => import('./pages/WeeklyReports'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Exports = lazy(() => import('./pages/Exports'))
const TechSupport = lazy(() => import('./pages/TechSupport'))
const Settings = lazy(() => import('./pages/Settings'))
const Checkpoints = lazy(() => import('./pages/Checkpoints'))
const Analytics = lazy(() => import('./pages/Analytics'))

const ThinkificAdmin = lazy(() => import('./pages/admin/ThinkificAdmin'))
const NotionAdmin = lazy(() => import('./pages/admin/NotionAdmin'))
const Diagnostics = lazy(() => import('./pages/admin/Diagnostics'))

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="spinner" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)

  if (loading) return <LoadingFallback />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const checkSession = useAuthStore(s => s.checkSession)
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  const platform = useAppStore(s => s.platform)
  const setPlatform = useAppStore(s => s.setPlatform)
  const theme = useAppStore(s => s.theme)
  const location = useLocation()

  const loadWallpaper = useAppStore(s => s.loadWallpaper)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Load wallpaper when authenticated
  useEffect(() => {
    if (user) {
      loadWallpaper()
    }
  }, [user, loadWallpaper])

  // Set theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Platform detection + resize listener
  useEffect(() => {
    function handleResize() {
      const newPlatform = window.innerWidth <= 768 ? 'mobile' : 'desktop'
      setPlatform(newPlatform)
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    // Set body class
    document.body.classList.remove('desktop', 'mobile')
    document.body.classList.add(platform)

    return () => window.removeEventListener('resize', handleResize)
  }, [platform, setPlatform])

  // Show login page without layout
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    )
  }

  if (loading) return <LoadingFallback />

  const Layout = platform === 'mobile' ? MobileLayout : DesktopLayout

  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={platform === 'mobile' ? <MobileDashboard /> : <Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<Students />} />
            <Route path="/admin" element={<UserManagement />} />
            <Route path="/admin/thinkific" element={<ThinkificAdmin />} />
            <Route path="/admin/notion" element={<NotionAdmin />} />
            <Route path="/admin/diagnostics" element={<Diagnostics />} />
            <Route path="/groups" element={<FormationGroups />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/weekly-reports" element={<WeeklyReports />} />
            <Route path="/reports" element={<Analytics />} />
            <Route path="/checkpoints" element={<Checkpoints />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/exports" element={<Exports />} />
            <Route path="/tech-support" element={<TechSupport />} />
            <Route path="/import" element={<Exports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </ProtectedRoute>
  )
}
