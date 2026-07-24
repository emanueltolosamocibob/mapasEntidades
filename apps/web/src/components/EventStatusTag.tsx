import { EVENT_STATUS_LABELS, type EventStatus } from "../lib/eventStatus";

const STATUS_CLASSNAMES: Record<EventStatus, string> = {
  open: "border-green-500 bg-green-500 text-green-950",
  full: "border-primary bg-primary text-primary-foreground",
  in_progress: "border-blue-500 bg-blue-500 text-blue-950",
  finished: "border-muted-foreground bg-muted-foreground text-background",
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
