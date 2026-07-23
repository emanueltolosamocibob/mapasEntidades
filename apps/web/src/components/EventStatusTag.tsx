import { EVENT_STATUS_LABELS, type EventStatus } from "../lib/eventStatus";

const STATUS_CLASSNAMES: Record<EventStatus, string> = {
  open: "border-green-500/60 bg-green-500/10 text-green-400",
  full: "border-primary/60 bg-primary/10 text-primary",
  in_progress: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  finished: "border-border bg-muted/40 text-muted-foreground",
};

function EventStatusTag({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase ${STATUS_CLASSNAMES[status]}`}
    >
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}

export default EventStatusTag;
