import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/common';
import { useEffect } from 'react';

const Home = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.state?.scrollTo) {
            if (location.state.scrollTo === 'top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const element = document.getElementById(location.state.scrollTo);
                if (element) {
                    // Add a small delay to ensure rendering is complete
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        }
    }, [location]);

    return (
        <div className="bg-white">
            {/* Hero - Centered and Clean */}
            {/* Hero - Centered and Clean */}
            <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
                {/* Background decorative blob - simplified */}
                <div className="absolute top-0 center transform -translate-x-1/2 left-1/2 w-full h-[500px] bg-blue-50/50 rounded-[100%] blur-3xl -z-10 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-100 text-blue-700 text-xs font-medium tracking-wide">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                            Trusted by 10,000+ businesses and freelancers
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight mb-6">
                        Secure payments for <br className="hidden sm:block" />
                        <span className="text-blue-600">every transaction</span>
                    </h1>

                    <p className="text-base sm:text-lg text-neutral-600 mb-8 max-w-xl mx-auto leading-relaxed">
                        The safest way to buy and sell online. We hold the funds until you're happy with the work, ensuring peace of mind for both parties.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/auth/register" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:min-w-[160px] h-12 text-base">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link to="/how-it-works" className="w-full sm:w-auto">
                            <Button variant="secondary" size="lg" className="w-full sm:min-w-[160px] h-12 text-base bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50">
                                How It Works
                            </Button>
                        </Link>
                    </div>

                    {/* Simple Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-neutral-100">
                        <div>
                            <div className="text-3xl font-bold text-neutral-900 mb-1">$50M+</div>
                            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Secured</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-neutral-900 mb-1">99.9%</div>
                            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Success</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-neutral-900 mb-1">10k+</div>
                            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-neutral-900 mb-1">0%</div>
                            <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Fraud</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works - Redesigned */}
            <section id="how-it-works" className="py-24 bg-neutral-50 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Simple, Safe, Secure.</h2>
                        <p className="text-lg text-neutral-600">
                            Our process is designed to protect both buyers and sellers, making sure everyone is happy before money changes hands.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-neutral-200 -z-10"></div>

                        {[
                            {
                                step: '01',
                                title: 'Agree on Terms',
                                desc: 'Buyer and seller agree on price and terms. Buyer deposits funds into our secure escrow vault.',
                                color: 'bg-blue-600'
                            },
                            {
                                step: '02',
                                title: 'Work Begins',
                                desc: 'Seller delivers the goods or service. Funds stay safe while work is in progress.',
                                color: 'bg-sky-500' // Changed from indigo to sky-blue
                            },
                            {
                                step: '03',
                                title: 'Funds Released',
                                desc: 'Buyer accepts the work, and funds are automatically released to the seller.',
                                color: 'bg-blue-800' // Changed to dark blue to stay in theme but distinct
                            }
                        ].map((item, index) => (
                            <div key={item.step} className="relative flex flex-col items-center text-center">
                                <div className={`w-16 h-16 ${item.color} rounded-2xl ring-4 ring-white flex items-center justify-center text-white text-xl font-bold mb-6`}>
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                                <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid - Redesigned */}
            <section id="features" className="py-24 bg-white scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Everything you need <br />to transact with confidence</h2>
                            <p className="text-lg text-neutral-600">
                                Powerful tools built for modern commerce.
                            </p>
                        </div>
                        <Link to="/features" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 group">
                            View all features
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Bank-Grade Security',
                                desc: 'Your data is protected with AES-256 encryption and secure SSL. We take security seriously.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Dispute Mediation',
                                desc: 'Our dedicated team helps resolve disagreements fairly, protecting both parties.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Milestone Payments',
                                desc: 'Break down large projects into smaller steps. Release funds as each milestone is met.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Low Transaction Fees',
                                desc: 'Industry-leading rates starting at just 0.89%. Capped fees for large transactions.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Global Support',
                                desc: 'Support for 135+ currencies and local payment methods worldwide.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            },
                            {
                                title: 'Developer API',
                                desc: 'Integrate escrow payments directly into your marketplace or platform with our API.',
                                icon: (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                )
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-neutral-100 hover:border-blue-100 transition-colors">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                                <p className="text-neutral-600 leading-relaxed text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section - Added for Navigation */}
            <section id="pricing" className="py-24 bg-neutral-50 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-lg text-neutral-600">
                            No hidden fees. We only make money when you do.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                name: 'Standard',
                                price: '0.89%',
                                min: '$25 min fee',
                                features: ['Secure Escrow', 'Standard Support', 'Standard Dispute Resolution'],
                                button: 'Get Started',
                                highlight: false
                            },
                            {
                                name: 'Business',
                                price: '0.65%',
                                min: '$5M+ Volume',
                                features: ['API Access', 'Dedicated Account Manager', 'Priority Dispute Resolution', 'Custom Contracts'],
                                button: 'Contact Sales',
                                highlight: true
                            },
                            {
                                name: 'Enterprise',
                                price: 'Custom',
                                min: 'Platform Partners',
                                features: ['White Label', 'Custom Integration', 'SLA Support', 'Volume Discounts'],
                                button: 'Contact Sales',
                                highlight: false
                            }
                        ].map((plan, i) => (
                            <div key={i} className={`bg-white p-8 rounded-2xl border ${plan.highlight ? 'border-blue-200 ring-4 ring-blue-50' : 'border-neutral-100'} flex flex-col`}>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-neutral-900">{plan.price}</span>
                                    {plan.price.includes('%') && <span className="text-neutral-500"> / txn</span>}
                                </div>
                                <p className="text-sm text-neutral-500 mb-8 pb-8 border-b border-neutral-100">
                                    {plan.min}
                                </p>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm text-neutral-600">
                                            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant={plan.highlight ? 'primary' : 'secondary'}
                                    className="w-full"
                                >
                                    {plan.button}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-16 pb-12 border-t border-neutral-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold text-neutral-900">Escrowly</span>
                            </div>
                            <p className="text-neutral-500 text-sm max-w-xs mb-6">
                                The most trusted escrow payment platform for freelancers and businesses worldwide.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-blue-600 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-blue-600 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900 mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-neutral-600">
                                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                                <li><a href="#" className="hover:text-blue-600">Security</a></li>
                                <li><a href="#" className="hover:text-blue-600">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900 mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-neutral-600">
                                <li><a href="#" className="hover:text-blue-600">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900 mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm text-neutral-600">
                                <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-blue-600">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
                        <div>© {new Date().getFullYear()} Escrowly Inc. All rights reserved.</div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Sitemap</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
