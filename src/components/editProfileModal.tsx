"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/src/lib/api';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any;
    onProfileUpdated: (updatedProfile: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }: EditProfileModalProps) {
    const [firstName, setFirstName] = useState(profile?.firstName || profile?.name || '');
    const [lastName, setLastName] = useState(profile?.lastName || '');
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userId = profile?.id || profile?._id;
            const response = await apiRequest(`/user/update/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ firstName, lastName, username, bio }),
            });

            const updated = response.user || response.data || response;
            onProfileUpdated(updated);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 relative shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-black">Edit Profile</h2>
                    <button onClick={onClose} className="p-1 text-black hover:text-gray-600 rounded-full cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7A5AF8] resize-none"
                            placeholder="Tell the world a bit about yourself..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-black hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#7A5AF8] text-white rounded-lg text-sm font-medium hover:bg-[#6944e0] disabled:opacity-50 cursor-pointer"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}