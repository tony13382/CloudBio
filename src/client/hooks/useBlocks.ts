import useSWR from "swr";
import { api } from "../api";
import type { BlockType } from "../../lib/block-types";

export type Block = {
  id: string;
  userId: string;
  pageId: string | null;
  type: BlockType;
  config: string; // JSON string from DB
  isActive: boolean | null;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export function parseConfig(block: Block): Record<string, unknown> {
  try {
    return JSON.parse(block.config);
  } catch {
    return {};
  }
}

/**
 * Fetch blocks for a specific page. When `pageId` is undefined the hook defers
 * the request (returns empty state) — callers should pass the resolved page id
 * once it's known (e.g. from usePages()).
 */
export function useBlocks(pageId: string | undefined) {
  const key = pageId ? `/blocks?pageId=${pageId}` : null;
  const { data, error, isLoading, mutate } = useSWR<{ blocks: Block[]; pageId: string }>(
    key,
    (url: string) => api.get<{ blocks: Block[]; pageId: string }>(url)
  );

  const createBlock = async (type: BlockType, config: Record<string, unknown>) => {
    if (!pageId) throw new Error("Page not ready");
    const res = await api.post<{ block: Block }>("/blocks", { pageId, type, config });
    await mutate();
    return res.block;
  };

  const updateBlock = async (
    id: string,
    data: { config?: Record<string, unknown>; isActive?: boolean }
  ) => {
    const res = await api.patch<{ block: Block }>(`/blocks/${id}`, data);
    await mutate();
    return res.block;
  };

  const deleteBlock = async (id: string) => {
    await api.delete(`/blocks/${id}`);
    await mutate();
  };

  const reorderBlock = async (id: string, newSortOrder: number) => {
    await api.patch("/blocks/reorder", { id, newSortOrder });
  };

  return {
    blocks: data?.blocks ?? [],
    isLoading: !!pageId && isLoading,
    isError: !!error,
    mutate,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlock,
  };
}
