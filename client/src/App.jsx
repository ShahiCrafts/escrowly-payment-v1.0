import { useEffect } from 'react';
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

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthSuccess from './pages/auth/AuthSuccess';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import MFAVerify from './pages/auth/MFAVerify';

import Dashboard from './pages/dashboard/Dashboard';
import CreateTransaction from './pages/dashboard/CreateTransaction';
import TransactionDetail from './pages/dashboard/TransactionDetail';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';
import HelpPage from './pages/dashboard/HelpPage';
import MyEscrows from './pages/dashboard/MyEscrows';
import KYCSubmission from './pages/dashboard/KYCSubmission';

import AdminDashboard from './pages/admin/AdminDashboard';
import Appeals from './pages/admin/Appeals';
import AdminNotifications from './pages/admin/AdminNotifications';

import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';
import Suspended from './pages/errors/Suspended';
import MaintenancePage from './pages/MaintenancePage';
import { fetchCsrfToken } from './services/api';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

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
