
interface SecurityFooterProps {
  items?: Array<{ icon: string; label: string }>;
}

const defaultItems = [
  { icon: 'auto_awesome', label: 'IA Clínica Ativa' },
  { icon: 'verified_user', label: 'Protocolo HIPAA' },
];

export default function SecurityFooter({ items = defaultItems }: SecurityFooterProps) {
  return (
    <div className="mt-6 flex gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-slate-600">
          <span className="material-symbols-outlined text-base">{item.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
