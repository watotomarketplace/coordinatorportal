import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceDashboard, { DashboardWidget } from './AttendanceDashboard.jsx';
import GroupAttendance from './GroupAttendance.jsx';

// We bind to window so the minified app can use it
window.__ATTENDANCE_ADDON__ = {
    AttendanceDashboard,
    GroupAttendance,
    DashboardWidget,
};
