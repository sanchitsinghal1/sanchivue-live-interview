import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrganizationProvider } from './context/OrganizationContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { InterviewRoomProvider } from './context/InterviewRoomContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      {/* Top-level providers. Order matters: Auth must wrap everything that
          uses `useAuth` (Organization, Notification, InterviewRoom contexts). */}
      <AuthProvider>
        <OrganizationProvider>
          <NotificationProvider>
            <InterviewRoomProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid #1e293b',
                    fontSize: '13px',
                  },
                  success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
                  error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } },
                }}
              />
            </InterviewRoomProvider>
          </NotificationProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
