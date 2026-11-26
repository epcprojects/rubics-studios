import { useSyncExternalStore } from "react";

export type ToastTone = "ok" | "warn" | "bad" | "pro";
export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export function toast(message: string, tone: ToastTone = "ok") {
  const id = nextId++;
  items = [...items, { id, message, tone }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => EMPTY,
  );
}
