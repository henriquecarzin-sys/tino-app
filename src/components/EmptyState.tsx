import { AudioLines } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-soft px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <AudioLines className="h-5 w-5 text-text-lo" />
      </span>
      <p className="text-sm font-medium text-text-mid">Nenhum cartão ainda</p>
      <p className="max-w-[220px] text-xs text-text-lo">
        Grave um áudio e veja o TINO transformar ele em ação.
      </p>
    </div>
  );
}
