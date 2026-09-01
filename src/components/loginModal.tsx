"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/src/lib/api';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToSignUp: () => void;
    onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignUp, onLoginSuccess }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const response = await apiRequest('/auth/signin', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
            const refreshToken = response.refreshToken || response.data?.refreshToken;
            const user = response.user || response.data?.user || response.data;

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

            setEmail('');
            setPassword('');
            onClose();

            if (onLoginSuccess) {
                onLoginSuccess();
            } else {
                window.location.href = "/profile";
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            setErrorMessage(error.message || "Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-200 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5 rounded-full bg-gray-200" />
                </button>

                <div className='p-2 sm:p-5'>
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Login to Gidshare</h2>
                    <p className="text-gray-600 text-center text-sm mb-6">Please enter your details to sign in.</p>

                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@gmail.com"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#7A5AF8] text-white font-medium rounded-lg hover:bg-[#6948d3] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                        <p className='text-xs text-center text-gray-500 mt-4 leading-relaxed'>
                            By continuing, you agree to Gidshare <span className="underline cursor-pointer">Terms of Service</span> and confirm that you have read Gidshare <span className="underline cursor-pointer">Privacy Policy</span>.
                        </p>
                        <p className='text-xs text-center text-gray-700 mt-4'>
                            Don’t have an account?{' '}
                            <button 
                                type="button" 
                                onClick={onSwitchToSignUp}
                                className="text-[#7A5AF8] font-semibold hover:underline cursor-pointer"
                            >
                                Sign up
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}