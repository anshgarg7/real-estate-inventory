import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "./utils";

interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
}

interface ToastContextValue {
  show: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md border px-4 py-2 text-sm shadow-lg",
              t.variant === "success"
                ? "border-green-600/30 bg-green-600 text-white"
                : "border-destructive/30 bg-destructive text-destructive-foreground"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
