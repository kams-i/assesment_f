"use client";

import React, { useEffect, useState } from 'react';
import { Compass, Upload, Users, User, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/src/lib/api';

interface SidePanelProps {
    onOpenLogin: () => void;
}

export default function SidePanel({ onOpenLogin }: SidePanelProps) {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = getToken();
        setIsLoggedIn(!!token);
    }, []);

    const handleProfileClick = () => {
        const token = getToken();
        if (!token) {
            onOpenLogin();
        } else {
            router.push("/profile");
        }
    };

    return (
        <aside className="fixed inset-x-0 bottom-0 top-auto z-40 bg-white border-t border-gray-200 shadow-sm p-2 md:fixed md:inset-y-0 md:left-0 md:w-64 md:h-screen md:border-r md:border-t-0 md:pt-7 md:flex md:flex-col md:p-4 md:shadow-sm">
            {/* Panel Header (Hidden on mobile, visible on desktop) */}
            <div className="hidden md:block">
                <img src="/Frame 48095411.png" alt="Logo" className="w-40 pt-4 pb-12 h-auto" />
            </div>

            {/* Navigation Buttons: Row on mobile bottom bar, Column on desktop sidebar */}
            <div className="flex md:flex-col flex-row items-center md:items-stretch justify-around md:justify-start gap-1 md:gap-2">
                <button
                    onClick={() => router.push("/")}
                    className="flex flex-col md:flex-row items-center font-medium gap-1 md:gap-3 p-2 md:px-4 md:py-2.5 text-gray-700 rounded-lg hover:bg-[#7A5AF8] hover:text-white transition-colors text-left group cursor-pointer"
                >
                    <Compass className="w-6 h-6 md:w-5 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
                    <span className="hidden md:inline text-base">Explore</span>
                </button>
                <button
                    className="flex flex-col md:flex-row items-center font-medium gap-1 md:gap-3 p-2 md:px-4 md:py-2.5 text-gray-700 rounded-lg hover:bg-[#7A5AF8] hover:text-white transition-colors text-left group cursor-pointer"
                >
                    <Upload className="w-6 h-6 md:w-5 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
                    <span className="hidden md:inline text-base">Upload</span>
                </button>
                <button
                    className="flex flex-col md:flex-row items-center font-medium gap-1 md:gap-3 p-2 md:px-4 md:py-2.5 text-gray-700 rounded-lg hover:bg-[#7A5AF8] hover:text-white transition-colors text-left group cursor-pointer"
                >
                    <Users className="w-6 h-6 md:w-5 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
                    <span className="hidden md:inline text-base">Following</span>
                </button>
                <button
                    onClick={handleProfileClick}
                    className="flex flex-col md:flex-row items-center font-medium gap-1 md:gap-3 p-2 md:px-4 md:py-2.5 text-gray-700 rounded-lg hover:bg-[#7A5AF8] hover:text-white transition-colors text-left group cursor-pointer"
                >
                    <User className="w-6 h-6 md:w-5 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
                    <span className="hidden md:inline text-base">Profile</span>
                </button>
                {!isLoggedIn && (
                    <button
                        onClick={onOpenLogin}
                        className="flex flex-col md:flex-row items-center font-medium gap-1 md:gap-3 p-2 md:px-4 md:py-2.5 text-gray-700 rounded-lg hover:bg-[#7A5AF8] hover:text-white transition-colors text-left group cursor-pointer"
                    >
                        <LogIn className="w-6 h-6 md:w-5 md:h-5 text-gray-500 group-hover:text-white transition-colors" />
                        <span className="hidden md:inline text-base">Login</span>
                    </button>
                )}
            </div>
        </aside>
    );
}