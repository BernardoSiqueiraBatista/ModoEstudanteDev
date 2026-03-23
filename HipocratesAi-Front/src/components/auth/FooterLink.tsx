interface FooterLink {
  icon: string;
  text: string;
  href: string;
}

export default function FooterLinks() {
  const links: FooterLink[] = [
    { icon: 'help', text: 'Centro de Ajuda', href: '#' },
    { icon: 'privacy_tip', text: 'Política de Privacidade', href: '#' },
    { icon: 'description', text: 'Termos de Serviço', href: '#' },
  ];

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-subtitle text-body-xs font-medium">
      {links.map((link, index) => (
        <a key={index} className="text-primary-hover flex items-center gap-1" href={link.href}>
          <span className="material-icon text-sm">{link.icon}</span>
          {link.text}
        </a>
      ))}
    </div>
  );
}
