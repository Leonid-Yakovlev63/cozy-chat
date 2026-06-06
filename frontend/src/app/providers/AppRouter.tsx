import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/pages/admin'
import { AdminNewsPage } from '@/pages/admin/news'
import { AdminUsersPage } from '@/pages/admin/users'
import { ChatPage } from '@/pages/chat'
import { LoginPage } from '@/pages/login'
import { NewsPage } from '@/pages/news'
import { ProfilePage } from '@/pages/profile'
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
          <Route path="/news" element={<NewsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="news" element={<AdminNewsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
