import '@/app/styles/index.scss'
import { ThemeProvider } from '@/entities/theme'
import { SessionProvider } from '@/entities/session'
import { AppRouter } from '@/app/providers/AppRouter'

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </ThemeProvider>
  )
}
