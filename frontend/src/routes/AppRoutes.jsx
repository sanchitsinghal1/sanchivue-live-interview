import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/common/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Public layout + pages (no auth required)
import PublicLayout from '../components/layout/PublicLayout.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';

// Lazy-load heavy pages so the initial bundle stays small (faster first paint).
const LandingPage = lazy(() => import('../pages/public/LandingPage.jsx'));
const AboutPage = lazy(() => import('../pages/public/AboutPage.jsx'));
const FeaturesPage = lazy(() => import('../pages/public/FeaturesPage.jsx'));
const PricingPage = lazy(() => import('../pages/public/PricingPage.jsx'));
const ContactPage = lazy(() => import('../pages/public/ContactPage.jsx'));

const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'));

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage.jsx'));
const InterviewListPage = lazy(() => import('../pages/interviews/InterviewListPage.jsx'));
const InterviewCreateWizard = lazy(() => import('../pages/interviews/InterviewCreateWizard.jsx'));
const CandidateWaitingRoom = lazy(() => import('../pages/interviews/CandidateWaitingRoom.jsx'));
const LiveInterviewRoom = lazy(() => import('../pages/interviews/LiveInterviewRoom.jsx'));
const InterviewReportPage = lazy(() => import('../pages/interviews/InterviewReportPage.jsx'));
const QuestionBankPage = lazy(() => import('../pages/questions/QuestionBankPage.jsx'));
const QuestionEditorPage = lazy(() => import('../pages/questions/QuestionEditorPage.jsx'));
const TemplatesListPage = lazy(() => import('../pages/templates/TemplatesListPage.jsx'));
const TemplateEditorPage = lazy(() => import('../pages/templates/TemplateEditorPage.jsx'));
const CandidatesListPage = lazy(() => import('../pages/candidates/CandidatesListPage.jsx'));
const ReportsListPage = lazy(() => import('../pages/reports/ReportsListPage.jsx'));
const ReportDetailPage = lazy(() => import('../pages/reports/ReportDetailPage.jsx'));
const ProfilePage = lazy(() => import('../pages/settings/ProfilePage.jsx'));
const OrganizationSettingsPage = lazy(() =>
  import('../pages/settings/OrganizationSettingsPage.jsx'),
);
const NotificationSettingsPage = lazy(() =>
  import('../pages/settings/NotificationSettingsPage.jsx'),
);
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

// Tiny wrapper that redirects already-authenticated users away from auth pages.
// /login and /register wrap their page in <GuestRoute> so a signed-in user
// who lands on them (e.g. via the footer) is bounced straight to /dashboard.
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// `/interviews/:id` is a UX shortcut — sends the user straight into the live
// room. The room itself renders a "View report" pill when the session is
// already ended, so we don't need a separate detail page.
function InterviewIdToRoomRedirect() {
  const { id } = useParams();
  return <Navigate to={`/interviews/${id}/room`} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader label="Loading…" className="min-h-[40vh]" />}>
      <Routes>
        {/* Public marketing pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth pages — share AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Candidate waiting room — public, invitation-token validated */}
        <Route path="/join/:token" element={<CandidateWaitingRoom />} />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Interviewer/admin-only routes */}
          <Route
            path="/interviews/new"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <InterviewCreateWizard />
              </ProtectedRoute>
            }
          />
          <Route path="/interviews" element={<InterviewListPage />} />
          {/* /interviews/:id redirects to the live room — the room itself shows
              a "View report" pill if the session is already ended. */}
          <Route
            path="/interviews/:id"
            element={<InterviewIdToRoomRedirect />}
          />
          <Route path="/interviews/:id/room" element={<LiveInterviewRoom />} />
          <Route path="/interviews/:id/report" element={<InterviewReportPage />} />

          {/* Questions */}
          <Route path="/questions" element={<QuestionBankPage />} />
          <Route
            path="/questions/new"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <QuestionEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions/:id/edit"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <QuestionEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Templates — reusable question sets + rubric */}
          <Route
            path="/templates"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <TemplatesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/new"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/:id/edit"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Candidates (interviewer/admin only) */}
          <Route
            path="/candidates"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <CandidatesListPage />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />

          {/* Settings */}
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route
            path="/settings/organization"
            element={
              <ProtectedRoute roles={['interviewer', 'admin']}>
                <OrganizationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
