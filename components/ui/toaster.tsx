"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ToastVariant = "default" | "success" | "destructive";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (t: Omit<ToastItem, "id">) => {
        if (typeof window !== "undefined") {
          console.log("[toast]", t);
        }
      },
    };
  }
  return ctx;
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);

  React.useEffect(() => {
    (window as unknown as { __toast?: (t: Omit<ToastItem, "id">) => void }).__toast = toast;
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitives.Provider swipeDirection="right" duration={4500}>
        {toasts.map((t) => (
          <ToastPrimitives.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className={cn(
              "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-in",
              "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 pr-10 shadow-elevated",
              t.variant === "success" && "border-success/40",
              t.variant === "destructive" && "border-destructive/40",
            )}
          >
            <div className="flex-1">
              <ToastPrimitives.Title className="text-sm font-semibold text-foreground">
                {t.title}
              </ToastPrimitives.Title>
              {t.description && (
                <ToastPrimitives.Description className="mt-1 text-sm text-muted-foreground">
                  {t.description}
                </ToastPrimitives.Description>
              )}
            </div>
            <ToastPrimitives.Close className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        ))}
        <ToastPrimitives.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-2 outline-none sm:bottom-6 sm:right-6" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

/**
 * Helper fora do React tree: `toast({...})`
 */
export function toast(t: Omit<ToastItem, "id">) {
  if (typeof window !== "undefined") {
    const fn = (window as unknown as { __toast?: (t: Omit<ToastItem, "id">) => void }).__toast;
    fn?.(t);
  }
}
