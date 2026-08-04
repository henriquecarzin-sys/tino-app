import { useEffect, useRef, useState } from "react";
import { Fingerprint, X, Trash2 } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface SettingsSheetProps {
  open: boolean;
  identityId: string;
  identityLabel: string;
  description: string;
  cardCount: number;
  onClose: () => void;
  onClearCards: () => void;
}

export function SettingsSheet({
  open,
  identityId,
  identityLabel,
  description,
  cardCount,
  onClose,
  onClearCards,
}: SettingsSheetProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const confirmTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setConfirmingClear(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current !== null) window.clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  if (!open) return null;

  const handleClearClick = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      confirmTimeoutRef.current = window.setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    if (confirmTimeoutRef.current !== null) window.clearTimeout(confirmTimeoutRef.current);
    onClearCards();
    setConfirmingClear(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
      />

      <div className="animate-card-enter relative w-full max-w-lg rounded-t-2xl border border-border-soft bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-dim">
              <Fingerprint className="h-4 w-4 text-indigo" />
            </span>
            <h2 className="font-display text-base font-semibold text-text-hi">Sua identidade</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-lo transition-colors hover:text-text-hi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-text-mid">{description}</p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-lo">
              {identityLabel}
            </p>
            <p className="truncate font-mono text-sm text-text-hi">{identityId || "gerando…"}</p>
          </div>
          <CopyButton text={identityId} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
          <p className="text-sm text-text-mid">Cartões salvos</p>
          <span className="font-mono text-sm text-text-hi">{cardCount}</span>
        </div>

        <button
          type="button"
          onClick={handleClearClick}
          className={[
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            confirmingClear
              ? "border-coral/40 bg-coral-dim text-coral-soft"
              : "border-border-soft text-text-lo hover:text-text-mid",
          ].join(" ")}
        >
          <Trash2 className="h-4 w-4" />
          {confirmingClear ? "Toque de novo pra confirmar" : "Limpar cartões salvos neste dispositivo"}
        </button>
      </div>
    </div>
  );
}
