import React, { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import AttendanceDashboard from '../components/AttendanceDashboard'

export default function Attendance() {
  const setPageTitle = useAppStore(s => s.setPageTitle)
  useEffect(() => { setPageTitle('Attendance') }, [setPageTitle])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <AttendanceDashboard />
    </div>
  )
}
