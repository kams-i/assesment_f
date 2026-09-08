"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPosts } from "@/src/services/postService";
import { getToken } from "@/src/lib/api";
import SidePanel from "@/src/components/sidePanel";
import LoginModal from "@/src/components/loginModal";
import SignUpModal from "@/src/components/signUpModal";
import PostModal from "@/src/components/postModal";
import { LogIn, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

export default function Home() {
  const queryClient = useQueryClient();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  // Always fetch all public posts regardless of login status to serve as the global explorer feed
  const { data: rawPosts, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      return await fetchPosts();
    },
  });

  // Safely normalize posts into an array regardless of API response structure
  const posts: any[] = Array.isArray(rawPosts) 
    ? rawPosts 
    : (rawPosts as any)?.posts || (rawPosts as any)?.data || [];

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

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginOpen(false);
    setIsSignUpOpen(false);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-zinc-50 relative">
      {/* Global Error Toast Notification if triggered */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm animate-bounce">
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage(null)}
            className="font-bold text-lg leading-none hover:text-gray-200 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

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

      {/* Fixed Top-Right Login Button for Desktop (Hidden if logged in) */}
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

      {/* The Fixed Side Panel */}
      <SidePanel onOpenLogin={handleOpenLogin} />

      {/* Main Content Area */}
      <section className="flex-1 p-0 md:p-8 md:ml-64 bg-zinc-50 pt-16 md:pt-8 flex flex-col items-center">
        {/* Posts Feed Container - Optimized with zero side gaps on mobile for full TikTok/IG width card feel */}
        <div className="w-full max-w-xl space-y-3 md:space-y-6 pb-20 md:pb-6 mt-0 md:mt-2">
          {isLoading ? (
            /* Skeleton Loading Placeholders maintaining structure */
            <>
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border-y md:border border-zinc-200 md:rounded-xl p-4 md:p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3.5 bg-zinc-100 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-zinc-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-3.5 bg-zinc-100 rounded animate-pulse" />
                    <div className="w-3/4 h-3.5 bg-zinc-100 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-72 md:h-80 bg-zinc-100 rounded-none md:rounded-lg mb-4 animate-pulse -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full" />
                  <div className="flex items-center gap-6 pt-2 border-t border-zinc-100">
                    <div className="w-12 h-4 bg-zinc-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-600 shadow-sm mx-4 md:mx-0">
              Failed to load posts feed. Please check your network connection or server status.
            </div>
          ) : posts.length > 0 ? (
            posts.map((post: any) => {
              const firstName = post.user?.firstName || "User";
              const lastName = post.user?.lastName || "";
              const username = post.user?.username || "user";
              const firstInitial = firstName.charAt(0).toUpperCase();

              return (
                <article
                  key={post.id || post._id}
                  className="bg-white border-y md:border border-zinc-200 md:rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-3.5 md:p-4 pb-3">
                    <div 
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs md:text-sm overflow-hidden uppercase shadow-sm">
                        {firstInitial}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 text-xs md:text-sm capitalize group-hover:text-[#7A5AF8] transition-colors">
                          {firstName} {lastName}
                        </h3>
                        <p className="text-[11px] md:text-xs text-zinc-500">@{username}</p>
                      </div>
                    </div>
                    <button className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full cursor-pointer">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Post Caption */}
                  {post.content && (
                    <div 
                      onClick={() => setSelectedPost(post)}
                      className="px-3.5 md:px-4 pb-3 cursor-pointer"
                    >
                      <p className="text-zinc-800 text-xs md:text-sm leading-relaxed break-words">
                        {post.content}
                      </p>
                    </div>
                  )}

                  {/* Post Media (Edge-to-edge on mobile like TikTok/Instagram feeds) */}
                  {post.images && post.images.length > 0 && (
                    <div 
                      onClick={() => setSelectedPost(post)}
                      className="bg-black flex items-center justify-center max-h-[450px] md:max-h-[500px] overflow-hidden cursor-pointer"
                    >
                      <img 
                        src={post.images[0]} 
                        alt="Post media" 
                        className="w-full h-full object-cover max-h-[450px] md:max-h-[500px]" 
                      />
                    </div>
                  )}

                  {/* Post Action Footer (TikTok/Instagram Style Bar) */}
                  <div className="p-3.5 md:p-4 pt-3 border-t border-zinc-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <button 
                          onClick={() => setSelectedPost(post)}
                          className="flex items-center gap-1.5 text-zinc-800 hover:text-red-500 transition-transform active:scale-125 cursor-pointer"
                        >
                          <Heart className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button 
                          onClick={() => setSelectedPost(post)}
                          className="flex items-center gap-1.5 text-zinc-800 hover:text-zinc-600 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 -scale-x-100" />
                          <span className="text-xs md:text-sm font-medium">{post.comments?.length || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-zinc-800 hover:text-zinc-600 transition-colors cursor-pointer">
                          <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500 shadow-sm mx-4 md:mx-0">
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
            handleAuthSuccess();
          }
        }}
        onSwitchToSignUp={handleOpenSignUp}
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
      <PostModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onOpenLogin={handleOpenLogin}
        post={selectedPost}
        onError={(msg: string) => setErrorMessage(msg)}
      />
    </main>
  );
}