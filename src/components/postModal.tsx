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
        likes: string | number;
        user?: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
        comments?: Comment[];
    } | null;
}

export default function PostModal({ isOpen, onClose, onOpenLogin, post }: PostModalProps) {
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState<number>(Number(post?.likes || 0));
    const [commentsList, setCommentsList] = useState<Comment[]>(post?.comments || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (post) {
            setLikeCount(Number(post.likes || 0));
            setCommentsList(post.comments || []);
        }
    }, [post]);

    if (!isOpen || !post) return null;

    // Check if user is logged in and close post modal before opening login
    const checkAuth = () => {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!token) {
            onClose(); // Close the post modal so it doesn't overlap with the login modal
            onOpenLogin();
            return false;
        }
        return true;
    };

    const handleLikeToggle = async () => {
        if (!checkAuth()) return;

        try {
            if (isLiked) {
                setIsLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
            await apiRequest(`/like/${post.id}`, { method: 'POST' });
        } catch (error) {
            console.error("Failed to toggle like:", error);
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

            const newComment = response.comment || response || {
                id: Date.now(),
                content: commentText.trim(),
                createdAt: new Date().toISOString(),
                user: { firstName: "You", username: "you" }
            };

            setCommentsList(prev => [newComment, ...prev]);
            setCommentText('');
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fullName = post.user ? `${post.user.firstName} ${post.user.lastName}` : "User";
    const username = post.user?.username ? `@${post.user.username}` : "@user";
    const firstInitial = post.user?.firstName ? post.user.firstName.charAt(0).toUpperCase() : "U";

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Media */}
                {post.images && post.images.length > 0 && (
                    <div className="md:w-1/2 bg-black flex items-center justify-center overflow-hidden min-h-75 md:min-h-125">
                        <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Right Side: Details & Comments */}
                <div className={`flex flex-col justify-between flex-1 p-6 overflow-y-auto ${!post.images || post.images.length === 0 ? 'w-full' : 'md:w-1/2'}`}>
                    <div className="flex flex-col h-full">
                        {/* Author Info */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 overflow-hidden uppercase">
                                {firstInitial}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm capitalize">{fullName}</h3>
                                <p className="text-xs text-gray-500">{username}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-800 text-sm mb-4 leading-relaxed">
                            {post.content}
                        </p>

                        <hr className="border-gray-100 mb-4" />

                        {/* Comments Header */}
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Comments ({commentsList.length})
                        </h4>

                        {/* Comments List */}
                        <div className="space-y-3 mb-4 max-h-55 overflow-y-auto pr-2 flex-1">
                            {commentsList.length > 0 ? (
                                commentsList.map((comment, index) => {
                                    const cUserFirst = comment.user?.firstName || "User";
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

                    {/* Bottom Action Bar */}
                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center justify-between mb-4">
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

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent disabled:bg-gray-100"
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