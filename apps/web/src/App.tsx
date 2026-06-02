/**
 * App.tsx — top-level router.
 *
 * React Router maps URL paths to page components.
 * <Route path="/login" element={<LoginPage />} /> means:
 *   "when the URL is /login, render the LoginPage component"
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage    from './pages/Login'
import LobbyPage    from './pages/Lobby'
import GamePage     from './pages/Game'
import ProfilePage  from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<Navigate to="/login" replace />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/lobby"          element={<LobbyPage />} />
      <Route path="/game/:sessionId" element={<GamePage />} />
      <Route path="/profile"        element={<ProfilePage />} />
    </Routes>
  )
}
