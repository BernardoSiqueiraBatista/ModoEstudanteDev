interface CurrentTimeMarkerProps {
  time: string;
}

export default function CurrentTimeMarker({ time }: CurrentTimeMarkerProps) {
  return (
    <div className="relative my-8 mb-16">
      <div className="absolute -left-24 -top-3 text-body-sm font-bold text-primary">{time}</div>
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t-2 border-primary border-dashed"></div>
        <span className="text-caption-bold text-primary uppercase tracking-[0.2em]">Agora</span>
      </div>
    </div>
  );
}
