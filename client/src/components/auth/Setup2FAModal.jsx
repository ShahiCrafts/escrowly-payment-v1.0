import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';
import { toast } from 'react-toastify';
import { LuScanLine, LuX, LuShieldCheck, LuCopy, LuKeyboard, LuDownload, LuRefreshCw } from "react-icons/lu";

const Setup2FAModal = () => {
    const { setupMFA, enableMFA, logout, show2FASetupModal, setShow2FASetupModal } = useAuth();

    const [step, setStep] = useState('init'); // init, verify, backup
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [backupCodes, setBackupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

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
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

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
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCodes = () => {
        const text = `Escrowly Backup Codes\n${'='.repeat(25)}\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'escrowly-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup codes downloaded');
    };

    if (!show2FASetupModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h1 className="text-base font-semibold text-slate-900">
                        {step === 'verify' ? 'Setup authenticator app' : 'Save backup codes'}
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        title="Cancel & Logout"
                    >
                        <LuX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'verify' && (
                        <div className="space-y-6">
                            {/* QR Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <LuScanLine className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">Scan QR code</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Scan the QR code below or manually enter the secret key into your authenticator app.
                                </p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-5 items-center">
                                    <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                                        {qrCode ? (
                                            <img src={qrCode} alt="QR Code" className="w-28 h-28" />
                                        ) : (
                                            <div className="w-28 h-28 bg-slate-100 animate-pulse rounded" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2.5">
                                        <p className="text-xs font-medium text-slate-500">Can't scan? Enter code manually:</p>
                                        <div className="font-mono text-xs font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 break-all select-all">
                                            {secret || 'Loading...'}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(secret)}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300"
                                        >
                                            <LuCopy className="w-3.5 h-3.5" />
                                            Copy code
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* OTP Input */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <LuKeyboard className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">Enter verification code</h3>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Enter the 6-digit code on your authenticator app.
                                </p>

                                <div className="flex gap-2.5">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="w-full h-12 text-center text-xl font-bold bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleLogout}
                                    className="flex-1 h-11 rounded-xl font-bold justify-center"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleVerify}
                                    disabled={otp.some(d => !d) || loading}
                                    isLoading={loading}
                                    className="flex-1 h-11 rounded-xl font-bold justify-center bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Verify
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'backup' && (
                        <div className="space-y-5">
                            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <LuShieldCheck className="w-7 h-7 text-green-500" />
                            </div>

                            <div className="text-center space-y-1.5">
                                <h3 className="text-lg font-bold text-slate-900">Save your recovery codes</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    These are your only way to recover your account if you lose your device. Store them somewhere safe.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                <div className="grid grid-cols-2 gap-2.5 font-mono text-sm">
                                    {backupCodes.map((code, index) => (
                                        <button
                                            key={index}
                                            className="bg-white border border-slate-200 py-2.5 rounded-lg text-center text-slate-900 tracking-wider hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer active:scale-95"
                                            onClick={() => copyToClipboard(code)}
                                            title="Click to copy"
                                        >
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    <LuCopy className="w-4 h-4" />
                                    Copy All
                                </button>
                                <button
                                    onClick={downloadCodes}
                                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    <LuDownload className="w-4 h-4" />
                                    Download
                                </button>
                            </div>

                            <Button
                                onClick={handleComplete}
                                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-bold"
                            >
                                I've saved my codes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Setup2FAModal;
