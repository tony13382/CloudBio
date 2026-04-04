import useSWR from "swr";
import { api } from "../api";

export type Link = {
  id: string;
  userId: string;
  title: string;
  url: string;
  icon: string | null;
  isActive: boolean | null;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export function useLinks() {
  const { data, error, isLoading, mutate } = useSWR<{ links: Link[] }>(
    "/links",
    (url: string) => api.get<{ links: Link[] }>(url)
  );

  const createLink = async (title: string, url: string) => {
    const res = await api.post<{ link: Link }>("/links", { title, url });
    await mutate();
    return res.link;
  };

  const updateLink = async (id: string, data: Partial<Pick<Link, "title" | "url" | "icon" | "isActive">>) => {
    const res = await api.patch<{ link: Link }>(`/links/${id}`, data);
    await mutate();
    return res.link;
  };

  const deleteLink = async (id: string) => {
    await api.delete(`/links/${id}`);
    await mutate();
  };

  const reorderLink = async (id: string, newSortOrder: number) => {
    await api.patch("/links/reorder", { id, newSortOrder });
  };

  return {
    links: data?.links ?? [],
    isLoading,
    isError: !!error,
    mutate,
    createLink,
    updateLink,
    deleteLink,
    reorderLink,
  };
}
