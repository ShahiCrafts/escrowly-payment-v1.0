import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Setup2FAModal from './components/auth/Setup2FAModal';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import { fetchCsrfToken } from './services/api';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// Public pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const AuthSuccess = lazy(() => import('./pages/auth/AuthSuccess'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const MFAVerify = lazy(() => import('./pages/auth/MFAVerify'));

// Dashboard pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const CreateTransaction = lazy(() => import('./pages/dashboard/CreateTransaction'));
const TransactionDetail = lazy(() => import('./pages/dashboard/TransactionDetail'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const HelpPage = lazy(() => import('./pages/dashboard/HelpPage'));
const MyEscrows = lazy(() => import('./pages/dashboard/MyEscrows'));
const KYCSubmission = lazy(() => import('./pages/dashboard/KYCSubmission'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Appeals = lazy(() => import('./pages/admin/Appeals'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

// Error pages
const NotFound = lazy(() => import('./pages/errors/NotFound'));
const Unauthorized = lazy(() => import('./pages/errors/Unauthorized'));
const Suspended = lazy(() => import('./pages/errors/Suspended'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));

const AppContent = () => {
  useEffect(() => {
    const initAuth = async () => {
      await fetchCsrfToken();
    };
    initAuth();
  }, []);

  const { loading, setShow2FASetupModal } = useAuth();

  useEffect(() => {
    const handleRequire2FA = () => {
      setShow2FASetupModal(true);
    };

    window.addEventListener('require-2fa', handleRequire2FA);
    return () => window.removeEventListener('require-2fa', handleRequire2FA);
  }, [setShow2FASetupModal]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <Router>
        <ToastContainer
          position="bottom-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Setup2FAModal />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Main layout with navbar - only for home */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            {/* Auth pages - NO navbar */}
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/suspended" element={<Suspended />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/mfa-verify" element={<MFAVerify />} />

            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/transactions" element={<MyEscrows />} />

                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="/dashboard/notifications" element={<Notifications />} />
                <Route path="/dashboard/create" element={<CreateTransaction />} />
                <Route path="/dashboard/transaction/:id" element={<TransactionDetail />} />
                <Route path="/dashboard/help" element={<HelpPage />} />
                <Route path="/dashboard/kyc" element={<KYCSubmission />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/appeals" element={<Appeals />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/transactions" element={<AdminDashboard />} />
                <Route path="/admin/disputes" element={<AdminDashboard />} />
                <Route path="/admin/kyc" element={<AdminDashboard />} />
                <Route path="/admin/audit-logs" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminDashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </GoogleReCaptchaProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
