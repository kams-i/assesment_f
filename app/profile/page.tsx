"use client";

import React, { useState, useEffect } from 'react';
import { apiRequest, getToken } from '@/src/lib/api';
import { Heart, MessageCircle, Grid, Settings, LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PostModal from '@/src/components/postModal';
import LoginModal from '@/src/components/loginModal';
import SidePanel from '@/src/components/sidePanel';
import EditProfileModal from '@/src/components/editProfileModal';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [hasToken, setHasToken] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
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
                    console.error("No active user ID could be resolved from storage or token.");
                    setHasToken(false);
                    setIsLoading(false);
                    return;
                }

                const userRes = await apiRequest(`/user/one/${userId}`, { method: 'GET' });
                const userProfile = userRes.user || userRes.data?.user || userRes.data || userRes;
                setProfile(userProfile);

                try {
                    const postsRes = await apiRequest('/user/posts', { method: 'GET' });
                    const postsList = postsRes.posts || postsRes.data?.posts || postsRes.data || postsRes;
                    setUserPosts(Array.isArray(postsList) ? postsList : []);
                } catch (postErr) {
                    setUserPosts([]);
                }

            } catch (error) {
                console.error("Failed to load profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [router]);

    const handleOpenLogin = () => {
        setIsLoginOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        window.location.href = "/";
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
                        onClick={handleOpenLogin}
                        className="flex items-center font-medium gap-3 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors group shadow-sm cursor-pointer"
                    >
                        <LogIn className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        Login
                    </button>
                </div>

                <SidePanel onOpenLogin={handleOpenLogin} />

                <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex items-center justify-center">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">Authentication Required</h2>
                        <p className="text-sm text-gray-600">Please sign in to view and manage your profile.</p>
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

    const firstName = profile?.firstName || profile?.name || "User";
    const lastName = profile?.lastName || "";
    const username = profile?.username || "username";
    const bio = profile?.bio || "No bio added yet.";

    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
            {/* Mobile Header */}
            <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
                <img src="/Frame 48095411.png" alt="Logo" className="w-35 h-auto" />
                <button
                    onClick={handleLogout}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <SidePanel onOpenLogin={handleOpenLogin} />

            <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex flex-col items-center justify-between min-h-screen">
                <div className="w-full max-w-4xl space-y-6 pb-20 md:pb-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-4xl uppercase overflow-hidden shrink-0">
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt={firstName} className="w-full h-full object-cover" />
                            ) : (
                                firstName.charAt(0)
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">
                                        {firstName} {lastName}
                                    </h1>
                                    <p className="text-sm text-gray-500">@{username}</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <Settings className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            </div>

                            <p className="text-sm text-gray-700 max-w-xl">{bio}</p>

                            <div className="flex items-center justify-center md:justify-start gap-6 pt-2 text-sm text-gray-600">
                                <div><span className="font-bold text-gray-900">{userPosts.length}</span> Posts</div>
                                <div><span className="font-bold text-gray-900">{profile?.followersCount || 0}</span> Followers</div>
                                <div><span className="font-bold text-gray-900">{profile?.followingCount || 0}</span> Following</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                            <Grid className="w-4 h-4 text-[#7A5AF8]" />
                            <span>My Posts</span>
                        </div>

                        {userPosts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {userPosts.map((post) => (
                                    <div
                                        key={post.id || post._id}
                                        onClick={() => setSelectedPost(post)}
                                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                                    >
                                        {post.images && post.images.length > 0 ? (
                                            <div className="h-48 bg-black overflow-hidden">
                                                <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="p-4 h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-600 line-clamp-3">
                                                {post.content}
                                            </div>
                                        )}
                                        <div className="p-4 space-y-2">
                                            <p className="text-xs text-gray-800 line-clamp-2">{post.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {post.likes || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                                You haven't posted anything yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Right Logout Button for Desktop */}
                <div className="w-full max-w-4xl hidden md:flex justify-end pb-8">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm font-medium cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </section>

            <PostModal 
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                onOpenLogin={() => {}}
                post={selectedPost}
            />

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profile={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
            />
        </main>
    );
}