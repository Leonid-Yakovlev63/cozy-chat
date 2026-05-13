import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChatPage } from '@/pages/chat'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { RequireAuth } from '@/app/providers/RequireAuth'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<ChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
