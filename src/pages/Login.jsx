import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { User, ArrowRight, Plus } from 'lucide-react'

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
    const timer = setInterval(() => setTime(new Date()), 1000)
    try {
      const stored = localStorage.getItem('wl101_last_user')
      if (stored) {
        setLastUser(JSON.parse(stored))
        setIsOtherUser(false)
      }
    } catch (e) { console.error(e) }
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const targetUsername = isOtherUser ? username : lastUser?.username
    if (!targetUsername?.trim() || !password) return
    
    setSubmitting(true)
    const ok = await login(targetUsername.trim().toLowerCase(), password)
    setSubmitting(false)
    
    if (ok) {
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

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      background: '#151520', backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative', overflow: 'hidden', color: 'white'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '8vh' }}>
          <div style={{ fontSize: '5.5rem', fontWeight: 500, letterSpacing: '-2px', textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>{timeString}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, opacity: 0.9, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{dateString}</div>
        </div>

        <div style={{ textAlign: 'center', width: 320 }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.25)',
            overflow: 'hidden', backdropFilter: 'blur(30px)'
          }}>
            {(!isOtherUser && lastUser?.profile_image) ? (
              <img src={lastUser.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              <User size={72} color="rgba(255,255,255,0.5)" strokeWidth={1} />
            )}
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 32, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {isOtherUser ? 'Other User' : lastUser?.name}
          </h2>

          <form onSubmit={handleSubmit} style={{ width: 280, margin: '0 auto' }}>
            {isOtherUser && (
              <input
                type="text" placeholder="Username" autoFocus
                value={username} onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%', height: 44, borderRadius: 22, background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)', padding: '0 20px', color: 'white',
                  fontSize: 15, outline: 'none', textAlign: 'center', marginBottom: 16
                }}
              />
            )}

            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="password" placeholder="Enter Password" value={password}
                onChange={e => setPassword(e.target.value)} autoFocus={!isOtherUser}
                style={{
                  width: '100%', height: 44, borderRadius: 22, background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)', padding: '0 50px 0 20px',
                  color: 'white', fontSize: 15, outline: 'none', textAlign: 'center'
                }}
              />
              <button
                type="submit" disabled={submitting}
                style={{
                  position: 'absolute', right: 7, top: 7, width: 30, height: 30,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white'
                }}
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setIsOtherUser(!isOtherUser); setPassword('') }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', 
                padding: '10px 24px', borderRadius: 22, fontSize: 14, marginTop: 40,
                fontWeight: 600, color: 'white', cursor: 'pointer', backdropFilter: 'blur(20px)'
              }}
            >
              {isOtherUser ? 'Back' : 'Switch User'}
            </button>
          </form>
          {error && <div style={{ marginTop: 16, color: '#ffb3b3', fontSize: 13 }}>{error}</div>}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, right: 30 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <Plus size={24} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 11, opacity: 0.5 }}>
        Watoto Church © 2026
      </div>
    </div>
  )
}
