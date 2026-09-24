'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationSidebar from '@/src/components/conversationSidebar';
import ChatBox from '@/src/components/chatBox';
import SidePanel from '@/src/components/sidePanel';
import LoginModal from '@/src/components/loginModal';
import SignUpModal from '@/src/components/signUpModal';
import { getToken } from '@/src/lib/api';
import { LogIn, ArrowLeft, MessageSquare } from 'lucide-react';

interface UserContact {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

// 1. Inner component that safely uses useSearchParams
function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');

    const [contacts, setContacts] = useState<UserContact[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserContact | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        const storedToken = getToken();
        setIsLoggedIn(!!storedToken);
        setToken(storedToken);
        if (!storedToken) {
            setIsLoginOpen(true);
        }
    }, []);

    useEffect(() => {
        if (!token) return;
        const fetchMe = async () => {
            try {
                const res = await fetch('https://assesment-b.onrender.com/api/v4/user/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUserId(data.id || data.data?.id);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };
        fetchMe();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const fetchContacts = async () => {
            try {
                const res = await fetch('https://assesment-b.onrender.com/api/v4/message/contacts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const fetchedContacts: UserContact[] = data.data || [];
                setContacts(fetchedContacts);

                if (targetUserId) {
                    const existingContact = fetchedContacts.find(
                        (c) => String(c.id) === String(targetUserId)
                    );
                    
                    if (existingContact) {
                        setSelectedUser(existingContact);
                    } else {
                        try {
                            const userRes = await fetch(`https://assesment-b.onrender.com/api/v4/user/one/${targetUserId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (userRes.ok) {
                                const userData = await userRes.json();
                                const u = userData.user || userData.data || userData;
                                if (u) {
                                    setSelectedUser({
                                        id: u.id || u._id,
                                        username: u.username,
                                        firstName: u.firstName,
                                        lastName: u.lastName,
                                        email: u.email
                                    });
                                }
                            }
                        } catch (err) {
                            console.error('Failed to load target user details for chat:', err);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching contacts:', err);
            }
        };
        fetchContacts();
    }, [token, targetUserId]);

    const handleOpenLogin = () => {
        setIsSignUpOpen(false);
        setIsLoginOpen(true);
    };

    const handleOpenSignUp = () => {
        setIsLoginOpen(false);
        setIsSignUpOpen(true);
    };

    const handleAuthSuccess = () => {
        const newToken = getToken();
        setIsLoggedIn(true);
        setToken(newToken);
        setIsLoginOpen(false);
        setIsSignUpOpen(false);
    };

    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-zinc-50 relative">
            {/* Mobile-only Top Navbar */}
            <div className="md:hidden w-full bg-white border-b border-zinc-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
                <img src="/Frame 48095411.png" alt="Logo" className="w-32 h-auto" />
                {!isLoggedIn && (
                    <button
                        onClick={handleOpenLogin}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors shadow-sm cursor-pointer"
                    >
                        <LogIn className="w-4 h-4" />
                        Login
                    </button>
                )}
            </div>

            {!isLoggedIn && (
                <div className="hidden md:flex fixed top-4 right-6 z-40">
                    <button
                        onClick={handleOpenLogin}
                        className="flex items-center font-medium gap-3 px-4 py-2.5 text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors group shadow-sm cursor-pointer"
                    >
                        <LogIn className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                        Login
                    </button>
                </div>
            )}

            <SidePanel onOpenLogin={handleOpenLogin} />

            <section className="flex-1 p-0 md:p-6 md:ml-64 bg-zinc-50 pt-16 pb-16 md:pb-0 md:pt-4 flex flex-col items-center">
                <div className="w-full max-w-5xl flex bg-white border-y md:border border-zinc-200 md:rounded-2xl shadow-sm overflow-hidden h-[calc(100dvh-8.5rem)] md:h-[calc(100vh-2.5rem)]">
                    
                    <div className={`w-full md:w-80 border-r border-zinc-200 flex-col shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                        <div className="flex-1 overflow-y-auto">
                            <ConversationSidebar
                                contacts={contacts}
                                selectedUserId={selectedUser?.id ?? null}
                                onSelectUser={(user) => {
                                    setSelectedUser(user);
                                    router.replace(`/messages?userId=${user.id}`, { scroll: false });
                                }}
                            />
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                        {selectedUser && token && currentUserId ? (
                            <>
                                <div className="md:hidden flex items-center gap-2 p-3 border-b border-zinc-200 bg-white">
                                    <button
                                        onClick={() => {
                                            setSelectedUser(null);
                                            router.replace('/messages', { scroll: false });
                                        }}
                                        className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                                        aria-label="Back to messages"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs uppercase">
                                            {selectedUser.firstName?.charAt(0)}
                                        </div>
                                        <span className="font-semibold text-sm text-zinc-900">
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </span>
                                    </div>
                                </div>

                                <ChatBox
                                    currentUserId={currentUserId}
                                    recipientId={selectedUser.id}
                                    token={token}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-zinc-700">Your Messages</p>
                                <p className="text-xs text-zinc-400 mt-1">Select a conversation from the sidebar to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => {
                    setIsLoginOpen(false);
                    if (getToken()) {
                        handleAuthSuccess();
                    }
                }}
                onSwitchToSignUp={handleOpenLogin}
            />
            <SignUpModal
                isOpen={isSignUpOpen}
                onClose={() => {
                    setIsSignUpOpen(false);
                    if (getToken()) {
                        handleAuthSuccess();
                    }
                }}
                onSwitchToLogin={handleOpenLogin}
            />
        </main>
    );
}

// 2. Default exported Page wrapper wrapped in Suspense to satisfy Next.js requirements
export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}