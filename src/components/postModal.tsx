"use client";

import React, { useState } from 'react';
import { X, Heart, MessageCircle, Send, Share2 } from 'lucide-react';
import { apiRequest } from '@/src/lib/api';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
    };
}

interface PostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLogin: () => void;
    post: {
        id: number;
        title?: string;
        content: string;
        userId: number;
        images?: string[];
        videos?: string[];
        likes?: string | number | any[];
        likesCount?: number;
        user?: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
        comments?: Comment[];
    } | null;
    onError?: (msg: string) => void;
}

export default function PostModal({ isOpen, onClose, onOpenLogin, post, onError }: PostModalProps) {
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState<number>(0);
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to extract numeric count or array length safely
    const getLikesCount = (likesData: any): number => {
        if (Array.isArray(likesData)) return likesData.length;
        if (typeof likesData === 'number') return likesData;
        if (typeof likesData === 'string') return parseInt(likesData, 10) || 0;
        return 0;
    };

    React.useEffect(() => {
        if (!post?.id) return;

        const fetchPostDetails = async () => {
            try {
                const res = await apiRequest(`/post/${post.id}`, { method: 'GET' });
                const data = res.post || res.data || res;

                const rawLikes = data.likes ?? data.likesCount ?? post.likes;
                setLikeCount(getLikesCount(rawLikes));

                const rawComments = data.comments ?? post.comments ?? [];
                setCommentsList(Array.isArray(rawComments) ? rawComments : []);

                const storedUser = localStorage.getItem('user');
                if (storedUser && Array.isArray(data.likes)) {
                    const parsed = JSON.parse(storedUser);
                    const currentUserId = parsed.id || parsed._id;
                    const hasLiked = data.likes.some((likeItem: any) => 
                        Number(likeItem?.userId || likeItem?.id || likeItem?._id || likeItem) === Number(currentUserId)
                    );
                    setIsLiked(hasLiked);
                }
            } catch (err) {
                console.error("Failed to fetch full post details:", err);
                setLikeCount(getLikesCount(post.likes ?? post.likesCount));
                setCommentsList(Array.isArray(post.comments) ? post.comments : []);
            }
        };

        fetchPostDetails();
    }, [post?.id]);

    if (!isOpen || !post) return null;

    const checkAuth = () => {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!token) {
            onClose();
            onOpenLogin();
            return false;
        }
        return true;
    };

    const handleLikeToggle = async () => {
        if (!checkAuth()) return;

        const previousIsLiked = isLiked;
        const previousLikeCount = likeCount;

        try {
            if (isLiked) {
                setIsLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
            await apiRequest(`/like/post/${post.id}`, { method: 'POST' });
        } catch (error: any) {
            setIsLiked(previousIsLiked);
            setLikeCount(previousLikeCount);
            console.error("Failed to toggle like:", error);
            onError?.(error.message || "Failed to update like status");
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkAuth()) return;
        if (!commentText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const response = await apiRequest(`/post/${post.id}/comment`, {
                method: 'POST',
                body: JSON.stringify({ content: commentText.trim() }),
            });

            let newComment: Comment;
            if (response?.comment) {
                newComment = response.comment;
            } else if (response?.data?.comment) {
                newComment = response.data.comment;
            } else if (Array.isArray(response?.data) && response.data.length > 0) {
                newComment = response.data[response.data.length - 1];
            } else if (response?.id) {
                newComment = response;
            } else {
                let currentUser = { id: 0, username: "you", firstName: "You", lastName: "" };
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        currentUser = {
                            id: parsed.id || parsed._id || 0,
                            username: parsed.username || "you",
                            firstName: parsed.firstName || parsed.name || "You",
                            lastName: parsed.lastName || ""
                        };
                    }
                } catch (err) {
                    console.error("Failed to parse stored user for comment fallback", err);
                }

                newComment = {
                    id: Date.now(),
                    content: commentText.trim(),
                    createdAt: new Date().toISOString(),
                    user: currentUser
                };
            }

            setCommentsList(prev => [...prev, newComment]);
            setCommentText('');
        } catch (error: any) {
            console.error("Failed to post comment:", error);
            onError?.(error.message || "Failed to submit comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fullName = post.user ? `${post.user.firstName} ${post.user.lastName}` : "User";
    const username = post.user?.username ? `@${post.user.username}` : "@user";
    const firstInitial = post.user?.firstName ? post.user.firstName.charAt(0).toUpperCase() : "U";

    const hasMedia = (post.images && post.images.length > 0) || (post.videos && post.videos.length > 0);

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Media (Images & Videos) - Optimized responsive sizing */}
                {hasMedia && (
                    <div className="w-full md:w-1/2 bg-black flex flex-col justify-center items-center overflow-y-auto max-h-[45vh] md:max-h-[90vh] p-2 sm:p-4 gap-4 shrink-0">
                        {post.images && post.images.map((imgUrl, index) => (
                            <img 
                                key={`post-image-${index}`} 
                                src={imgUrl} 
                                alt={`Post attachment ${index + 1}`} 
                                className="w-full h-auto max-h-[40vh] md:max-h-[70vh] object-contain rounded-lg bg-black" 
                            />
                        ))}

                        {post.videos && post.videos.map((vidUrl, index) => (
                            <video 
                                key={`post-video-${index}`} 
                                src={vidUrl} 
                                controls 
                                preload="metadata"
                                className="w-full h-auto max-h-[40vh] md:max-h-[70vh] object-contain rounded-lg bg-black shadow-md" 
                            />
                        ))}
                    </div>
                )}

                {/* Right Side: Structured Layout (Fixed Header/Footer, Unified Scrollable Middle) */}
                <div className={`flex flex-col h-full bg-white ${!hasMedia ? 'w-full' : 'w-full md:w-1/2'} max-h-[55vh] md:max-h-[90vh]`}>
                    
                    {/* 1. Fixed Header: Author Info */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white z-10 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 overflow-hidden uppercase">
                            {firstInitial}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm capitalize">{fullName}</h3>
                            <p className="text-xs text-gray-500">{username}</p>
                        </div>
                    </div>

                    {/* 2. Scrollable Body: Caption & Comments */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <p className="text-gray-800 text-sm leading-relaxed">
                            {post.content}
                        </p>

                        <hr className="border-gray-100" />

                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Comments ({commentsList.length})
                            </h4>

                            <div className="space-y-3">
                                {commentsList.length > 0 ? (
                                    commentsList.map((comment, index) => {
                                        const cUserFirst = comment.user?.firstName || comment.user?.username || "User";
                                        const cUserLast = comment.user?.lastName || "";
                                        return (
                                            <div key={comment.id || index} className="flex items-start gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                                    {cUserFirst.charAt(0)}
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-xs text-gray-900 capitalize">
                                                            {cUserFirst} {cUserLast}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-xs leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-6">No comments yet. Be the first to comment!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Fixed Footer: Actions & Comment Input Box */}
                    <div className="p-4 border-t border-gray-100 bg-white z-10 shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleLikeToggle}
                                    className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                    <span className="text-sm font-medium">{likeCount}</span>
                                </button>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">{commentsList.length}</span>
                                </div>
                            </div>
                            <button className="text-gray-600 hover:text-[#7A5AF8] transition-colors cursor-pointer">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent disabled:bg-gray-100"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !commentText.trim()}
                                className="p-2 bg-[#7A5AF8] text-white rounded-lg hover:bg-[#6948d3] transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}