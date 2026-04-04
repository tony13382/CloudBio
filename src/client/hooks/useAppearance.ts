import useSWR from "swr";
import { useRef, useCallback } from "react";
import { api } from "../api";

export type Appearance = {
  id: string;
  userId: string;
  theme: string | null;
  bgType: string | null;
  bgValue: string | null;
  buttonStyle: string | null;
  buttonColor: string | null;
  buttonTextColor: string | null;
  fontFamily: string | null;
  textColor: string | null;
  profileStyle: string | null;
  bgBlur: boolean | null;
  customCss: string | null;
  updatedAt: string | null;
};

export type AppearanceUpdate = {
  theme?: string;
  bgType?: string;
  bgValue?: string;
  buttonStyle?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  textColor?: string;
  profileStyle?: string;
  bgBlur?: boolean;
};

export function useAppearance() {
  const { data, error, isLoading, mutate } = useSWR<{ appearance: Appearance | null }>(
    "/appearance",
    (url: string) => api.get<{ appearance: Appearance | null }>(url)
  );

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateAppearance = useCallback(
    async (update: AppearanceUpdate) => {
      // Optimistic update
      mutate(
        (current) => ({
          appearance: current?.appearance
            ? { ...current.appearance, ...update }
            : null,
        }),
        false
      );

      // Debounced save
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await api.put("/appearance", update);
        void mutate(undefined);
      }, 500);
    },
    [mutate]
  );

  return {
    appearance: data?.appearance ?? null,
    isLoading,
    isError: !!error,
    updateAppearance,
  };
}
