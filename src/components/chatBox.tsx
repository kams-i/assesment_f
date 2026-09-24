'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchConversation } from '../lib/messageApi';
import { Send } from 'lucide-react';

interface Message {
    id?: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt?: string;
    sender?: { username: string; firstName: string; lastName: string };
}

interface ChatBoxProps {
    currentUserId: number;
    recipientId: number;
    token: string;
}

export default function ChatBox({ currentUserId, recipientId, token }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll to bottom when messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Load initial conversation history via HTTP
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await fetchConversation(recipientId, token);
                setMessages(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        if (recipientId && token) {
            loadMessages();
        }
    }, [recipientId, token]);

    // 2. Initialize Socket.io connection & scoped listeners
    useEffect(() => {
        const socketInstance = io('https://assesment-b.onrender.com', {
            withCredentials: true
        });

        socketInstance.on('connect', () => {
            console.log('Connected to socket server:', socketInstance.id);
            socketInstance.emit('register', currentUserId);
        });

        socketInstance.on('receive_message', (message: Message) => {
            setMessages((prev) => {
                if (message.id && prev.some((m) => m.id === message.id)) return prev;

                const isForThisChat =
                    (message.senderId === recipientId && message.receiverId === currentUserId) ||
                    (message.senderId === currentUserId && message.receiverId === recipientId);

                return isForThisChat ? [...prev, message] : prev;
            });
        });

        socketInstance.on('message_sent', (message: Message) => {
            setMessages((prev) => {
                if (message.id && prev.some((m) => m.id === message.id)) return prev;

                const isForThisChat =
                    (message.senderId === recipientId && message.receiverId === currentUserId) ||
                    (message.senderId === currentUserId && message.receiverId === recipientId);

                return isForThisChat ? [...prev, message] : prev;
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [currentUserId, recipientId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        const payload = {
            senderId: currentUserId,
            receiverId: recipientId,
            content: input
        };

        socket.emit('send_message', payload);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden">
            {/* Messages Area - min-h-0 enables proper flex child scrolling on mobile */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 md:p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-400 text-sm px-4 text-center">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id ?? idx}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] md:max-w-md text-sm leading-relaxed shadow-xs ${
                                        isMine
                                            ? 'bg-[#7A5AF8] text-white rounded-br-none'
                                            : 'bg-zinc-100 text-zinc-800 rounded-bl-none'
                                    }`}
                                >
                                    <p className="wrap-break-word">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={handleSendMessage}
                className="p-2.5 md:p-3 border-t border-zinc-200 bg-white flex items-center gap-2 shrink-0 w-full"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-zinc-200 rounded-xl px-3.5 py-3 md:py-2.5 text-base md:text-sm text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/30 focus:border-[#7A5AF8] transition-all"
                />
                <button
                    type="submit"
                    className="bg-[#7A5AF8] hover:bg-[#6944e8] active:scale-95 text-white p-3 md:p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Send message"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}