import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Modal } from '../../components/common';
import {
    HiOutlineIdentification,
    HiOutlineClipboardDocumentCheck,
    HiOutlineCloudArrowUp,
    HiOutlineInformationCircle,
    HiOutlineArrowUpTray,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineDocumentPlus,
    HiOutlineXCircle,
    HiOutlineQuestionMarkCircle,
    HiOutlineChevronRight,
    HiOutlineChevronLeft,
    HiOutlineTrash,
    HiOutlineUserCircle,
    HiOutlineHome,
    HiOutlineBriefcase,
    HiOutlineShieldCheck
} from 'react-icons/hi2';
import { toast } from 'react-toastify';

const documentTypes = [
    { id: 'passport', title: 'Passport', description: 'International travel document', icon: HiOutlineIdentification },
    { id: 'citizenship', title: 'Citizenship Certificate', description: 'National citizenship document', icon: HiOutlineIdentification },
];

const InputLabel = ({ children, required }) => (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {children}
        {required && <span className="text-red-500 ml-1 font-black text-sm">*</span>}
    </label>
);

const FormInput = ({ name, value, onChange, placeholder, type = "text", icon: Icon, ...props }) => (
    <div className="relative group">
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
        )}
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={cn(
                "w-full pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition-all outline-none text-slate-900 text-sm",
                Icon ? "pl-10" : "pl-4",
                props.disabled && "bg-slate-50 opacity-100",
                props.className
            )}
            {...props}
        />
    </div>
);

const FormSelect = ({ name, value, onChange, options, icon: Icon, ...props }) => (
    <div className="relative group">
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
        )}
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={cn(
                "w-full pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition-all outline-none text-slate-900 text-sm appearance-none",
                Icon ? "pl-10" : "pl-4",
                props.disabled && "bg-slate-50",
                props.className
            )}
            {...props}
        >
            <option value="">Select option</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <HiOutlineChevronRight className="w-4 h-4 rotate-90" />
        </div>
    </div>
);

const KYCSubmission = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState({
        idFront: null,
        idBack: null,
        selfie: null
    });
    const [showSampleModal, setShowSampleModal] = useState(false);

    const [form, setForm] = useState({
        documentType: '',
        fullName: user?.profile?.firstName + (user?.profile?.lastName ? ` ${user?.profile?.lastName}` : '') || '',
        idNumber: '',
        gender: '',
        maritalStatus: '',
        dobAd: '',
        dobBs: '',
        panNumber: '',
        socialMediaId: '',
        // Family
        fatherName: '',
        motherName: '',
        grandfatherName: '',
        spouseName: '',
        // Permanent Address
        permStreet: '',
        permWard: '',
        permMunicipality: '',
        permDistrict: '',
        permProvince: '',
        permCountry: 'Nepal',
        // Current Address
        currStreet: '',
        currWard: '',
        currMunicipality: '',
        currDistrict: '',
        currProvince: '',
        currCountry: 'Nepal',
        sameAsPermanent: false,
        // Occupation
        education: '',
        occupation: '',
        employerName: '',
        position: '',
        yearlyIncome: '',
        incomeSource: '',
        // Declarations
        pepStatus: false,
        beneficialOwner: false,
        residenceStatus: 'Resident'
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'sameAsPermanent' && checked) {
            setForm(prev => ({
                ...prev,
                currStreet: prev.permStreet,
                currWard: prev.permWard,
                currMunicipality: prev.permMunicipality,
                currDistrict: prev.permDistrict,
                currProvince: prev.permProvince,
                currCountry: prev.permCountry
            }));
        }
    };

    const handleFileChange = (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size should be less than 10MB');
            return;
        }

        setFiles(prev => ({
            ...prev,
            [category]: file
        }));
    };

    const removeFile = (category) => {
        setFiles(prev => ({
            ...prev,
            [category]: null
        }));
    };

    const handleSubmit = async () => {
        if (!files.idFront || !files.idBack) {
            toast.error('Please upload both Front and Back of your ID');
            return;
        }

        setLoading(true);
        const formData = new FormData();

        // Append all form fields (filter out empty strings for optional enums)
        Object.keys(form).forEach(key => {
            const value = form[key];
            if (value !== '' || typeof value === 'boolean') {
                formData.append(key, value);
            }
        });

        // Append files with specific field names
        if (files.idFront) formData.append('idFront', files.idFront);
        if (files.idBack) formData.append('idBack', files.idBack);
        if (files.selfie) formData.append('selfie', files.selfie);

        try {
            await api.post('/users/kyc/submit', formData);
            await refreshUser();
            setStep(6);
            toast.success('KYC submitted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit KYC');
            console.error('KYC Submission Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (user?.kyc?.status === 'verified') {
        return (
            <div className="max-w-5xl mx-auto py-12 px-4 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineCheckCircle className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">You're Verified!</h1>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Your identity has been successfully verified. You have full access to all features.</p>
                <Button onClick={() => navigate('/dashboard/settings')} variant="outline" className="shadow-none">Back to Settings</Button>
            </div>
        );
    }

    if (user?.kyc?.status === 'pending') {
        return (
            <div className="max-w-5xl mx-auto py-12 px-4 text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineClipboardDocumentCheck className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Verification in Progress</h1>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">We're reviewing your documents. This usually takes less than 24 hours. We'll notify you once it's complete.</p>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="shadow-none">Back to Dashboard</Button>
            </div>
        );
    }


    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Verification</h1>
                <p className="text-slate-500 mt-2 text-[15px]">Please provide accurate information for quick verification.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-8 space-y-8">
                    {/* Progress Stepper */}
                    <div>
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-0" />
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className="flex flex-col items-center relative z-10 w-1/5">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 shadow-none",
                                        step >= s
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-slate-300 border-slate-100"
                                    )}>
                                        {step > s ? <HiOutlineCheckCircle className="w-6 h-6" /> : s}
                                    </div>
                                    <span className={cn(
                                        "mt-3 text-[10px] font-bold uppercase tracking-widest text-center transition-colors",
                                        step >= s ? "text-blue-600" : "text-slate-400"
                                    )}>
                                        {s === 1 ? 'ID TYPE' : s === 2 ? 'PERSONAL' : s === 3 ? 'ADDRESS' : s === 4 ? 'PROFESSION' : 'UPLOAD'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Steps Rendering */}
                    <div>
                        {/* Step 1: ID Selection */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {documentTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setForm(prev => ({ ...prev, documentType: type.id }))}
                                            className={cn(
                                                "p-6 rounded-2xl border transition-all duration-200 text-left group relative",
                                                form.documentType === type.id
                                                    ? "border-blue-500 bg-blue-50/20"
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 border border-slate-100",
                                                form.documentType === type.id
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-slate-50 text-slate-400 group-hover:text-blue-500"
                                            )}>
                                                <type.icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-semibold text-slate-900 text-base">{type.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.description}</p>

                                            {form.documentType === type.id && (
                                                <div className="absolute top-4 right-4 text-blue-500">
                                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-8">
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate('/dashboard/settings')}
                                        className="text-slate-500 hover:text-slate-900 shadow-none border-none"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        disabled={!form.documentType}
                                        onClick={() => setStep(2)}
                                        className="px-8 group"
                                        size="lg"
                                    >
                                        Continue
                                        <HiOutlineChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal & Family Information */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-100 shadow-none overflow-visible">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl">Personal Information</CardTitle>
                                        <CardDescription>Basic details as per your identification document.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <InputLabel required>Full Name (as per ID)</InputLabel>
                                                <FormInput name="fullName" value={form.fullName} onChange={handleChange} icon={HiOutlineUserCircle} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>ID / Document Number</InputLabel>
                                                <FormInput name="idNumber" value={form.idNumber} onChange={handleChange} icon={HiOutlineIdentification} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Gender</InputLabel>
                                                <FormSelect name="gender" value={form.gender} onChange={handleChange} options={[
                                                    { value: 'male', label: 'Male' },
                                                    { value: 'female', label: 'Female' },
                                                    { value: 'others', label: 'Others' }
                                                ]} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Marital Status</InputLabel>
                                                <FormSelect name="maritalStatus" value={form.maritalStatus} onChange={handleChange} options={[
                                                    { value: 'unmarried', label: 'Unmarried' },
                                                    { value: 'married', label: 'Married' },
                                                    { value: 'other', label: 'Other' }
                                                ]} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Date of Birth (AD)</InputLabel>
                                                <FormInput type="date" name="dobAd" value={form.dobAd} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Nationality</InputLabel>
                                                <FormInput name="nationality" value="Nepali" readOnly disabled className="bg-slate-50 opacity-100" />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>PAN Number (Optional)</InputLabel>
                                                <FormInput name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="Tax ID" />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Social Media ID (Optional)</InputLabel>
                                                <FormInput name="socialMediaId" value={form.socialMediaId} onChange={handleChange} placeholder="@username" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl">Family Details</CardTitle>
                                        <CardDescription>Required for regulatory compliance and identity verification.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <InputLabel required>Father's Full Name</InputLabel>
                                                <FormInput name="fatherName" value={form.fatherName} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Mother's Full Name</InputLabel>
                                                <FormInput name="motherName" value={form.motherName} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Grandfather's Full Name</InputLabel>
                                                <FormInput name="grandfatherName" value={form.grandfatherName} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Spouse's Full Name (if applicable)</InputLabel>
                                                <FormInput name="spouseName" value={form.spouseName} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-between pt-8">
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => setStep(1)} className="px-8 shadow-none" size="lg">
                                            <HiOutlineChevronLeft className="w-5 h-5 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <Button
                                        disabled={!form.fullName || !form.idNumber || !form.gender}
                                        onClick={() => setStep(3)}
                                        className="px-10 shadow-none"
                                        size="lg"
                                    >
                                        Continue
                                        <HiOutlineChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address Details */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-100 shadow-none">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <HiOutlineHome className="w-6 h-6 text-blue-600" />
                                            <CardTitle className="text-xl">Permanent Address</CardTitle>
                                        </div>
                                        <CardDescription>Address as mentioned in your identification document.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><InputLabel required>Street / Tole</InputLabel><FormInput name="permStreet" value={form.permStreet} onChange={handleChange} /></div>
                                        <div className="space-y-2"><InputLabel required>Ward No.</InputLabel><FormInput name="permWard" value={form.permWard} onChange={handleChange} /></div>
                                        <div className="space-y-2"><InputLabel required>Municipality</InputLabel><FormInput name="permMunicipality" value={form.permMunicipality} onChange={handleChange} /></div>
                                        <div className="space-y-2"><InputLabel required>District</InputLabel><FormInput name="permDistrict" value={form.permDistrict} onChange={handleChange} /></div>
                                        <div className="space-y-2"><InputLabel required>Province</InputLabel><FormInput name="permProvince" value={form.permProvince} onChange={handleChange} /></div>
                                        <div className="space-y-2"><InputLabel required>Country</InputLabel><FormInput name="permCountry" value={form.permCountry} readOnly disabled className="bg-slate-50" /></div>
                                    </CardContent>
                                </Card>

                                <div className="flex items-center gap-3 px-2">
                                    <input
                                        type="checkbox"
                                        id="sameAsPermanent"
                                        name="sameAsPermanent"
                                        checked={form.sameAsPermanent}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                    />
                                    <label htmlFor="sameAsPermanent" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">Current address is same as permanent address</label>
                                </div>

                                {!form.sameAsPermanent && (
                                    <Card className="border-slate-100 shadow-none animate-in fade-in duration-300">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xl">Current Address</CardTitle>
                                            <CardDescription>Where you are currently residing.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2"><InputLabel>Street / Tole</InputLabel><FormInput name="currStreet" value={form.currStreet} onChange={handleChange} /></div>
                                            <div className="space-y-2"><InputLabel>Ward No.</InputLabel><FormInput name="currWard" value={form.currWard} onChange={handleChange} /></div>
                                            <div className="space-y-2"><InputLabel>Municipality</InputLabel><FormInput name="currMunicipality" value={form.currMunicipality} onChange={handleChange} /></div>
                                            <div className="space-y-2"><InputLabel>District</InputLabel><FormInput name="currDistrict" value={form.currDistrict} onChange={handleChange} /></div>
                                            <div className="space-y-2"><InputLabel>Province</InputLabel><FormInput name="currProvince" value={form.currProvince} onChange={handleChange} /></div>
                                            <div className="space-y-2"><InputLabel>Country</InputLabel><FormInput name="currCountry" value={form.currCountry} onChange={handleChange} /></div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="flex justify-between pt-8">
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => setStep(2)} className="px-8 shadow-none" size="lg">
                                            <HiOutlineChevronLeft className="w-5 h-5 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <Button
                                        disabled={!form.permStreet || !form.permDistrict}
                                        onClick={() => setStep(4)}
                                        className="px-10 shadow-none"
                                        size="lg"
                                    >
                                        Continue
                                        <HiOutlineChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Occupation & Professional */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-100 shadow-none">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3 text-blue-600">
                                            <HiOutlineBriefcase className="w-6 h-6" />
                                            <CardTitle className="text-xl text-slate-900">Professional Details</CardTitle>
                                        </div>
                                        <CardDescription>Information about your work and financials.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <InputLabel>Qualification</InputLabel>
                                                <FormSelect name="education" value={form.education} onChange={handleChange} options={[
                                                    { value: 'SLC/SEE', label: 'SLC / SEE' },
                                                    { value: 'Intermediate', label: 'Intermediate (+2)' },
                                                    { value: 'Graduate', label: 'Graduate' },
                                                    { value: 'Post Graduate', label: 'Post Graduate' },
                                                    { value: 'Professional', label: 'Professional Degree' },
                                                    { value: 'Other', label: 'Other' }
                                                ]} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Occupation</InputLabel>
                                                <FormSelect name="occupation" value={form.occupation} onChange={handleChange} options={[
                                                    { value: 'Private Sector', label: 'Private Sector' },
                                                    { value: 'Government', label: 'Government / Public Sector' },
                                                    { value: 'Business', label: 'Self Employed / Business' },
                                                    { value: 'Professional', label: 'Professional (Doctor, Engineer, etc)' },
                                                    { value: 'Student', label: 'Student' },
                                                    { value: 'Retired', label: 'Retired' },
                                                    { value: 'Other', label: 'Other' }
                                                ]} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Employer / Business Name</InputLabel>
                                                <FormInput name="employerName" value={form.employerName} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Designation / Position</InputLabel>
                                                <FormInput name="position" value={form.position} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel>Yearly Income (Approx.)</InputLabel>
                                                <FormSelect name="yearlyIncome" value={form.yearlyIncome} onChange={handleChange} options={[
                                                    { value: 'Below 5 Lakhs', label: 'Below 5 Lakhs' },
                                                    { value: '5 - 10 Lakhs', label: '5 - 10 Lakhs' },
                                                    { value: '10 - 20 Lakhs', label: '10 - 20 Lakhs' },
                                                    { value: 'Above 20 Lakhs', label: 'Above 20 Lakhs' }
                                                ]} />
                                            </div>
                                            <div className="space-y-2">
                                                <InputLabel required>Source of Income</InputLabel>
                                                <FormSelect name="incomeSource" value={form.incomeSource} onChange={handleChange} options={[
                                                    { value: 'Salary', label: 'Salary' },
                                                    { value: 'Business Profit', label: 'Business Profit' },
                                                    { value: 'Investment', label: 'Investment / Dividend' },
                                                    { value: 'Remittance', label: 'Remittance' },
                                                    { value: 'Property Sale', label: 'Property Sale' },
                                                    { value: 'Other', label: 'Other' }
                                                ]} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-between pt-8">
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => setStep(3)} className="px-8 shadow-none" size="lg">
                                            <HiOutlineChevronLeft className="w-5 h-5 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <Button
                                        disabled={!form.occupation || !form.incomeSource}
                                        onClick={() => setStep(5)}
                                        className="px-10 shadow-none"
                                        size="lg"
                                    >
                                        Continue
                                        <HiOutlineChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Declarations & Uploads */}
                        {step === 5 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-100 shadow-none">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3 text-blue-600">
                                            <HiOutlineShieldCheck className="w-6 h-6" />
                                            <CardTitle className="text-xl text-slate-900">Declarations</CardTitle>
                                        </div>
                                        <CardDescription>Compliance and regulatory declarations.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                id="pepStatus"
                                                name="pepStatus"
                                                checked={form.pepStatus}
                                                onChange={handleChange}
                                                className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="pepStatus" className="text-sm leading-relaxed text-slate-600">
                                                Are you, a family member, or an associate a <b>Politically Exposed Person (PEP)</b>?
                                                <p className="text-xs text-slate-400 mt-1">PEP includes individuals who are or have been entrusted with prominent public functions.</p>
                                            </label>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                id="beneficialOwner"
                                                name="beneficialOwner"
                                                checked={form.beneficialOwner}
                                                onChange={handleChange}
                                                className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="beneficialOwner" className="text-sm leading-relaxed text-slate-600">
                                                Are you the <b>Beneficial Owner</b> for this account?
                                                <p className="text-xs text-slate-400 mt-1">Checking this confirms you are acting on your own behalf and not for another person.</p>
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { key: 'idFront', label: 'ID Front View', icon: HiOutlineIdentification },
                                        { key: 'idBack', label: 'ID Back View', icon: HiOutlineIdentification },
                                        { key: 'selfie', label: 'Selfie with ID', icon: HiOutlineUserCircle },
                                    ].map((item) => (
                                        <div key={item.key} className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                                                {files[item.key] && (
                                                    <button
                                                        onClick={() => removeFile(item.key)}
                                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    "relative aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                                                    files[item.key]
                                                        ? "border-blue-500 bg-blue-50/10"
                                                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300"
                                                )}
                                            >
                                                {files[item.key] ? (
                                                    <div className="absolute inset-0 group">
                                                        <img
                                                            src={URL.createObjectURL(files[item.key])}
                                                            alt={item.label}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="px-3 py-1.5 bg-white/90 rounded-lg text-slate-900 text-[10px] font-bold uppercase tracking-tight shadow-lg">
                                                                Replace Image
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileChange(e, item.key)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-400 mb-3 border border-slate-100 shadow-sm">
                                                            <item.icon className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Upload {item.key === 'selfie' ? 'Selfie' : 'Image'}</p>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileChange(e, item.key)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between pt-12">
                                    <div className="flex gap-3 items-center">
                                        <Button variant="secondary" onClick={() => setStep(4)} className="px-8" size="lg">
                                            <HiOutlineChevronLeft className="w-5 h-5 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/dashboard/settings')}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <Button
                                        disabled={!files.idFront || !files.idBack || loading}
                                        onClick={handleSubmit}
                                        className="px-12 rounded-xl font-bold min-w-[200px]"
                                        size="lg"
                                        isLoading={loading}
                                    >
                                        Submit Verification
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Success */}
                        {step === 6 && (
                            <div className="max-w-xl mx-auto text-center animate-in fade-in zoom-in-95 duration-700 py-12">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-subtle shadow-none">
                                    <HiOutlineCheckCircle className="w-14 h-14" />
                                </div>
                                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">You're All Set!</h2>
                                <p className="text-slate-500 text-lg leading-relaxed mb-12">
                                    We've received your documents. Our compliance team will review your application within 24 hours.
                                </p>
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-10"
                                    size="lg"
                                >
                                    Back to Dashboard
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Security Card */}
                <div className="md:col-span-4 lg:pl-4 sticky top-6">
                    {step < 6 && (
                        <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100">
                                    <HiOutlineShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 text-base">Security & Privacy</h4>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        Your documents are secured with <b>AES-256 encryption</b>. Data is used strictly for identity verification and compliance.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Sample Guide Modal */}
            <Modal
                isOpen={showSampleModal}
                onClose={() => setShowSampleModal(false)}
                title={`${form.documentType === 'passport' ? 'Passport' : 'Citizenship Certificate'} Guide`}
                size="lg"
                className="bg-slate-50"
            >
                <div className="-mx-5 -my-5 p-10">
                    {form.documentType === 'passport' ? (
                        <div className="flex flex-col md:flex-row items-stretch gap-12">
                            <div className="md:w-1/2 overflow-hidden rounded-3xl bg-white border border-slate-200">
                                <img
                                    src="/images/samples/passport_sample.png"
                                    alt="Passport Guide"
                                    className="w-full h-48 md:h-full object-cover"
                                />
                            </div>
                            <div className="md:w-1/2 space-y-5 flex flex-col justify-center py-4">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Passport Guide</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        For a successful verification, please ensure your document meets these requirements:
                                    </p>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'All four corners must be visible',
                                        'No glare from flash or direct light',
                                        'Text must be perfectly legible',
                                        'The photo ID page must be fully open'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-stretch gap-12">
                            <div className="md:w-1/2 grid grid-cols-2 gap-4 overflow-hidden rounded-3xl bg-white border border-slate-200 p-3">
                                <img
                                    src="/images/samples/citizenship_front_sample.png"
                                    alt="Citizenship Front"
                                    className="w-full h-32 md:h-full object-cover rounded-xl"
                                />
                                <img
                                    src="/images/samples/citizenship_back_sample.png"
                                    alt="Citizenship Back"
                                    className="w-full h-32 md:h-full object-cover rounded-xl"
                                />
                            </div>
                            <div className="md:w-1/2 space-y-5 flex flex-col justify-center py-4">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Citizenship Guide</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        Ensure your citizenship certificate is captured clearly from both sides:
                                    </p>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'Upload both front and back sides',
                                        'Original document only, no screen photos',
                                        'All information must be clearly visible',
                                        'Remove any plastic covers to avoid glare'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </Modal >
        </div >
    );
};

export default KYCSubmission;
