// src/icons/icons-bundle.js
import {
  Home, GraduationCap, Users, Layers, CalendarCheck,
  FileText, BarChart2, Target, Shield, Package,
  Wrench, Download, Settings, Bell, Search,
  CheckCircle, AlertTriangle, XCircle, Clipboard,
  User, Key, RefreshCw, LogOut, Activity,
  TrendingUp, TrendingDown, Flag, Tag, Inbox,
  ChevronRight, ChevronDown, Plus, Trash2, Edit2,
  Clock, MoreHorizontal, AlertCircle, Info, Filter
} from 'lucide-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Convert a Lucide component to an SVG string with consistent style
function toSVG(Component, size = 20, strokeWidth = 1.75) {
  return renderToStaticMarkup(
    createElement(Component, { size, strokeWidth, style: { display: 'block' } })
  )
}

// Expose as window.__ICONS__ for use in all addon scripts
window.__ICONS__ = {
  home:           toSVG(Home),
  students:       toSVG(GraduationCap),
  users:          toSVG(Users),
  groups:         toSVG(Layers),
  attendance:     toSVG(CalendarCheck),
  reports:        toSVG(FileText),
  analytics:      toSVG(BarChart2),
  checkpoints:    toSVG(Target),
  audit:          toSVG(Shield),
  batch:          toSVG(Package),
  techSupport:    toSVG(Wrench),
  exports:        toSVG(Download),
  settings:       toSVG(Settings),
  bell:           toSVG(Bell),
  search:         toSVG(Search),
  checkCircle:    toSVG(CheckCircle),
  warning:        toSVG(AlertTriangle),
  error:          toSVG(XCircle),
  clipboard:      toSVG(Clipboard),
  user:           toSVG(User),
  key:            toSVG(Key),
  refresh:        toSVG(RefreshCw),
  logout:         toSVG(LogOut),
  activity:       toSVG(Activity),
  trendUp:        toSVG(TrendingUp),
  trendDown:      toSVG(TrendingDown),
  flag:           toSVG(Flag),
  tag:            toSVG(Tag),
  inbox:          toSVG(Inbox),
  chevronRight:   toSVG(ChevronRight),
  chevronDown:    toSVG(ChevronDown),
  plus:           toSVG(Plus),
  trash:          toSVG(Trash2),
  edit:           toSVG(Edit2),
  clock:          toSVG(Clock),
  more:           toSVG(MoreHorizontal),
  info:           toSVG(Info),
  filter:         toSVG(Filter),
}
