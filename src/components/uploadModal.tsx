"use client";

import React, { useState } from 'react';
import { X, Loader2, UploadCloud } from 'lucide-react';
import { apiRequest } from '@/src/lib/api';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: () => void;
    onOpenLogin: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess, onOpenLogin }: UploadModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const checkAuth = () => {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!token) {
            onClose();
            onOpenLogin();
            return false;
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        
        if (selectedFiles.length + filesArray.length > 10) {
            setErrorMessage("You can only upload a maximum of 10 files at once.");
            return;
        }

        setErrorMessage('');
        const newFiles = [...selectedFiles, ...filesArray];
        setSelectedFiles(newFiles);

        const newPreviews = filesArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkAuth()) return;
        
        if (!title.trim() || !content.trim()) {
            setErrorMessage("Both title and content are required fields.");
            return;
        }

        setErrorMessage('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());

            // Append files to their corresponding multer fields matching backend definition
            selectedFiles.forEach((file) => {
                if (file.type.startsWith('video')) {
                    formData.append('videos', file);
                } else {
                    formData.append('images', file);
                }
            });

            // Post directly to the backend endpoint: /posts/create
            await apiRequest('/post/create', {
                method: 'POST',
                body: formData, // Passing FormData automatically lets the browser handle multipart headers
            });

            setTitle('');
            setContent('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            onClose();

            if (onUploadSuccess) {
                onUploadSuccess();
            } else {
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Failed to create post:", error);
            // Prevent clearing token unless it's strictly a 401 Unauthorized error
            if (error.status === 401 || error.message?.includes('token') || error.message?.includes('Unauthorized')) {
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                onClose();
                onOpenLogin();
                return;
            }
            setErrorMessage(error.message || "Failed to publish post. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-full bg-zinc-100 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-5">
                    <h2 className="text-xl font-bold text-zinc-900">Create New Post</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Share what's on your mind with the Gidshare community.</p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Title</label>
                        <input
                            type="text"
                            placeholder="Give your post a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full p-3 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent bg-zinc-50/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Content</label>
                        <textarea
                            rows={3}
                            placeholder="What's happening?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="w-full p-3 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] focus:border-transparent resize-none bg-zinc-50/50"
                        />
                    </div>

                    {previewUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-zinc-50 rounded-xl border border-zinc-200">
                            {previewUrls.map((url, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                    {selectedFiles[index]?.type.startsWith('video') ? (
                                        <video src={url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={url} alt={`Upload preview ${index + 1}`} className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-2 border-dashed border-zinc-200 hover:border-[#7A5AF8] rounded-xl p-6 text-center transition-colors bg-zinc-50/50 cursor-pointer relative group">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-[#7A5AF8] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-zinc-800">Click to upload photos or videos</p>
                            <p className="text-[10px] text-zinc-400">PNG, JPG, GIF, MP4 up to 10 files</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !title.trim() || !content.trim()}
                        className="w-full py-3 bg-[#7A5AF8] text-white font-medium text-sm rounded-xl hover:bg-[#6948d3] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Publishing Post...
                            </>
                        ) : (
                            "Post"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}