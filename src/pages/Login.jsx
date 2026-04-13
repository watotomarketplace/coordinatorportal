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
        <div style={{ textAlign: 'center', width: 320 }}>
          <div style={{
            width: 128, height: 128, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            position: 'relative',
            backdropFilter: 'blur(20px)'
          }}>
            {(!isOtherUser && lastUser?.profile_image) ? (
              <img src={lastUser.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User Avatar" />
            ) : (
              <div style={{ 
                width: '100%', height: '100%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
              }}>
                <User size={64} color="rgba(255,255,255,0.4)" strokeWidth={1} />
              </div>
            )}
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 32, letterSpacing: '-0.5px' }}>
            {isOtherUser ? 'Other User' : (lastUser?.name || 'User')}
          </h2>

          <form onSubmit={handleSubmit} style={{ width: 280, margin: '0 auto' }}>
            {isOtherUser && (
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Username"
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{
                    width: '100%', height: 40, borderRadius: 20,
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0 20px', color: 'white', fontSize: 14, outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus={!isOtherUser}
                style={{
                  width: '100%', height: 40, borderRadius: 20,
                  background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0 48px 0 20px', color: 'white', fontSize: 14, outline: 'none',
                  textAlign: 'center'
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  position: 'absolute', right: 5, top: 5, width: 30, height: 30,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white', transition: 'all 0.2s',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 40, fontWeight: 400 }}>
              Enter Password
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOtherUser(!isOtherUser)
                setPassword('')
              }}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', 
                padding: '10px 24px', borderRadius: 20, fontSize: 13, 
                fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
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


