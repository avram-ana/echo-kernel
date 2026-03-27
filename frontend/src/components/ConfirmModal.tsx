import type { ReactNode } from "react";

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
  danger,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl glass-strong p-6 shadow-xl">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
          {title}
        </h3>
        {children && <div className="mt-2 text-sm text-slate-700/90">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-800 hover:bg-white/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow ${
              danger
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
