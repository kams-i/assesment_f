"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/src/services/postService";
import { getToken } from "@/src/lib/api";
import SidePanel from "@/src/components/sidePanel";
import LoginModal from "@/src/components/loginModal";
import SignUpModal from "@/src/components/signUpModal";
import PostModal from "@/src/components/postModal";
import { LogIn } from "lucide-react";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    if (selectedPost || isLoginOpen || isSignUpOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedPost, isLoginOpen, isSignUpOpen]);

  const handleOpenLogin = () => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  };

  const handleOpenSignUp = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-white relative">
      {/* Mobile-only Top Navbar */}
      <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 z-40 flex items-center justify-between shadow-sm">
        <img src="/Frame 48095411.png" alt="Logo" className="w-35 h-auto" />
        {!isLoggedIn && (
          <button
            onClick={handleOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors shadow-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        )}
      </div>

      {/* Fixed Top-Right Login Button for Desktop (Hidden if logged in) */}
      {!isLoggedIn && (
        <div className="hidden md:flex fixed top-4 right-6 z-40">
          <button
            onClick={handleOpenLogin}
            className="flex items-center font-medium gap-3 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-[#7A5AF8] hover:text-white hover:border-transparent transition-colors group shadow-sm cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            Login
          </button>
        </div>
      )}

      {/* The Fixed Side Panel */}
      <SidePanel onOpenLogin={handleOpenLogin} />

      {/* Main Content Area */}
      <section className="flex-1 p-4 md:p-8 md:ml-64 bg-gray-50 pt-20 md:pt-8 flex flex-col items-center">
        {/* Posts Feed Container */}
        <div className="w-full max-w-2xl space-y-6 pb-20 md:pb-6 mt-4 md:mt-2">
          {isLoading ? (
            /* Skeleton Loading Placeholders maintaining structure */
            <>
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3.5 bg-gray-100 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-3.5 bg-gray-100 rounded animate-pulse" />
                    <div className="w-3/4 h-3.5 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 animate-pulse" />
                  <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                    <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-600 shadow-sm">
              Failed to load posts. Please check if your backend server is running on port 8000.
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post: any) => (
              <div
                key={post.id || post._id}
                onClick={() => setSelectedPost(post)}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 overflow-hidden uppercase">
                    {post.user?.firstName ? post.user.firstName.charAt(0) : "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm capitalize">
                      {post.user ? `${post.user.firstName} ${post.user.lastName}` : "User"}
                    </h3>
                    <p className="text-xs text-gray-500">@{post.user?.username || "user"}</p>
                  </div>
                </div>

                <p className="text-gray-800 text-sm mb-3 leading-relaxed">
                  {post.content}
                </p>

                {post.images && post.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden max-h-87.5 bg-black flex items-center justify-center">
                    <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-6 text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span>❤️ {post.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
              No posts available yet.
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          if (getToken()) {
            setIsLoggedIn(true);
            window.location.reload();
          }
        }}
        onSwitchToSignUp={handleOpenSignUp}
      />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => {
          setIsSignUpOpen(false);
          if (getToken()) {
            setIsLoggedIn(true);
            window.location.reload();
          }
        }}
        onSwitchToLogin={handleOpenLogin}
      />
      <PostModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onOpenLogin={handleOpenLogin}
        post={selectedPost}
      />
    </main>
  );
}