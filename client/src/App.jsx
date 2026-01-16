import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';

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
import Profile from './pages/dashboard/Profile';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';

import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';
import { fetchCsrfToken } from './services/api';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const App = () => {
  useEffect(() => {
    const initAuth = async () => {
      await fetchCsrfToken();
    };
    initAuth();
  }, []);

  return (
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
            {/* Main layout with navbar - only for home */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            {/* Auth pages - NO navbar */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/mfa-verify" element={<MFAVerify />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/transactions" element={<Dashboard />} />
                <Route path="/dashboard/profile" element={<Profile />} />
                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="/dashboard/notifications" element={<Notifications />} />
                <Route path="/dashboard/create" element={<CreateTransaction />} />
                <Route path="/dashboard/transaction/:id" element={<TransactionDetail />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/transactions" element={<AdminDashboard />} />
                <Route path="/admin/disputes" element={<AdminDashboard />} />
                <Route path="/admin/audit-logs" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminDashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleReCaptchaProvider>
  );
};

export default App;
