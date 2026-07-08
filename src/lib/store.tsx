"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "./types";
import { createSeedState } from "./seed";

const STORAGE_KEY = "tsuzuki:v1";

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // 破損データは捨てて作り直す
  }
  return createSeedState();
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量超過などは黙殺(次回保存で回復を試みる)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    // localStorage はクライアントでしか読めないため、
    // SSR とのハイドレーション不一致を避けてマウント後に読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
  }, []);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = createSeedState();
    persist(fresh);
    setState(fresh);
  }, []);

  if (!state) {
    // localStorage 読み込み前の一瞬。レイアウトシフトを避けるため無地を返す
    return <div className="min-h-dvh bg-paper" />;
  }

  return (
    <StoreContext.Provider value={{ state, update, reset }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}
