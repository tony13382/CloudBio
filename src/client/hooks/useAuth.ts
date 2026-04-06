import useSWR from "swr";
import { api } from "../api";

type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: string | null; // JSON string
  gaId: string | null;
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User | null }>(
    "/auth/me",
    async (url: string) => {
      try {
        return await api.get<{ user: User | null }>(url);
      } catch {
        return { user: null };
      }
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User }>("/auth/login", { email, password });
    await mutate({ user: res.user }, false);
    return res.user;
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post<{ user: User }>("/auth/register", { email, username, password });
    await mutate({ user: res.user }, false);
    return res.user;
  };

  const logout = async () => {
    await api.post("/auth/logout", {});
    await mutate({ user: null }, false);
  };

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    login,
    register,
    logout,
  };
}
