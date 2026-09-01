import { apiRequest } from "@/src/lib/api";

export async function toggleLike(postId: string | number) {
  return await apiRequest(`/like/${postId}`, {
    method: "POST",
  });
}