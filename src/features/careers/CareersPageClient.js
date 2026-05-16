'use client';

import { useState, useEffect } from 'react';
import { MdLocationOn, MdWork, MdTrendingUp, MdClose, MdLightbulb, MdPeople, MdSchool, MdMenu, MdCloudUpload, MdCheckCircle } from 'react-icons/md';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import Swal from 'sweetalert2';

export default function Careers() {
    const [jobPositions, setJobPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        linkedIn: '',
        currentPosition: '',
        experience: '',
        portfolio: '',
        coverLetter: ''
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/careers?activeOnly=true');
            const result = await response.json();
            if (result.success) {
                setJobPositions(result.data);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (job) => {
        setSelectedJob(job);
        setIsModalOpen(true);
        // Reset form
        setFormData({
            name: '',
            email: '',
            phone: '',
            linkedIn: '',
            currentPosition: '',
            experience: '',
            portfolio: '',
            coverLetter: ''
        });
        setResumeFile(null);
        setResumeUrl('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedJob(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: 'Please upload a PDF, DOC, or DOCX file only.'
            });
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'File size must be less than 10MB.'
            });
            return;
        }

        setResumeFile(file);
        setUploadingResume(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('resume', file);

            const response = await fetch('/api/upload-resume', {
                method: 'POST',
                body: formDataUpload
            });

            const result = await response.json();

            if (result.success) {
                setResumeUrl(result.data.url);
                Swal.fire({
                    icon: 'success',
                    title: 'Resume Uploaded',
                    text: 'Your resume has been uploaded successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.error || 'Failed to upload resume');
            }
        } catch (error) {
            console.error('Resume upload error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Failed to upload resume. Please try again.'
            });
            setResumeFile(null);
        } finally {
            setUploadingResume(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name || !formData.email || !formData.phone || !formData.coverLetter) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Fields',
                text: 'Please fill in all required fields.'
            });
            return;
        }

        if (!resumeUrl) {
            Swal.fire({
                icon: 'error',
                title: 'Resume Required',
                text: 'Please upload your resume before submitting.'
            });
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId: selectedJob?._id || 'general',
                    jobTitle: selectedJob?.title || 'General Application',
                    ...formData,
                    resumeUrl,
                    resumeFileName: resumeFile?.name || 'resume.pdf'
                })
            });

            const result = await response.json();

            if (result.success) {
                closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Application Submitted!',
                    text: 'Thank you for your application. We will review it and get back to you soon.',
                    confirmButtonColor: '#dc2626'
                });
            } else {
                throw new Error(result.error || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Application submit error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message || 'Failed to submit application. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const benefits = [
        {
            title: 'Competitive Salary',
            description: 'Market-leading compensation packages with equity options'
        },
        {
            title: 'Health Benefits',
            description: 'Comprehensive health, dental, and vision coverage'
        },
        {
            title: 'Remote Work',
            description: 'Flexible work arrangements with remote-first culture'
        },
        {
            title: 'Professional Growth',
            description: 'Learning budget and mentorship from industry experts'
        },
        {
            title: 'Unlimited PTO',
            description: 'Take time off when you need it - we trust our team'
        },
        {
            title: 'Stock Options',
            description: 'Participate in company success with equity grants'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-white to-white">
            <WhatsAppIcon />
            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 border-b border-[#b27e02]/20 bg-white/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold">
                            <a href="/">
                                <span className="text-[#b27e02]">Qwikly</span>
                                <span className="text-black">Launch</span>
                            </a>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex gap-8 items-center">
                            <a href="/contact" className="bg-[#b27e02] text-white px-6 py-2 rounded-lg hover:bg-[#8a6002] transition font-medium">Book Free Consultation</a>
                        </div>

                        {/* Hamburger Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-700 hover:text-[#b27e02] transition p-2"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                            <a
                                href="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block bg-[#b27e02] text-white px-6 py-3 rounded-lg hover:bg-[#8a6002] transition font-medium text-center"
                            >
                                Book Free Consultation
                            </a>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-black via-black to-[#4a3800] relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#c99010]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/10 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Main Content */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Build the Future
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4a030] to-[#c99010]">
                                With Qwikly Launch
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Join a fast-growing team revolutionizing AI-powered SaaS development. Work on cutting-edge projects with talented engineers and make a real impact.
                        </p>

                        {/* CTA Button */}
                        <a href="#positions" className="inline-block bg-[#b27e02] text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#8a6002] transition transform hover:scale-105 mb-12">
                            View Open Positions
                        </a>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
                            <div className="text-4xl font-bold text-white mb-2">Remote-First</div>
                            <p className="text-gray-300">Work from anywhere in the world</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
                            <div className="text-4xl font-bold text-white mb-2">Competitive Pay</div>
                            <p className="text-gray-300">Top-tier salaries + equity options</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition">
                            <div className="text-4xl font-bold text-white mb-2">Fast Growth</div>
                            <p className="text-gray-300">Advance your career rapidly</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Join Us */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Why Join Qwikly Launch?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">We're not just building products—we're building careers and shaping the future of AI development.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdTrendingUp className="text-white text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-black mb-4">Growth Opportunities</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Fast-growing startup where your contributions directly impact our success and your career advancement.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdWork className="text-white text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-black mb-4">Meaningful Work</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Build products that solve real problems for founders and entrepreneurs around the world.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdLocationOn className="text-white text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-black mb-4">Flexible Work</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Remote-first culture with flexible schedules that work for you and your lifestyle.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Perks & Benefits</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">We invest in our team's success with competitive compensation and comprehensive benefits.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#b27e02]/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
                                <div className="relative">
                                    <div className="text-[#b27e02] text-4xl mb-4">✓</div>
                                    <h3 className="text-xl font-bold text-black mb-3">{benefit.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section id="positions" className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-black mb-12 text-center">Open Positions</h2>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b27e02]"></div>
                        </div>
                    ) : jobPositions.length > 0 ? (
                        <div className="space-y-4">
                            {jobPositions.map((job, index) => (
                                <div key={job._id || index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-[#b27e02] hover:shadow-lg transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-black">{job.title}</h3>
                                            <p className="text-gray-600 text-sm mt-1">{job.department}</p>
                                        </div>
                                        <div className="flex gap-4 flex-wrap">
                                            <span className="bg-[#faf0d0] text-[#8a6002] px-4 py-2 rounded-full text-sm font-medium">{job.type}</span>
                                            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">{job.location}</span>
                                            {job.experience && (
                                                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">{job.experience}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">{job.description}</p>
                                    {job.salary && (
                                        <p className="text-gray-700 font-medium mb-4">💰 Salary: {job.salary}</p>
                                    )}
                                    <button
                                        onClick={() => openModal(job)}
                                        className="bg-[#b27e02] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#8a6002] transition"
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl">
                            <p className="text-gray-600 text-lg mb-4">No open positions at the moment.</p>
                            <p className="text-gray-500">But we're always looking for talented people!</p>
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">Don't see a position that fits you?</p>
                        <button
                            onClick={() => openModal({ title: 'General Application', department: 'Any', location: 'Remote', type: 'Full-time' })}
                            className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-900 transition"
                        >
                            Send Us Your Resume
                        </button>
                    </div>
                </div>
            </section>

            {/* Application Process */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Our Hiring Process</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Simple, transparent, and designed to help us get to know each other.</p>
                    </div>
                    <div className="relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-[#f0d090] via-[#b27e02] to-[#f0d090] -z-10"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">1</div>
                                <h3 className="font-bold text-black text-xl mb-3 text-center">Application</h3>
                                <p className="text-gray-600 text-center leading-relaxed">Submit your application and resume online</p>
                            </div>
                            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">2</div>
                                <h3 className="font-bold text-black text-xl mb-3 text-center">Phone Screen</h3>
                                <p className="text-gray-600 text-center leading-relaxed">Initial conversation with our team</p>
                            </div>
                            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">3</div>
                                <h3 className="font-bold text-black text-xl mb-3 text-center">Interviews</h3>
                                <p className="text-gray-600 text-center leading-relaxed">Technical & cultural fit assessment</p>
                            </div>
                            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">4</div>
                                <h3 className="font-bold text-black text-xl mb-3 text-center">Offer</h3>
                                <p className="text-gray-600 text-center leading-relaxed">Welcome to the team!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Culture Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Our Culture</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We believe in moving fast, thinking big, and supporting each other. Our team is diverse, talented, and passionate about building the future of SaaS development.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-[#fef9e7] to-[#faf0d0] rounded-2xl p-8 border-2 border-[#f0d090] hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdLightbulb className="text-white text-3xl" />
                            </div>
                            <h3 className="font-bold text-2xl text-black mb-3">Innovation First</h3>
                            <p className="text-gray-700 leading-relaxed">We embrace new ideas and aren't afraid to take calculated risks</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#fef9e7] to-[#faf0d0] rounded-2xl p-8 border-2 border-[#f0d090] hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdPeople className="text-white text-3xl" />
                            </div>
                            <h3 className="font-bold text-2xl text-black mb-3">Collaboration</h3>
                            <p className="text-gray-700 leading-relaxed">We work together across teams to achieve ambitious goals</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#fef9e7] to-[#faf0d0] rounded-2xl p-8 border-2 border-[#f0d090] hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <MdSchool className="text-white text-3xl" />
                            </div>
                            <h3 className="font-bold text-2xl text-black mb-3">Continuous Learning</h3>
                            <p className="text-gray-700 leading-relaxed">We invest in our team's growth and development</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-[#b27e02] to-[#8a6002]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Make an Impact?</h2>
                    <p className="text-xl text-[#faf0d0] mb-8">Join us in building the future of AI-powered SaaS development.</p>
                    <a href="#positions" className="inline-block bg-black text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition transform hover:scale-105">
                        Browse Open Positions
                    </a>
                </div>
            </section>

            <Footer />

            {/* Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-black mb-2">Apply for {selectedJob?.title}</h2>
                                <div className="flex gap-3 flex-wrap">
                                    <span className="text-sm text-gray-600">{selectedJob?.department}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">{selectedJob?.location}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">{selectedJob?.type}</span>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-500 hover:text-[#b27e02] transition">
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        {/* Modal Body - Application Form */}
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                                            <input
                                                type="url"
                                                name="linkedIn"
                                                value={formData.linkedIn}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="linkedin.com/in/yourprofile"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-4">Professional Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                                            <input
                                                type="text"
                                                name="currentPosition"
                                                value={formData.currentPosition}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="Senior Developer at Company X"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                                            <select
                                                name="experience"
                                                value={formData.experience}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition text-gray-900 bg-white"
                                            >
                                                <option value="">Select experience level</option>
                                                <option value="0-1 years">0-1 years</option>
                                                <option value="1-3 years">1-3 years</option>
                                                <option value="3-5 years">3-5 years</option>
                                                <option value="5-10 years">5-10 years</option>
                                                <option value="10+ years">10+ years</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio / GitHub URL</label>
                                            <input
                                                type="url"
                                                name="portfolio"
                                                value={formData.portfolio}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition placeholder-gray-500 text-gray-900 bg-white"
                                                placeholder="github.com/yourprofile"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Resume Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Resume / CV *</label>
                                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition ${resumeUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#b27e02]'}`}>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            id="resume-upload"
                                            onChange={handleResumeUpload}
                                            disabled={uploadingResume}
                                        />
                                        <label htmlFor="resume-upload" className="cursor-pointer">
                                            {uploadingResume ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#b27e02]"></div>
                                                    <span className="text-gray-600">Uploading...</span>
                                                </div>
                                            ) : resumeUrl ? (
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <MdCheckCircle className="text-2xl" />
                                                    <span className="font-medium">{resumeFile?.name || 'Resume uploaded'}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <MdCloudUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                                                    <div className="text-gray-600 mb-2">
                                                        <span className="text-[#b27e02] font-medium">Click to upload</span> or drag and drop
                                                    </div>
                                                    <div className="text-sm text-gray-500">PDF, DOC, DOCX (max. 10MB)</div>
                                                </>
                                            )}
                                        </label>
                                        {resumeUrl && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResumeFile(null);
                                                    setResumeUrl('');
                                                }}
                                                className="mt-2 text-sm text-[#b27e02] hover:underline"
                                            >
                                                Remove and upload different file
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Letter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter / Message *</label>
                                    <textarea
                                        name="coverLetter"
                                        value={formData.coverLetter}
                                        onChange={handleInputChange}
                                        rows={6}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 outline-none transition resize-none placeholder-gray-500 text-gray-900 bg-white"
                                        placeholder="Tell us why you're a great fit for this position..."
                                    ></textarea>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#b27e02] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#8a6002] transition disabled:bg-[#d4a030] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={submitting || uploadingResume}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
