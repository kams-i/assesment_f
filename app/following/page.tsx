"use client";

import React, { useState, useEffect } from 'react';
import { getToken, apiRequest } from '@/src/lib/api';
import { fetchFollowing, unfollowUser } from '@/src/services/userService';
import { Users, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SidePanel from '@/src/components/sidePanel';
import LoginModal from '@/src/components/loginModal';

export default function FollowingPage() {
    const router = useRouter();
    const [followingList, setFollowingList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasToken, setHasToken] = useState(true);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        const loadFollowing = async () => {
            const token = getToken();
            if (!token) {
                setHasToken(false);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                let userId = null;
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        userId = parsed.id || parsed._id;
                    } catch (e) {
                        console.error("Failed to parse stored user", e);
                    }
                }

                if (!userId) {
                    userId = localStorage.getItem('userId');
                }

                if (!userId && token) {
                    try {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(
                            atob(base64)
                                .split('')
                                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                .join('')
                        );
                        const decoded = JSON.parse(jsonPayload);
                        userId = decoded.id || decoded.userId || decoded.sub;
                    } catch (err) {
                        console.error("Failed to decode token for user ID:", err);
                    }
                }

                if (!userId) {
                    setHasToken(false);
                    setIsLoading(false);
                    return;
                }

                const data = await fetchFollowing(userId);
                setFollowingList(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch following list:", error);
                setFollowingList([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadFollowing();
    }, []);

    const handleUnfollow = async (targetId: string | number) => {
        try {
            await unfollowUser(targetId);
            setFollowingList((prev) => prev.filter((user) => (user.id || user._id) !== targetId));
        } catch (error) {
            console.error("Failed to unfollow user:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!hasToken) {
        return (
            <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
                <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
                    <img src="/Frame 48095411.png" alt="Logo" className="w-35 h-auto" />
                </div>

                <div className="hidden md:flex fixed top-4 right-6 z-40">
                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="flex items-center font-medium gap-3 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors group shadow-sm cursor-pointer"
                    >
                        <LogIn className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        Login
                    </button>
                </div>

                <SidePanel onOpenLogin={() => setIsLoginOpen(true)} />

                <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex items-center justify-center">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">Authentication Required</h2>
                        <p className="text-sm text-gray-600">Please sign in to view accounts you follow.</p>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => router.push("/")}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Back to Feed
                            </button>
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#7A5AF8] text-white rounded-lg text-sm font-medium hover:bg-[#6944e0] transition-colors cursor-pointer"
                            >
                                <LogIn className="w-4 h-4" /> Sign In
                            </button>
                        </div>
                    </div>
                </section>

                <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => {
                        setIsLoginOpen(false);
                        if (getToken()) {
                            window.location.reload();
                        }
                    }}
                    onSwitchToSignUp={() => {}}
                />
            </main>
        );
    }

    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
            <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
                <img src="/Frame 48095411.png" alt="Logo" className="w-35 h-auto" />
            </div>

            <SidePanel onOpenLogin={() => setIsLoginOpen(true)} />

            <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex flex-col items-center min-h-screen">
                <div className="w-full max-w-2xl space-y-6 pb-20 md:pb-6">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                        <Users className="w-4 h-4 text-[#7A5AF8]" />
                        <span>People You Follow</span>
                    </div>

                    {followingList.length > 0 ? (
                        <div className="space-y-3">
                            {followingList.map((user) => {
                                const userId = user.id || user._id;
                                return (
                                    <div
                                        key={userId}
                                        onClick={() => router.push(`/profile/${userId}`)}
                                        className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 uppercase overflow-hidden shrink-0">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.firstName?.charAt(0) || "U"
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                    {user.firstName} {user.lastName}
                                                </h4>
                                                <p className="text-xs text-gray-500">@{user.username || "username"}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnfollow(userId);
                                            }}
                                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Unfollow
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                            You are not following anyone yet.
                        </div>
                    )}
                </div>
            </section>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToSignUp={() => {}}
            />
        </main>
    );
}