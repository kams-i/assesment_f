import { apiRequest } from "@/src/lib/api";

export async function fetchPosts() {
  const data = await apiRequest("/post/all");
  // Automatically extract the posts array whether the backend wraps it or returns it directly
  return data.posts || data;
}

export async function fetchPostById(postId: string | number) {
  return await apiRequest(`/post/${postId}`);
}

export async function createPost(postData: any) {
  return await apiRequest("/post/create", {
    method: "POST",
    body: postData instanceof FormData ? postData : JSON.stringify(postData),
  });
}

export async function deletePost(postId: string | number) {
  return await apiRequest(`/post/${postId}`, {
    method: "DELETE",
  });
}