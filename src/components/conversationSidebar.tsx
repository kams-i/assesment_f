'use client';

import React from 'react';

interface UserContact {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface SidebarProps {
    contacts: UserContact[];
    selectedUserId: number | null;
    onSelectUser: (user: UserContact) => void;
}

export default function ConversationSidebar({ contacts, selectedUserId, onSelectUser }: SidebarProps) {
    if (contacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-zinc-400">
                <p className="text-sm font-medium text-zinc-600">No conversations yet</p>
                <p className="text-xs text-zinc-400 mt-1">Start messaging someone to see them here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white divide-y divide-zinc-100">
            {contacts.map((user) => {
                const isSelected = selectedUserId === user.id;
                const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

                return (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        className={`p-3.5 cursor-pointer transition-all hover:bg-zinc-50 flex items-center gap-3 ${
                            isSelected
                                ? 'bg-[#7A5AF8]/10 border-l-4 border-[#7A5AF8]'
                                : 'border-l-4 border-transparent'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-white text-xs shrink-0 shadow-xs">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm text-zinc-900 truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}