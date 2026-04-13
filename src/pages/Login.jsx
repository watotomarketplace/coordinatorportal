import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Target, User, ArrowRight, Plus } from 'lucide-react'

export default function Login() {
  const [lastUser, setLastUser] = useState(null)
  const [isOtherUser, setIsOtherUser] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [time, setTime] = useState(new Date())

  const login = useAuthStore(s => s.login)
  const error = useAuthStore(s => s.error)
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Clock
    const timer = setInterval(() => setTime(new Date()), 1000)

    // 2. Load last user
    try {
      const stored = localStorage.getItem('wl101_last_user')
      if (stored) {
        const u = JSON.parse(stored)
        setLastUser(u)
        setIsOtherUser(false)
      } else {
        setIsOtherUser(true)
      }
    } catch (e) {
      console.error('Failed to load last user:', e)
      setIsOtherUser(true)
    }

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    // Target user
    const targetUsername = isOtherUser ? username : lastUser?.username
    if (!targetUsername?.trim() || !password) return
    
    setSubmitting(true)
    const ok = await login(targetUsername.trim().toLowerCase(), password)
    setSubmitting(false)
    
    if (ok) {
      // 3. Persist this user for next time
      const user = useAuthStore.getState().user
      if (user) {
        localStorage.setItem('wl101_last_user', JSON.stringify({
          name: user.name,
          username: user.username,
          profile_image: user.profile_image
        }))
      }
      navigate('/dashboard', { replace: true })
    }
  }

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateString = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  const glassPill = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: '8px 12px',
    color: 'white',
    fontSize: 13,
    transition: 'all 0.2s',
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      background: '#151520',
      backgroundImage: 'url(/bg.jpeg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative', overflow: 'hidden',
      color: 'white'
    }}>
      {/* Top Section removed as requested */}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
        
        {/* Clock Section */}
        <div style={{ textAlign: 'center', marginBottom: '8vh' }}>
          <div style={{ fontSize: '5rem', fontWeight: 500, letterSpacing: '-1px' }}>{timeString}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 500, opacity: 0.9 }}>{dateString}</div>
        </div>

        {/* User Card */}
        <div style={{ textAlign: 'center', width: 300 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.4)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {(!isOtherUser && lastUser?.profile_image) ? (
              <img src={lastUser.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User Avatar" />
            ) : (
              <div style={{ 
                width: '100%', height: '100%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.1)'
              }}>
                {isOtherUser ? (
                  <User size={60} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
                ) : (
                  <Target size={60} color="white" strokeWidth={1.5} />
                )}
              </div>
            )}
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, letterSpacing: '-0.2px' }}>
            {isOtherUser ? 'Other User' : (lastUser?.name || 'User')}
          </h3>

          <form onSubmit={handleSubmit} style={{ width: 280, margin: '0 auto' }}>
            {isOtherUser && (
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{
                    width: '100%', height: 38, borderRadius: 19,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0 16px', color: 'white', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%', height: 38, borderRadius: 19,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0 48px 0 16px', color: 'white', fontSize: 14, outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  position: 'absolute', right: 4, top: 4, width: 30, height: 30,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white', transition: 'all 0.2s'
                }}
              >
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 32, fontWeight: 400 }}>Enter Password</div>

            <button
              type="button"
              onClick={() => {
                setIsOtherUser(!isOtherUser)
                setPassword('')
              }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', 
                padding: '8px 20px', borderRadius: 18, fontSize: 13, 
                fontWeight: 500, color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isOtherUser ? 'Back' : 'Switch User'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 12, color: '#ffb3b3', fontSize: 12 }}>{error}</div>
          )}
        </div>
      </div>

      {/* Bottom Right Floating Button */}
      <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <Plus size={20} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 20, width: '100%', textAlign: 'center',
        fontSize: 10, opacity: 0.4, letterSpacing: '0.5px'
      }}>
        Watoto Church © 2026
      </div>
    </div>
  )
}


