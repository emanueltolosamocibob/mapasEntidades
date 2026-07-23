function EventCapacityTag({
  acceptedCount,
  totalCapacity,
}: {
  acceptedCount: number;
  totalCapacity: number | null;
}) {
  return (
    <span className="inline-block border border-foreground/60 bg-background/80 px-2 py-0.5 text-[10px] tracking-[0.15em] text-foreground uppercase">
      {totalCapacity !== null ? `${acceptedCount}/${totalCapacity}` : `${acceptedCount} inscriptos`}
    </span>
  );
}

export default EventCapacityTag;
