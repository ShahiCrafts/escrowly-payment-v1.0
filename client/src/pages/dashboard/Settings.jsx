import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Modal, AvatarUpload, Input, ImageAvatar } from '../../components/common';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';
import api from '../../services/api';
import { uploadAvatar, removeAvatar } from '../../services/user.service';
import { toast } from 'react-toastify';
import { cn } from '../../utils/cn';

const profileSchema = z.object({
    firstName: z.string().min(2, 'First name is too short'),
    lastName: z.string().min(2, 'Last name is too short'),
    phoneNumber: z.string().optional()
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

const Settings = () => {
    const {
        user,
        updateUser,
        changePassword,
        setupMFA,
        enableMFA,
        disableMFA,
        getBackupCodes,
        resendVerification,
        refreshUser,
        logoutAll,
        deleteAccount
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    // Initial tab from query param if exists
    const getInitialTab = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const validTabs = ['profile', 'security', 'notifications', 'payments', 'preferences'];
        return validTabs.includes(tab) ? tab : 'profile';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Sync tab with URL query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(`/dashboard/settings?tab=${tabId}`, { replace: true });
    };

    // MFA State
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [disableMfaPassword, setDisableMfaPassword] = useState('');
    const [showDisableMfa, setShowDisableMfa] = useState(false);
    const [showViewBackupCodesModal, setShowViewBackupCodesModal] = useState(false);
    const [viewBackupCodesPassword, setViewBackupCodesPassword] = useState('');
    const [loadingBackupCodes, setLoadingBackupCodes] = useState(false);

    // UI State
    const [stripeStatus, setStripeStatus] = useState(null);
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);
    const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState({
        emailTransactions: user?.notificationPreferences?.emailTransactions ?? true,
        emailSecurity: user?.notificationPreferences?.emailSecurity ?? true,
        inAppNotifications: user?.notificationPreferences?.inAppNotifications ?? true,
        pushTransactions: user?.notificationPreferences?.pushTransactions ?? true,
        pushMessages: user?.notificationPreferences?.pushMessages ?? true
    });

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.profile?.firstName || '',
            lastName: user?.profile?.lastName || '',
            phoneNumber: user?.profile?.phoneNumber || ''
        }
    });

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        reset: resetPasswordForm,
        watch: watchPassword,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
    } = useForm({
        resolver: zodResolver(passwordSchema)
    });

    const newPassword = watchPassword('newPassword');

    useEffect(() => {
        const checkStripe = async () => {
            try {
                const response = await api.get('/payments/onboarding/status');
                setStripeStatus(response.data);
            } catch (error) {
                console.error('Failed to check Stripe status');
            }
        };

        checkStripe();

        const params = new URLSearchParams(window.location.search);
        const stripeParam = params.get('stripe');
        if (stripeParam === 'return') {
            toast.success('Stripe account connected successfully');
            checkStripe();
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (stripeParam === 'refresh') {
            toast.error('Stripe connection was not completed. Please try again.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleAvatarUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            await uploadAvatar(formData);
            await refreshUser();
            toast.success('Profile picture updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload profile picture');
        }
    };

    const handleAvatarRemove = async () => {
        try {
            await removeAvatar();
            await refreshUser();
            toast.success('Profile picture removed');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove profile picture');
        }
    };

    const onProfileSubmit = async (data) => {
        try {
            const response = await api.put('/users/profile', data);
            updateUser(response.data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const onPasswordSubmit = async (data) => {
        try {
            await changePassword(data.currentPassword, data.newPassword);
            resetPasswordForm();
            toast.success('Password changed successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    const handleSetupMFA = async () => {
        try {
            const data = await setupMFA();
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setShowMfaModal(true);
        } catch (error) {
            toast.error('Failed to setup MFA');
        }
    };

    const handleEnableMFA = async () => {
        try {
            const data = await enableMFA(mfaToken);
            setBackupCodes(data.backupCodes);
            setShowMfaModal(false);
            setShowBackupCodes(true);
            toast.success('MFA enabled successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        }
    };

    const handleDisableMFA = async () => {
        try {
            await disableMFA(disableMfaPassword);
            setShowDisableMfa(false);
            setDisableMfaPassword('');
            toast.success('MFA disabled successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable MFA');
        }
    };

    const handleViewBackupCodes = async () => {
        if (!viewBackupCodesPassword) {
            toast.error('Please enter your password');
            return;
        }
        setLoadingBackupCodes(true);
        try {
            const data = await getBackupCodes(viewBackupCodesPassword);
            setBackupCodes(data.backupCodes);
            setShowViewBackupCodesModal(false);
            setViewBackupCodesPassword('');
            setShowBackupCodes(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to retrieve backup codes');
        } finally {
            setLoadingBackupCodes(false);
        }
    };

    const handleConnectStripe = async () => {
        setLoadingStripe(true);
        try {
            const response = await api.post('/payments/onboarding');
            window.location.href = response.data.url;
        } catch (error) {
            toast.error('Failed to initiate Stripe connection');
            setLoadingStripe(false);
        }
    };

    const handleResendVerification = async () => {
        setSendingVerification(true);
        try {
            await resendVerification();
            toast.success('Verification email sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send verification email');
        } finally {
            setSendingVerification(false);
        }
    };

    const handleNotificationChange = async (key) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        try {
            await api.put('/users/profile', { notificationPreferences: { [key]: newValue } });
            await refreshUser();
            toast.success('Preference updated');
        } catch (error) {
            toast.error('Failed to update preference');
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    const handleLogoutAll = async () => {
        try {
            await logoutAll();
            toast.success('Logged out from all devices');
            setShowLogoutAllModal(false);
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccount();
            toast.success('Account deleted successfully');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        { id: 'payments', label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        { id: 'preferences', label: 'Preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
    ];

    const NotificationToggle = ({ label, description, checked, onChange }) => (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
            <div>
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    checked ? "bg-blue-600" : "bg-slate-200"
                )}
            >
                <span className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                    checked ? "translate-x-5" : "translate-x-0"
                )} />
            </button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 mt-1.5 text-[15px]">Manage your profile information and account security</p>
            </div>

            {!user?.isEmailVerified && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1 pt-1">
                        <h3 className="font-semibold text-amber-900">Email not verified</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Please verify your email to access all features including escrow transactions.
                        </p>
                        <Button
                            onClick={handleResendVerification}
                            isLoading={sendingVerification}
                            variant="secondary"
                            size="sm"
                            className="mt-3 bg-white border-amber-200 hover:bg-amber-50 text-amber-700 h-9"
                        >
                            Resend Verification Email
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar persona area */}
                <div className="lg:w-64 flex-shrink-0 space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <ImageAvatar
                            imageUrl={user?.profile?.avatar?.url}
                            firstName={user?.profile?.firstName}
                            lastName={user?.profile?.lastName}
                            size="lg"
                        />
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">
                                {user?.profile?.firstName} {user?.profile?.lastName}
                            </h3>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                                    activeTab === tab.id
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main content area */}
                <div className="flex-1 space-y-6">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="border-b border-slate-100 pb-8">
                                        <label className="block text-sm font-medium text-slate-900 mb-4">Profile Photo</label>
                                        <AvatarUpload
                                            currentAvatar={user?.profile?.avatar?.url}
                                            onUpload={handleAvatarUpload}
                                            onRemove={handleAvatarRemove}
                                            firstName={user?.profile?.firstName}
                                            lastName={user?.profile?.lastName}
                                        />
                                    </div>

                                    <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <Input
                                                label="First Name"
                                                {...registerProfile('firstName')}
                                                error={profileErrors.firstName?.message}
                                            />
                                            <Input
                                                label="Last Name"
                                                {...registerProfile('lastName')}
                                                error={profileErrors.lastName?.message}
                                            />
                                        </div>

                                        <Input
                                            label="Email Address"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-slate-50 text-slate-500"
                                            hint="Email cannot be changed"
                                        />

                                        <Input
                                            label="Phone Number"
                                            placeholder="+977-98XXXXXXXX"
                                            {...registerProfile('phoneNumber')}
                                            error={profileErrors.phoneNumber?.message}
                                        />

                                        <div className="pt-2">
                                            <Button type="submit" isLoading={isProfileSubmitting}>
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Identity Verification card (moved from KYC section) */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identity Verification</CardTitle>
                                    <CardDescription>Securely verify your identity to increase limits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={cn(
                                        "p-6 rounded-xl border flex flex-col md:flex-row items-center gap-6",
                                        user?.kyc?.status === 'verified' ? "bg-emerald-50/20 border-emerald-100" :
                                            user?.kyc?.status === 'pending' ? "bg-blue-50/20 border-blue-100" :
                                                "bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/20"
                                    )}>
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                            user?.kyc?.status === 'verified' ? "bg-white text-emerald-600 border-emerald-100" :
                                                user?.kyc?.status === 'pending' ? "bg-white text-blue-600 border-blue-100" :
                                                    "bg-white/20 text-white border-white/20"
                                        )}>
                                            {user?.kyc?.status === 'verified' ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ) : user?.kyc?.status === 'pending' ? (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className={cn("text-base font-bold", user?.kyc?.status === 'not_started' || user?.kyc?.status === 'rejected' ? "text-white" : "text-slate-900")}>
                                                {user?.kyc?.status === 'verified' ? 'Identity Verified' : user?.kyc?.status === 'pending' ? 'Review in Progress' : 'Boost Your Trust'}
                                            </h3>
                                            <p className={cn("text-xs font-medium mt-1 opacity-80", user?.kyc?.status === 'not_started' || user?.kyc?.status === 'rejected' ? "text-blue-50" : "text-slate-500")}>
                                                {user?.kyc?.status === 'verified' ? 'Full platform access unlocked.' : user?.kyc?.status === 'pending' ? 'Reviewing your application (Est. 24h).' : 'Verify identity to unlock unlimited withdrawals.'}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 w-full md:w-auto">
                                            {(user?.kyc?.status === 'not_started' || user?.kyc?.status === 'rejected') ? (
                                                <Button
                                                    onClick={() => navigate('/dashboard/kyc')}
                                                    className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 px-8 font-black rounded-xl h-10 shadow-sm transition-all hover:scale-105"
                                                >
                                                    Start KYC
                                                </Button>
                                            ) : (
                                                <div className="text-xs font-bold uppercase px-4 py-2 rounded-lg bg-black/5 text-slate-600 text-center border border-black/5">
                                                    {user?.kyc?.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>Update your password to keep your account secure</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                                        <Input
                                            type="password"
                                            label="Current Password"
                                            {...registerPassword('currentPassword')}
                                            error={passwordErrors.currentPassword?.message}
                                        />

                                        <div className="space-y-2">
                                            <Input
                                                type="password"
                                                label="New Password"
                                                {...registerPassword('newPassword')}
                                                error={passwordErrors.newPassword?.message}
                                            />
                                            <PasswordStrengthMeter password={newPassword} />
                                        </div>

                                        <Input
                                            type="password"
                                            label="Confirm New Password"
                                            {...registerPassword('confirmPassword')}
                                            error={passwordErrors.confirmPassword?.message}
                                        />

                                        <div className="pt-2">
                                            <Button type="submit" isLoading={isPasswordSubmitting} variant="secondary">
                                                Update Password
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Two-Factor Authentication</CardTitle>
                                            <CardDescription>Add an extra layer of security to your account</CardDescription>
                                        </div>
                                        {user?.mfaEnabled && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Enabled
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {user?.mfaEnabled ? (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button variant="secondary" onClick={() => setShowDisableMfa(true)}>
                                                Disable MFA
                                            </Button>
                                            <Button variant="ghost" onClick={() => setShowViewBackupCodesModal(true)}>
                                                View Backup Codes
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-slate-900">Authenticator App</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    Secure your account knowing that only you can access it.
                                                </p>
                                            </div>
                                            <Button onClick={handleSetupMFA} variant="secondary">Enable MFA</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Session Management Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Session Management</CardTitle>
                                            <CardDescription>Sign out of all other browsers and devices</CardDescription>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => setShowLogoutAllModal(true)} className="text-red-600 hover:bg-red-50">
                                            Logout All Devices
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900">Current Session</p>
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">Active Now</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">This device - Chrome on Windows</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>Manage how you receive updates and alerts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <NotificationToggle
                                        label="Transaction Updates"
                                        description="Email notifications for transaction milestones"
                                        checked={notifications.emailTransactions}
                                        onChange={() => handleNotificationChange('emailTransactions')}
                                    />
                                    <NotificationToggle
                                        label="Security Alerts"
                                        description="Email alerts for login attempts and security events"
                                        checked={notifications.emailSecurity}
                                        onChange={() => handleNotificationChange('emailSecurity')}
                                    />
                                    <NotificationToggle
                                        label="In-App Notifications"
                                        description="Show alerts in the dashboard notification center"
                                        checked={notifications.inAppNotifications}
                                        onChange={() => handleNotificationChange('inAppNotifications')}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* PAYMENTS TAB */}
                    {activeTab === 'payments' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payout Settings</CardTitle>
                                <CardDescription>Connect your payment account to receive payouts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-5 p-5 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center flex-shrink-0 text-white">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-lg">Stripe Connect</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Escrowly uses Stripe to ensure you get paid securely and on time.
                                                </p>
                                            </div>
                                            {stripeStatus?.isConnected && (
                                                <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 01.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Connected
                                                </span>
                                            )}
                                        </div>

                                        {stripeStatus && !stripeStatus.isConnected && stripeStatus.details && (
                                            <div className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                                Account connected but pending verification.
                                            </div>
                                        )}

                                        <div className="mt-5">
                                            <Button
                                                onClick={handleConnectStripe}
                                                isLoading={loadingStripe}
                                                variant={stripeStatus?.isConnected ? 'secondary' : 'primary'}
                                                className={cn(
                                                    "h-10 px-6",
                                                    !stripeStatus?.isConnected && "bg-[#635BFF] hover:bg-[#5851E1] border-transparent text-white"
                                                )}
                                            >
                                                {stripeStatus?.isConnected ? 'Manage Stripe Account' : 'Connect with Stripe'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transaction Defaults</CardTitle>
                                    <CardDescription>Customize your default escrow settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-w-md">
                                        <label className="block text-sm font-medium text-slate-900 mb-1.5">Default Inspection Period</label>
                                        <select className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all border-slate-200">
                                            <option value="3">3 days</option>
                                            <option value="7">7 days</option>
                                            <option value="14">14 days (Recommended)</option>
                                            <option value="30">30 days</option>
                                        </select>
                                        <p className="text-xs text-slate-500 mt-2">Default period for buyers to inspect goods after delivery.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-red-100 bg-red-50/10">
                                <CardHeader>
                                    <CardTitle className="text-red-900">Danger Zone</CardTitle>
                                    <CardDescription>Permanently delete your account and all associated data</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 bg-white border border-red-100 rounded-xl">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Delete Account</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">This action is permanent and cannot be undone.</p>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} className="px-6">
                                            Delete My Account
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showMfaModal} onClose={() => setShowMfaModal(false)} title="Setup Two-Factor Authentication">
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-4">
                            Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                        </p>
                        <div className="flex justify-center mb-4">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-500 mb-1">Or enter this code manually:</p>
                            <p className="font-mono text-sm text-slate-900 break-all select-all">{secret}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">6-Digit Verification Code</label>
                        <input
                            type="text"
                            placeholder="000 000"
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-center text-2xl tracking-[0.4em] font-mono text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:tracking-normal placeholder:text-slate-300"
                        />
                        <Button
                            onClick={handleEnableMFA}
                            disabled={mfaToken.length !== 6}
                            className="w-full h-12"
                        >
                            Verify & Enable
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showViewBackupCodesModal} onClose={() => { setShowViewBackupCodesModal(false); setViewBackupCodesPassword(''); }} title="View Backup Codes">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Please enter your password to view your backup codes.
                    </p>
                    <Input
                        type="password"
                        label="Account Password"
                        value={viewBackupCodesPassword}
                        onChange={(e) => setViewBackupCodesPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleViewBackupCodes()}
                        autoFocus
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => { setShowViewBackupCodesModal(false); setViewBackupCodesPassword(''); }} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleViewBackupCodes} isLoading={loadingBackupCodes} className="flex-1">
                            Reveal Codes
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showDisableMfa} onClose={() => setShowDisableMfa(false)} title="Disable Two-Factor Authentication">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 anim-pulse">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-red-600 font-medium">
                            Disabling MFA will significantly reduce your account's security.
                        </p>
                    </div>
                    <Input
                        type="password"
                        label="Confirm with Password"
                        value={disableMfaPassword}
                        onChange={(e) => setDisableMfaPassword(e.target.value)}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowDisableMfa(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDisableMFA} className="flex-1">
                            Confirm Disable
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showBackupCodes} onClose={() => setShowBackupCodes(false)} title="Backup Codes">
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-amber-700 font-medium">
                            Save these codes securely. Each code can only be used once if you lose your MFA device.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {backupCodes.map((code, index) => (
                            <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-sm text-slate-900 tracking-wider shadow-sm">
                                {code.code}
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => setShowBackupCodes(false)} className="w-full h-11">
                        I've Safely Stored These Codes
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={showLogoutAllModal} onClose={() => setShowLogoutAllModal(false)} title="Logout from All Devices">
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Are you sure you want to log out from all active sessions? You will need to sign in again on all your devices.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowLogoutAllModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleLogoutAll} className="flex-1">
                            Logout All
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Your Account">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-red-600 font-medium">
                            This action is final. All your data will be permanently wiped from our systems.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">To confirm, please type <span className="text-red-600 font-bold">DELETE</span></label>
                        <input
                            type="text"
                            placeholder="DELETE"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-slate-900 border-slate-200"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }} className="flex-1">
                            Abort
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={handleDeleteAccount}
                            isLoading={isDeleting}
                            disabled={deleteConfirmation !== 'DELETE'}
                        >
                            Delete Forever
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
