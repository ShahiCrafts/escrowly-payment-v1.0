import { useState } from 'react';
import { Card, CardContent } from '../../components/common';
import { cn } from '../../utils/cn';
import {
    HiOutlineBolt,
    HiOutlineArrowsRightLeft,
    HiOutlineClipboardDocumentCheck,
    HiOutlineShieldCheck,
    HiOutlineCurrencyDollar,
    HiOutlineChartBar,
    HiOutlineStar
} from 'react-icons/hi2';

const HelpPage = () => {
    const [activeSection, setActiveSection] = useState('getting-started');

    const sections = [
        {
            id: 'trust-score',
            title: 'Trust & Reputation',
            icon: HiOutlineStar,
            content: (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">The Trust Score System</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Trust Score is an automated reputation system that measures user reliability.
                            Your score ranges from 0 to 100 and determines your badge level.
                        </p>

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(level => (
                                <div key={level} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <img src={`/Badge_0${level}.svg`} alt={`Badge ${level}`} className="w-10 h-10" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Level {level}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900">How to Improve Your Score</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="text-emerald-500 font-bold">+5 pts</span>
                                    <span>Successfully completing an escrow transaction.</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="text-red-500 font-bold">-10 pts</span>
                                    <span>Losing a dispute or being found at fault by an admin.</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="text-red-500 font-bold">-2 pts</span>
                                    <span>Cancelling a transaction without mutual consent.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: HiOutlineBolt,
            content: (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Setting Up Your Account</h3>
                        <p className="text-slate-600 leading-relaxed">
                            To start using Escrowly, you'll need to verify your email and complete your profile.
                            If you plan to sell services or goods, you must also complete <b>Stripe Onboarding</b> to receive payments.
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">💡 Pro Tip</h4>
                        <p className="text-sm text-blue-800">
                            Complete your KYC verification in the Settings panel to increase your transaction limits.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'transactions',
            title: 'Transactions',
            icon: HiOutlineArrowsRightLeft,
            content: (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">How Escrow Works</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li><span className="font-semibold text-slate-900">Initiation:</span> Party creates transaction with terms.</li>
                            <li><span className="font-semibold text-slate-900">Acceptance:</span> Counterparty reviews and accepts.</li>
                            <li><span className="font-semibold text-slate-900">Funding:</span> Buyer sends funds to secure holding.</li>
                            <li><span className="font-semibold text-slate-900">Work/Delivery:</span> Seller performs service or sends goods.</li>
                            <li><span className="font-semibold text-slate-900">Release:</span> Once satisfied, buyer releases funds.</li>
                        </ol>
                    </div>
                </div>
            )
        },
        {
            id: 'milestones',
            title: 'Milestones',
            icon: HiOutlineClipboardDocumentCheck,
            content: (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Managing Complex Projects</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Milestones allow you to break down large transactions into smaller, manageable chunks.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2 text-slate-600">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span><b>Submit PoC:</b> Sellers provide Proof of Completion.</span>
                            </li>
                            <li className="flex items-start gap-2 text-slate-600">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span><b>Approve:</b> Buyers review and approve PoC.</span>
                            </li>
                            <li className="flex items-start gap-2 text-slate-600">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span><b>Release:</b> Triggers fund disbursement.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'disputes',
            title: 'Disputes & Security',
            icon: HiOutlineShieldCheck,
            content: (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Reporting a Problem</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Report issues using the <b>Problem</b> icon in the header. Our team will mediate.
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-amber-900 mb-1">⚠️ Security Warning</h4>
                        <p className="text-sm text-amber-800">
                            Never communicate outside Escrowly. Protection only applies platform activity.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'fees',
            title: 'Fees & Pricing',
            icon: HiOutlineCurrencyDollar,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Platform Fees</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Escrowly charges a standard fee to cover secure holding, mediation services, and payment processing.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="block text-xs font-bold text-slate-400 uppercase">Standard Escrow</span>
                                <span className="text-2xl font-bold text-slate-900">3%</span>
                                <p className="text-xs text-slate-500 mt-1">Of total transaction value</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="block text-xs font-bold text-slate-400 uppercase">Processing</span>
                                <span className="text-2xl font-bold text-slate-900">2.9% + Rs. 30</span>
                                <p className="text-xs text-slate-500 mt-1">Stripe standard card fees</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'limits',
            title: 'Withdrawal Limits',
            icon: HiOutlineChartBar,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Verification & Limits</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Your withdrawal limits depend on your account verification level. Higher status allows for larger and more frequent payouts.
                        </p>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-4 py-2 rounded-l-lg">Level</th>
                                    <th className="px-4 py-2">Daily Limit</th>
                                    <th className="px-4 py-2 rounded-r-lg">Requirements</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-900">Basic</td>
                                    <td className="px-4 py-3 text-slate-600">Rs. 50,000</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">Email Verified</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-900">Verified</td>
                                    <td className="px-4 py-3 text-slate-600">Rs. 5,00,000</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">ID Verification</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-medium text-slate-900">Pro</td>
                                    <td className="px-4 py-3 text-slate-600">Unlimited</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">Business Proof</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help Center</h1>
                <p className="text-slate-500 mt-1.5 text-[15px]">Everything you need to know about using Escrowly safely and effectively.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-4 space-y-2">
                    {sections.filter(s => !['fees', 'limits'].includes(s.id)).map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all border",
                                activeSection === section.id
                                    ? "bg-blue-500 text-white border-blue-500 shadow-none"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            <section.icon className={cn(
                                "w-5 h-5 transition-colors",
                                activeSection === section.id ? "text-white" : "text-blue-500"
                            )} />
                            {section.title}
                        </button>
                    ))}

                    <div className="mt-8 p-6 bg-blue-600 rounded-2xl text-white">
                        <h4 className="font-bold mb-2">Still need help?</h4>
                        <p className="text-blue-100 text-sm mb-4">Our support team is available 24/7 for critical transaction issues.</p>
                        <button className="w-full py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-8">
                    <Card className="border border-slate-200 overflow-hidden shadow-none rounded-2xl">
                        <CardContent className="p-6">
                            {sections.find(s => s.id === activeSection)?.content}
                        </CardContent>
                    </Card>

                    {/* FAQ Quick Links - Adjusted margin for alignment */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            onClick={() => setActiveSection('fees')}
                            className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all cursor-pointer group"
                        >
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600">What are the fees?</h4>
                            <p className="text-sm text-slate-500 mt-1">Learn about our competitive escrow and processing fees.</p>
                        </div>
                        <div
                            onClick={() => setActiveSection('limits')}
                            className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all cursor-pointer group"
                        >
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600">Withdrawal limits</h4>
                            <p className="text-sm text-slate-500 mt-1">Verification levels and daily withdrawal caps.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
