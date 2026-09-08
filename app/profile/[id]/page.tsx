"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, apiRequest } from '@/src/lib/api';
import { UserPlus, UserMinus, ArrowLeft, MessageSquare, Heart } from 'lucide-react';
import SidePanel from '@/src/components/sidePanel';
import LoginModal from '@/src/components/loginModal';

interface ProfileUser {
    id: number | string;
    _id?: number | string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    avatar?: string;
    bio?: string;
}

interface Post {
    id: number | string;
    _id?: number | string;
    content?: string;
    createdAt?: string;
    likesCount?: number;
    commentsCount?: number;
    image?: string;
}

function getCurrentUserId(token: string | null): string | number | null {
    let userId: string | number | null = null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            userId = parsed.id || parsed._id;
        } catch {}
    }
    if (!userId && typeof window !== 'undefined') {
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
        } catch {}
    }
    return userId;
}

function unwrap(response: any) {
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
    }
    return response;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const profileId = params?.id as string;

    const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!profileId) return;

        const loadProfileData = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const token = getToken();
                const currentUserId = getCurrentUserId(token);
                setIsOwnProfile(!!currentUserId && String(currentUserId) === String(profileId));

                // 1. Fetch User Profile Details
                const userRes = await apiRequest(`/user/${profileId}`);
                const userData = unwrap(userRes);
                setProfileUser(userData);

                // 2. Fetch User's Posts (Adjust endpoint if your backend route differs, e.g., /posts/user/${profileId})
                try {
                    const postsRes = await apiRequest(`/posts/user/${profileId}`);
                    const postsData = unwrap(postsRes);
                    setUserPosts(Array.isArray(postsData) ? postsData : []);
                } catch (postErr) {
                    console.error('Failed to load user posts (non-fatal):', postErr);
                    setUserPosts([]);
                }

                // 3. Determine follow state
                if (token && currentUserId && String(currentUserId) !== String(profileId)) {
                    try {
                        const followersRes = await apiRequest(`/user/${profileId}/followers`);
                        const followers = unwrap(followersRes);
                        const list = Array.isArray(followers) ? followers : [];
                        const alreadyFollowing = list.some(
                            (f: any) => String(f.id || f._id) === String(currentUserId)
                        );
                        setIsFollowing(alreadyFollowing);
                    } catch (err) {
                        console.error('Failed to load followers list:', err);
                    }
                }
            } catch (error: any) {
                console.error('Failed to load profile:', error);
                setErrorMessage(error.message || 'Failed to load this profile.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, [profileId]);

    const handleFollowToggle = async () => {
        const token = getToken();
        if (!token) {
            setIsLoginOpen(true);
            return;
        }

        setFollowBusy(true);
        try {
            if (isFollowing) {
                await apiRequest(`/user/${profileId}/unfollow`, { method: 'DELETE' });
                setIsFollowing(false);
            } else {
                await apiRequest(`/user/${profileId}/follow`, { method: 'POST' });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Failed to update follow status:', error);
        } finally {
            setFollowBusy(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
            </div>
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
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#7A5AF8] transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {errorMessage ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                            {errorMessage}
                        </div>
                    ) : profileUser ? (
                        <>
                            {/* Profile Header Card */}
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xl text-gray-700 uppercase overflow-hidden shrink-0">
                                            {profileUser.avatar ? (
                                                <img src={profileUser.avatar} alt={profileUser.firstName} className="w-full h-full object-cover" />
                                            ) : (
                                                profileUser.firstName?.charAt(0) || "U"
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                {profileUser.firstName} {profileUser.lastName}
                                            </h2>
                                            <p className="text-sm text-gray-500">@{profileUser.username || "username"}</p>
                                        </div>
                                    </div>

                                    {!isOwnProfile && (
                                        <button
                                            onClick={handleFollowToggle}
                                            disabled={followBusy}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                                                isFollowing
                                                    ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                                    : "bg-[#7A5AF8] text-white hover:bg-[#6944e0]"
                                            }`}
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserMinus className="w-4 h-4" /> Unfollow
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4" /> Follow
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {profileUser.bio && (
                                    <p className="text-sm text-gray-700">{profileUser.bio}</p>
                                )}
                            </div>

                            {/* User Posts Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 px-1">Posts</h3>

                                {userPosts.length > 0 ? (
                                    userPosts.map((post) => {
                                        const postId = post.id || post._id;
                                        return (
                                            <div key={postId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                                                
                                                {post.image && (
                                                    <div className="rounded-lg overflow-hidden max-h-80 bg-gray-100">
                                                        <img src={post.image} alt="Post attachment" className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-6 pt-2 text-xs text-gray-500 border-t border-gray-100">
                                                    <span className="flex items-center gap-1.5">
                                                        <Heart className="w-4 h-4 text-gray-400" /> {post.likesCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" /> {post.commentsCount || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm text-sm">
                                        This user hasn't posted anything yet.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
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