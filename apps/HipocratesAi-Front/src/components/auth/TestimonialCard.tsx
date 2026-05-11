
interface TestimonialCardProps {
  name: string;
  role: string;
  quote: string;
  avatar: string;
  position?: 'top-right' | 'bottom-left';
}

export default function TestimonialCard({
  name,
  role,
  quote,
  avatar,
  position = 'top-right',
}: TestimonialCardProps) {
  const positionClasses = {
    'top-right': 'absolute top-[18%] right-[15%]',
    'bottom-left': 'absolute bottom-[25%] left-[12%]',
  };

  return (
    <div
      className={`w-[320px] bubble-glass-light rounded-3xl p-8 z-0 ${positionClasses[position]}`}
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <img
            alt={name}
            className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
            src={avatar}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <h4 className="text-navy-deep font-bold text-xs tracking-tight">{name}</h4>
          <p className="text-slate-400 text-[9px] uppercase tracking-[0.15em] font-bold">{role}</p>
        </div>
      </div>
      <p className="text-slate-600 text-sm italic font-light leading-relaxed">"{quote}"</p>
    </div>
  );
}
