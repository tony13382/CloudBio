import useSWR from "swr";
import { api } from "../api";

export type Page = {
  id: string;
  userId: string;
  slug: string;
  title: string | null;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export function usePages() {
  const { data, error, isLoading, mutate } = useSWR<{ pages: Page[] }>(
    "/pages",
    (url: string) => api.get<{ pages: Page[] }>(url)
  );

  const createPage = async (slug: string, title: string | null) => {
    const res = await api.post<{ page: Page }>("/pages", { slug, title });
    await mutate();
    return res.page;
  };

  const updatePage = async (
    id: string,
    payload: { slug?: string; title?: string | null; sortOrder?: number }
  ) => {
    const res = await api.patch<{ page: Page }>(`/pages/${id}`, payload);
    await mutate();
    return res.page;
  };

  const deletePage = async (id: string) => {
    await api.delete(`/pages/${id}`);
    await mutate();
  };

  const pages = data?.pages ?? [];
  const defaultPage = pages.find((p) => p.isDefault) ?? null;
  const subPages = pages.filter((p) => !p.isDefault);

  return {
    pages,
    defaultPage,
    subPages,
    isLoading,
    isError: !!error,
    mutate,
    createPage,
    updatePage,
    deletePage,
  };
}
