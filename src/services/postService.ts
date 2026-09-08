import { apiRequest } from "@/src/lib/api";

export async function fetchPosts() {
  const data = await apiRequest("/post/all");
  return data.posts || data;
}

export async function fetchUserPosts(userId?: string) {
  const endpoint = userId ? `/post/user/posts/${userId}` : "/post/user/posts";
  const data = await apiRequest(endpoint);
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

export async function updatePost(postId: string | number, postData: any) {
  return await apiRequest(`/post/${postId}`, {
    method: "PUT",
    body: postData instanceof FormData ? postData : JSON.stringify(postData),
  });
}

export async function deletePost(postId: string | number) {
  return await apiRequest(`/post/${postId}`, {
    method: "DELETE",
  });
}