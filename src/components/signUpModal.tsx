"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/src/lib/api';

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
    onSignUpSuccess?: () => void;
}

export default function SignUpModal({ isOpen, onClose, onSwitchToLogin, onSignUpSuccess }: SignUpModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        age: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const response = await apiRequest('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    age: Number(formData.age),
                }),
            });

            // Extract token and user details if the backend automatically logs them in upon signup
            const token = response.token || response.accessToken;
            const refreshToken = response.refreshToken;
            const user = response.user || response.data;

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('accessToken', token);
            }
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Reset form and close modal
            setFormData({
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                age: '',
                password: '',
            });
            onClose();

            if (onSignUpSuccess) {
                onSignUpSuccess();
            } else if (token) {
                window.location.reload();
            } else {
                onSwitchToLogin(); // Fallback to login if token isn't returned on signup
            }
        } catch (error: any) {
            console.error("Sign up failed:", error);
            setErrorMessage(error.message || "Failed to create account. Please check your details and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-200 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5 rounded-full bg-gray-200" />
                </button>

                <div className='p-2 sm:p-4'>
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Create an Account</h2>
                    <p className="text-gray-600 text-center text-sm mb-6">Enter your details to get started with Gidshare.</p>

                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* Sign Up Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="John"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe_30"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="21"
                                    required
                                    min={0}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@gmail.com"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#7A5AF8] text-white font-medium rounded-lg hover:bg-[#6948d3] transition-colors shadow-sm cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </button>

                        <p className='text-xs text-center text-gray-500 mt-4 leading-relaxed'>
                            By continuing, you agree to Gidshare <span className="underline cursor-pointer">Terms of Service</span> and confirm that you have read Gidshare <span className="underline cursor-pointer">Privacy Policy</span>.
                        </p>
                        
                        <p className='text-xs text-center text-gray-700 mt-4'>
                            Already have an account?{' '}
                            <button 
                                type="button" 
                                onClick={onSwitchToLogin}
                                className="text-[#7A5AF8] font-semibold hover:underline cursor-pointer"
                            >
                                Log in
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}