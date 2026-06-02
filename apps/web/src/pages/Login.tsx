import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../net/api'

export default function LoginPage() {
  const navigate  = useNavigate()
  const [isLogin,  setIsLogin]  = useState(true)
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isLogin) {
        await api.login(email, password)
      } else {
        await api.register(username, email, password)
      }
      navigate('/lobby')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f1a',
    }}>
      <div style={{
        background: '#16213e',
        border: '1px solid #2a2a4a',
        borderRadius: 12,
        padding: 32,
        width: 360,
      }}>
        <h1 style={{ margin: '0 0 4px', color: '#7b5ea7', fontSize: 22 }}>⚔ Mage Knight</h1>
        <h2 style={{ margin: '0 0 24px', fontWeight: 'normal', fontSize: 16, color: '#888' }}>
          {isLogin ? 'Sign in to continue' : 'Create your account'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize: 12, color: '#aaa' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="YourHeroName"
                required={!isLogin}
                minLength={3}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: '#aaa' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="hero@example.com"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#aaa' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="········"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div style={{
              background: '#3a1a1a',
              border: '1px solid #ef4444',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#ef4444',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Please wait…' : isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(null) }}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'transparent',
            color: '#7b5ea7',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            padding: 8,
          }}
        >
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
