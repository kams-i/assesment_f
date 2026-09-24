"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, apiRequest } from '@/src/lib/api';
import { UserPlus, UserMinus, ArrowLeft, Heart, Grid, MessageCircle, Edit3, Trash2 } from 'lucide-react';
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
    followersCount?: number;
    followingCount?: number;
}

interface Post {
    id: number | string;
    _id?: number | string;
    content?: string;
    createdAt?: string;
    likesCount?: number;
    likes?: any[] | number;
    commentsCount?: number;
    comments?: any[] | number;
    image?: string;
    imageUrl?: string;
    images?: string | string[];
    media?: string;
    photo?: string;
    url?: string;
}

function getCurrentUserId(token: string | null): string | number | null {
    let userId: string | number | null = null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            userId = parsed.id || parsed._id;
        } catch { }
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
        } catch { }
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
    const [messageBusy, setMessageBusy] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Selected post state for viewing details
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    // States for Followers / Following Modal List
    const [isModalListOpen, setIsModalListOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalUsers, setModalUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!profileId) return;

        const loadProfileData = async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const token = getToken();
                const currentUserId = getCurrentUserId(token);
                setIsOwnProfile(!!currentUserId && String(currentUserId) === String(profileId));

                // 1. Fetch User Profile Details & Followers/Following counts concurrently
                const [userRes, followersRes, followingRes] = await Promise.all([
                    apiRequest(`/user/one/${profileId}`),
                    apiRequest(`/user/${profileId}/followers`).catch(() => []),
                    apiRequest(`/user/${profileId}/following`).catch(() => [])
                ]);

                const userData = unwrap(userRes);
                const userProfile = userData?.user || userData?.data || userData;

                const followersList = Array.isArray(followersRes) ? followersRes : (followersRes?.followers || followersRes?.data || []);
                const followingList = Array.isArray(followingRes) ? followingRes : (followingRes?.following || followingRes?.data || []);

                setProfileUser({
                    ...userProfile,
                    followersCount: followersList.length,
                    followingCount: followingList.length
                });

                // Determine follow state
                if (token && currentUserId && String(currentUserId) !== String(profileId)) {
                    const alreadyFollowing = followersList.some(
                        (f: any) => String(f.id || f._id) === String(currentUserId)
                    );
                    setIsFollowing(alreadyFollowing);
                }

                // 2. Fetch User's Posts
                try {
                    const postsRes = await apiRequest(`/post/user/${profileId}`);
                    const postsData = unwrap(postsRes);
                    const rawPosts = Array.isArray(postsData) ? postsData : (postsData?.posts || postsData?.data || []);
                    setUserPosts(Array.isArray(rawPosts) ? rawPosts : []);
                } catch (postErr) {
                    console.error('Failed to load user posts (non-fatal):', postErr);
                    setUserPosts([]);
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
                setProfileUser((prev) => prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) } : null);
            } else {
                await apiRequest(`/user/${profileId}/follow`, { method: 'POST' });
                setIsFollowing(true);
                setProfileUser((prev) => prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null);
            }
        } catch (error) {
            console.error('Failed to update follow status:', error);
        } finally {
            setFollowBusy(false);
        }
    };

    const handleStartMessage = async () => {
        const token = getToken();
        if (!token) {
            setIsLoginOpen(true);
            return;
        }

        setMessageBusy(true);
        try {
            await apiRequest(`/message/conversation/${profileId}`);
            router.push(`/messages?userId=${profileId}`);
        } catch (error) {
            console.error('Failed to initialize conversation:', error);
        } finally {
            setMessageBusy(false);
        }
    };

    const handleStartEditPost = (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        // Add your edit logic here
    };

    const handleDeletePost = async (e: React.MouseEvent, postId: string | number) => {
        e.stopPropagation();
        const token = getToken();
        if (!token) return;

        try {
            await apiRequest(`/post/${postId}`, { method: 'DELETE' });
            setUserPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
        } catch (err) {
            console.error('Failed to delete post:', err);
        }
    };

    const handleOpenFollowers = async () => {
        if (!profileUser) return;
        setModalTitle("Followers");
        try {
            const res = await apiRequest(`/user/${profileId}/followers`, { method: 'GET' });
            const list = Array.isArray(res) ? res : (res?.followers || res?.data || []);
            setModalUsers(list);
        } catch {
            setModalUsers([]);
        }
        setIsModalListOpen(true);
    };

    const handleOpenFollowing = async () => {
        if (!profileUser) return;
        setModalTitle("Following");
        try {
            const res = await apiRequest(`/user/${profileId}/following`, { method: 'GET' });
            const list = Array.isArray(res) ? res : (res?.following || res?.data || []);
            setModalUsers(list);
        } catch {
            setModalUsers([]);
        }
        setIsModalListOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const firstName = profileUser?.firstName || "User";
    const lastName = profileUser?.lastName || "";
    const username = profileUser?.username || "username";
    const bio = profileUser?.bio || "No bio added yet.";
    const followersCount = profileUser?.followersCount ?? 0;
    const followingCount = profileUser?.followingCount ?? 0;

    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
            <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
                <img src="/Frame 48095411.png" alt="Logo" className="w-35 h-auto" />
            </div>

            <SidePanel onOpenLogin={() => setIsLoginOpen(true)} />

            <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex flex-col items-center justify-between min-h-screen">
                <div className="w-full max-w-4xl space-y-6 pb-20 md:pb-6">
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
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-4xl uppercase overflow-hidden shrink-0">
                                    {profileUser.avatar ? (
                                        <img src={profileUser.avatar} alt={firstName} className="w-full h-full object-cover" />
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

                                        {!isOwnProfile && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleFollowToggle}
                                                    disabled={followBusy}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${isFollowing
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

                                                <button
                                                    onClick={handleStartMessage}
                                                    disabled={messageBusy}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    {messageBusy ? 'Opening...' : 'Message'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-700 max-w-xl">{bio}</p>

                                    <div className="flex items-center justify-center md:justify-start gap-6 pt-2 text-sm text-gray-600">
                                        <div><span className="font-bold text-gray-900">{userPosts.length}</span> Posts</div>
                                        <div
                                            onClick={handleOpenFollowers}
                                            className="cursor-pointer hover:text-[#7A5AF8] transition-colors"
                                        >
                                            <span className="font-bold text-gray-900">{followersCount}</span> Followers
                                        </div>
                                        <div
                                            onClick={handleOpenFollowing}
                                            className="cursor-pointer hover:text-[#7A5AF8] transition-colors"
                                        >
                                            <span className="font-bold text-gray-900">{followingCount}</span> Following
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Posts Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                                    <Grid className="w-4 h-4 text-[#7A5AF8]" />
                                    <span>Posts</span>
                                </div>

                                {userPosts.length > 0 ? (
                                    <div className="w-full max-w-2xl mx-auto space-y-6">
                                        {userPosts.map((post) => {
                                            const postId = post.id || post._id;

                                            let rawImage =
                                                post.image ||
                                                post.imageUrl ||
                                                (Array.isArray(post.images) ? post.images[0] : post.images) ||
                                                post.media ||
                                                post.photo ||
                                                post.url;

                                            let postImage = rawImage;
                                            if (rawImage && typeof rawImage === 'string' && rawImage.startsWith('/')) {
                                                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                                                postImage = `${apiBase}${rawImage}`;
                                            }

                                            const likesVal = post.likes;
                                            const likesCount = Array.isArray(likesVal)
                                                ? likesVal.length
                                                : (typeof likesVal === 'number' ? likesVal : (post.likesCount || 0));

                                            const commentsVal = post.comments;
                                            const commentsCount = Array.isArray(commentsVal)
                                                ? commentsVal.length
                                                : (typeof commentsVal === 'number' ? commentsVal : (post.commentsCount || 0));

                                            const formattedImages = postImage ? [postImage] : [];

                                            return (
                                                <div
                                                    key={postId}
                                                    onClick={() => setSelectedPost(post)}
                                                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex flex-col space-y-3"
                                                >
                                                    {isOwnProfile && (
                                                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <button
                                                                onClick={(e) => handleStartEditPost(e, post)}
                                                                className="p-1.5 bg-white/95 hover:bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors"
                                                                title="Edit Post"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => postId && handleDeletePost(e, postId)}
                                                                className="p-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-lg shadow-sm border border-gray-200 transition-colors"
                                                                title="Delete Post"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0">
                                                            {profileUser?.avatar ? (
                                                                <img src={profileUser.avatar} alt={firstName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                firstName.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 capitalize">
                                                                {firstName} {lastName}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">@{username}</p>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                        {post.content}
                                                    </p>

                                                    {formattedImages.length > 0 && (
                                                        <div className="rounded-lg overflow-hidden bg-black max-h-100 w-full flex items-center justify-center">
                                                            <img src={formattedImages[0]} alt="Post media" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-6 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                                        <span className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                                            <Heart className="w-4 h-4 text-gray-500" /> {likesCount}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 hover:text-[#7A5AF8] transition-colors">
                                                            <MessageCircle className="w-4 h-4" /> {commentsCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                                        This user hasn't posted anything yet.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </section>

            {/* Followers / Following List Modal */}
            {isModalListOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-900">{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalListOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-3">
                            {modalUsers.length > 0 ? (
                                modalUsers.map((u: any) => {
                                    const uid = u.id || u._id;
                                    return (
                                        <div
                                            key={uid}
                                            onClick={() => {
                                                setIsModalListOpen(false);
                                                router.push(`/profile/${uid}`);
                                            }}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt={u.firstName} className="w-full h-full object-cover" />
                                                ) : (
                                                    (u.firstName || "U").charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    {u.firstName} {u.lastName}
                                                </h4>
                                                <p className="text-xs text-gray-500">@{u.username || "username"}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-6">No users found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToSignUp={() => { }}
            />
        </main>
    );
}