import '@/app/styles/index.scss'
import { SessionProvider } from '@/entities/session'
import { AppRouter } from '@/app/providers/AppRouter'

export function App() {
  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  )
}
