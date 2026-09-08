"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest, getToken } from '@/src/lib/api';
import { deletePost, updatePost } from '@/src/services/postService';
import { Heart, MessageCircle, Grid, Settings, LogIn, LogOut, X, Trash2, Edit3 } from 'lucide-react';
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

    // States for Editing a Post
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isSavingPost, setIsSavingPost] = useState(false);

    // States for Followers / Following Modal List
    const [isModalListOpen, setIsModalListOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalUsers, setModalUsers] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchProfileData = useCallback(async () => {
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

            setCurrentUserId(userId);

            // Fetch User Profile info, Followers, Following, and Posts concurrently
            const [userRes, followersRes, followingRes, postRes] = await Promise.all([
                apiRequest(`/user/one/${userId}`, { method: 'GET' }),
                apiRequest(`/user/${userId}/followers`, { method: 'GET' }).catch(() => []),
                apiRequest(`/user/${userId}/following`, { method: 'GET' }).catch(() => []),
                apiRequest(`/post/user/posts`, { method: 'GET' })
            ]);

            const userProfile = userRes.user || userRes.data?.user || userRes.data || userRes;

            const followersList = Array.isArray(followersRes) ? followersRes : (followersRes?.followers || followersRes?.data || []);
            const followingList = Array.isArray(followingRes) ? followingRes : (followingRes?.following || followingRes?.data || []);

            setProfile({
                ...userProfile,
                followersCount: followersList.length,
                followingCount: followingList.length
            });

            // Fetch User Posts
            const rawPosts = Array.isArray(postRes) ? postRes : (postRes?.posts || postRes?.data || []);
            const postsList = rawPosts.app ? rawPosts : rawPosts.map((p: any) => ({
                ...p,
                likes: Array.isArray(p.likes) ? p.likes.length : (p.likes ?? p.likesCount ?? 0),
                comments: Array.isArray(p.comments) ? p.comments : []
            }));
            setUserPosts(postsList);

        } catch (error) {
            console.error("Failed to load profile data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
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

    const handleDeletePost = async (e: React.MouseEvent, postId: string | number) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await deletePost(postId);
            setUserPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
            if (selectedPost && (selectedPost.id || selectedPost._id) === postId) {
                setSelectedPost(null);
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete post");
        }
    };

    const handleStartEditPost = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setEditingPost(post);
        setEditContent(post.content || "");
    };

    const handleSaveEditPost = async () => {
        if (!editingPost) return;
        const postId = editingPost.id || editingPost._id;
        try {
            setIsSavingPost(true);
            const updatedData = { ...editingPost, content: editContent };
            const response = await updatePost(postId, updatedData);

            const savedPost = response?.post || response?.data || updatedData;

            setUserPosts((prev) =>
                prev.map((p) => ((p.id || p._id) === postId ? { ...p, ...savedPost, content: editContent } : p))
            );

            if (selectedPost && (selectedPost.id || selectedPost._id) === postId) {
                setSelectedPost((prev: any) => ({ ...prev, ...savedPost, content: editContent }));
            }

            setEditingPost(null);
            setEditContent("");
        } catch (err: any) {
            alert(err.message || "Failed to update post");
        } finally {
            setIsSavingPost(false);
        }
    };

    const handleOpenFollowers = async () => {
        if (!profile) return;
        setModalTitle("Followers");
        const userId = profile.id || profile._id;
        try {
            const res = await apiRequest(`/user/${userId}/followers`, { method: 'GET' });
            const list = Array.isArray(res) ? res : (res?.followers || res?.data || []);
            setModalUsers(list);
        } catch (e) {
            setModalUsers([]);
        }
        setIsModalListOpen(true);
    };

    const handleOpenFollowing = async () => {
        if (!profile) return;
        setModalTitle("Following");
        const userId = profile.id || profile._id;
        try {
            const res = await apiRequest(`/user/${userId}/following`, { method: 'GET' });
            const list = Array.isArray(res) ? res : (res?.following || res?.data || []);
            setModalUsers(list);
        } catch (e) {
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
                    onSwitchToSignUp={() => { }}
                />
            </main>
        );
    }

    const firstName = profile?.firstName || profile?.name || "User";
    const lastName = profile?.lastName || "";
    const username = profile?.username || "username";
    const bio = profile?.bio || "No bio added yet.";

    const followersCount = profile?.followersCount ?? profile?.followers?.length ?? 0;
    const followingCount = profile?.followingCount ?? profile?.following?.length ?? 0;

    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
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

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                            <Grid className="w-4 h-4 text-[#7A5AF8]" />
                            <span>My Posts</span>
                        </div>

                        {userPosts.length > 0 ? (
                            <div className="w-full max-w-2xl mx-auto space-y-6">
                                {userPosts.map((post) => {
                                    const postId = post.id || post._id;
                                    return (
                                        <div
                                            key={postId}
                                            onClick={() => setSelectedPost(post)}
                                            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex flex-col space-y-3"
                                        >
                                            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={(e) => handleStartEditPost(e, post)}
                                                    className="p-1.5 bg-white/95 hover:bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors"
                                                    title="Edit Post"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeletePost(e, postId)}
                                                    className="p-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-lg shadow-sm border border-gray-200 transition-colors"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0">
                                                    {profile?.avatar ? (
                                                        <img src={profile.avatar} alt={firstName} className="w-full h-full object-cover" />
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

                                            {post.images && post.images.length > 0 && (
                                                <div className="rounded-lg overflow-hidden bg-black max-h-100 w-full">
                                                    <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                                <span className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                                    <Heart className="w-4 h-4 text-gray-500 " /> {post.likes || 0}
                                                </span>
                                                <span className="flex items-center gap-1.5 hover:text-[#7A5AF8] transition-colors">
                                                    <MessageCircle className="w-4 h-4" /> {post.comments?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                                You haven't posted anything yet.
                            </div>
                        )}
                    </div>
                </div>

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
                onOpenLogin={() => { }}
                post={selectedPost}
            />

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profile={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
            />

            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-900">Edit Post</h3>
                            <button
                                onClick={() => setEditingPost(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700">Content</label>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setEditingPost(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEditPost}
                                disabled={isSavingPost}
                                className="px-4 py-2 bg-[#7A5AF8] text-white rounded-lg text-sm font-medium hover:bg-[#6944e0] disabled:opacity-50"
                            >
                                {isSavingPost ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalListOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {modalUsers && modalUsers.length > 0 ? (
                                modalUsers.map((user) => {
                                    const uId = user.id || user._id;
                                    const uName = user.firstName ? `${user.firstName} ${user.lastName || ''}` : (user.name || "User");
                                    const uUsername = user.username || "username";
                                    const uAvatar = user.avatar;
                                    const isSelf = currentUserId === uId;

                                    return (
                                        <div key={uId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 overflow-hidden shrink-0">
                                                    {uAvatar ? (
                                                        <img src={uAvatar} alt={uName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        uName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 capitalize">{uName}</h4>
                                                    <p className="text-xs text-gray-500">@{uUsername}</p>
                                                </div>
                                            </div>

                                            {!isSelf && (
                                                <button
                                                    onClick={() => router.push(`/user/${uId}`)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-[#7A5AF8] text-white rounded-lg hover:bg-[#6944e0] transition-colors cursor-pointer"
                                                >
                                                    Profile
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-500 text-sm">
                                    No {modalTitle.toLowerCase()} found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}