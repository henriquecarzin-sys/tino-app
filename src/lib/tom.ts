import type { TinoTom, TomConfig } from "../types";

export const TOM_CONFIG: Record<TinoTom, TomConfig> = {
  urgente: {
    label: "Urgente",
    accent: "text-coral",
    bg: "bg-coral-dim",
    dot: "bg-coral",
  },
  cobranca_leve: {
    label: "Cobrança leve",
    accent: "text-amber",
    bg: "bg-amber-dim",
    dot: "bg-amber",
  },
  informativo: {
    label: "Informativo",
    accent: "text-teal",
    bg: "bg-teal-dim",
    dot: "bg-teal",
  },
  ideia: {
    label: "Ideia",
    accent: "text-indigo",
    bg: "bg-indigo-dim",
    dot: "bg-indigo",
  },
};
