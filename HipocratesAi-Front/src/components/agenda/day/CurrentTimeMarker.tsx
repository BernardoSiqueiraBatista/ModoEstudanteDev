import React from 'react';

interface CurrentTimeMarkerProps {
  time: string;
}

export default function CurrentTimeMarker({ time }: CurrentTimeMarkerProps) {
  return (
    <div className="relative my-8 mb-16">
      <div className="absolute -left-24 -top-2 text-body-sm font-bold text-primary">{time}</div>
      <div className="absolute left-[3rem] -translate-x-1/2 -top-1 size-3 rounded-full bg-primary ring-4 ring-primary/20 z-10 shadow-lg shadow-primary/40"></div>
      <div className="flex items-center gap-4">
        <div className="h-[2px] flex-1 bg-gradient-to-r from-primary to-transparent"></div>
        <span className="text-caption-bold text-primary uppercase tracking-[0.2em]">Agora</span>
      </div>
    </div>
  );
}
