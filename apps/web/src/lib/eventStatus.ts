export type EventStatus = "open" | "full" | "in_progress" | "finished";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  open: "Abierto",
  full: "Lleno",
  in_progress: "En curso",
  finished: "Finalizado",
};

export function getEventStatus(event: {
  status: string;
  startedAt: string | null;
  hasOpenSlots: boolean;
}): EventStatus {
  if (event.status === "closed") return "finished";
  if (event.startedAt !== null) return "in_progress";
  return event.hasOpenSlots ? "open" : "full";
}
