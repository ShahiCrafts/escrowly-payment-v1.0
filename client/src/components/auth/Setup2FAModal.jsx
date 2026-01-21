import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import { toast } from 'react-toastify';
import { LuScanLine, LuKey, LuX, LuShieldCheck, LuCopy, LuCheck } from "react-icons/lu";

const Setup2FAModal = () => {
    const { setupMFA, enableMFA, logout, show2FASetupModal, setShow2FASetupModal } = useAuth();

    const [step, setStep] = useState('init'); // init, verify, backup
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [backupCodes, setBackupCodes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Refs for input focus management
    const inputRefs = useRef([]);

    useEffect(() => {
        if (show2FASetupModal && step === 'init') {
            handleStartSetup();
        }
    }, [show2FASetupModal]);

    const handleStartSetup = async () => {
        try {
            const data = await setupMFA();
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep('verify');
        } catch (error) {
            toast.error('Failed to initialize MFA setup');
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Prevent multiple chars

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
        if (pastedData) {
            const newOtp = [...otp];
            pastedData.split('').forEach((char, i) => {
                if (i < 6) newOtp[i] = char;
            });
            setOtp(newOtp);
            // Focus the box after the pasted content
            const focusIndex = Math.min(pastedData.length, 5);
            inputRefs.current[focusIndex].focus();
        }
    };

    const handleVerify = async () => {
        const token = otp.join('');
        if (token.length !== 6) return;

        setLoading(true);
        try {
            const data = await enableMFA(token);
            setBackupCodes(data.backupCodes);
            setStep('backup');
            toast.success('Two-factor authentication enabled!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = () => {
        setShow2FASetupModal(false);
        setStep('init');
        setOtp(['', '', '', '', '', '']);
        window.location.reload();
    };

    const handleLogout = async () => {
        await logout();
        setShow2FASetupModal(false);
        setStep('init');
        window.location.href = '/auth/login';
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    if (!show2FASetupModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {step === 'verify' ? 'Setup Authenticator' : 'Save Backup Codes'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Make your account more secure</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50"
                        title="Cancel & Logout"
                    >
                        <LuX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 'verify' && (
                        <div className="space-y-8">
                            {/* QR Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <LuScanLine className="w-5 h-5" />
                                    </div>
                                    <h3>Scan QR Code</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Open your authenticator app (like Google Authenticator) and scan the code below.
                                </p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-6 items-center">
                                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                                        {qrCode ? (
                                            <img src={qrCode} alt="QR Code" className="w-32 h-32" />
                                        ) : (
                                            <div className="w-32 h-32 bg-slate-100 animate-pulse rounded" />
                                        )}
                                    </div>

                                    <div className="flex-1 w-full space-y-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manual Entry Key</p>
                                        <div className="font-mono text-sm font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 break-all">
                                            {secret || 'Loading...'}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(secret)}
                                            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 w-full justify-center sm:w-auto"
                                        >
                                            <LuCopy className="w-3.5 h-3.5" />
                                            Copy Key
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* OTP Input Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <LuCheck className="w-5 h-5" />
                                    </div>
                                    <h3>Enter 6-Digit Code</h3>
                                </div>

                                <div className="flex justify-between gap-2 sm:gap-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="w-full h-14 text-center text-2xl font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="text-slate-500 hover:text-slate-900"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleVerify}
                                    disabled={otp.some(d => !d) || loading}
                                    isLoading={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                >
                                    Enable 2FA
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'backup' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <div className="mt-1">
                                    <LuShieldCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900">Save your backup codes</h3>
                                    <p className="text-sm text-blue-800 mt-1">If you lose your device, these codes are the only way to recover your account.</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-xl p-6 font-mono text-white grid grid-cols-2 gap-4 text-center">
                                {backupCodes.map((code, index) => (
                                    <button
                                        key={index}
                                        className="bg-white/10 py-2.5 rounded-lg select-all hover:bg-white/20 transition-colors cursor-pointer active:scale-95 transform"
                                        onClick={() => copyToClipboard(code)}
                                        title="Click to copy"
                                    >
                                        {code}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Copy All Codes
                                </Button>
                                <Button
                                    onClick={handleComplete}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 border-transparent text-white"
                                >
                                    I've Saved Them
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Setup2FAModal;
