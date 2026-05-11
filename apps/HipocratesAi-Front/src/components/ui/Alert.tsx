import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = cva('flex items-stretch w-full gap-2', {
  variants: {
    variant: {
      secondary: '',
      primary: '',
      destructive: '',
      success: '',
      info: '',
      mono: '',
      warning: '',
    },
    icon: {
      primary: '',
      destructive: '',
      success: '',
      info: '',
      warning: '',
    },
    appearance: {
      solid: '',
      outline: '',
      light: '',
      stroke: 'text-slate-900',
    },
    size: {
      lg: 'rounded-lg p-4 gap-3 text-base [&>[data-slot=alert-icon]>svg]:size-6 [&>[data-slot=alert-icon]]:mt-0.5 [&_[data-slot=alert-close]]:mt-1',
      md: 'rounded-lg p-3.5 gap-2.5 text-sm [&>[data-slot=alert-icon]>svg]:size-5 [&>[data-slot=alert-icon]]:mt-0 [&_[data-slot=alert-close]]:mt-0.5',
      sm: 'rounded-md px-3 py-2.5 gap-2 text-xs [&>[data-slot=alert-icon]>svg]:size-4 [&>[data-slot=alert-icon]]:mt-0.5 [&_[data-slot=alert-close]]:mt-0.25 [&_[data-slot=alert-close]_svg]:size-3.5',
    },
  },
  compoundVariants: [
    /* Solid */
    { variant: 'secondary', appearance: 'solid', className: 'bg-slate-100 text-slate-900' },
    { variant: 'primary', appearance: 'solid', className: 'bg-[var(--medical-navy)] text-white' },
    { variant: 'destructive', appearance: 'solid', className: 'bg-rose-600 text-white' },
    { variant: 'success', appearance: 'solid', className: 'bg-emerald-500 text-white' },
    { variant: 'info', appearance: 'solid', className: 'bg-violet-600 text-white' },
    { variant: 'warning', appearance: 'solid', className: 'bg-amber-500 text-white' },
    { variant: 'mono', appearance: 'solid', className: 'bg-zinc-950 text-white' },

    /* Outline */
    {
      variant: 'secondary',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-slate-900',
    },
    {
      variant: 'primary',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-[var(--medical-navy)]',
    },
    {
      variant: 'destructive',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-rose-600',
    },
    {
      variant: 'success',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-emerald-600',
    },
    {
      variant: 'info',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-violet-600',
    },
    {
      variant: 'warning',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-amber-600',
    },
    {
      variant: 'mono',
      appearance: 'outline',
      className: 'border border-slate-200 bg-white text-slate-900',
    },

    /* Light */
    {
      variant: 'secondary',
      appearance: 'light',
      className: 'bg-slate-50 border border-slate-200 text-slate-900',
    },
    {
      variant: 'primary',
      appearance: 'light',
      className:
        'bg-blue-50 border border-blue-100 text-slate-900 [&_[data-slot=alert-icon]]:text-[var(--medical-navy)]',
    },
    {
      variant: 'destructive',
      appearance: 'light',
      className:
        'bg-rose-50 border border-rose-100 text-slate-900 [&_[data-slot=alert-icon]]:text-rose-600',
    },
    {
      variant: 'success',
      appearance: 'light',
      className:
        'bg-emerald-50 border border-emerald-200 text-slate-900 [&_[data-slot=alert-icon]]:text-emerald-600',
    },
    {
      variant: 'info',
      appearance: 'light',
      className:
        'bg-violet-50 border border-violet-100 text-slate-900 [&_[data-slot=alert-icon]]:text-violet-600',
    },
    {
      variant: 'warning',
      appearance: 'light',
      className:
        'bg-amber-50 border border-amber-200 text-slate-900 [&_[data-slot=alert-icon]]:text-amber-600',
    },

    /* Mono icon overrides */
    {
      variant: 'mono',
      icon: 'primary',
      className: '[&_[data-slot=alert-icon]]:text-[var(--medical-navy)]',
    },
    {
      variant: 'mono',
      icon: 'warning',
      className: '[&_[data-slot=alert-icon]]:text-amber-600',
    },
    {
      variant: 'mono',
      icon: 'success',
      className: '[&_[data-slot=alert-icon]]:text-emerald-600',
    },
    {
      variant: 'mono',
      icon: 'destructive',
      className: '[&_[data-slot=alert-icon]]:text-rose-600',
    },
    {
      variant: 'mono',
      icon: 'info',
      className: '[&_[data-slot=alert-icon]]:text-violet-600',
    },
  ],
  defaultVariants: {
    variant: 'secondary',
    appearance: 'solid',
    size: 'md',
  },
});

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

interface AlertIconProps extends React.HTMLAttributes<HTMLDivElement> {}

function Alert({
  className,
  variant,
  size,
  icon,
  appearance,
  close = false,
  onClose,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, size, icon, appearance }), className)}
      {...props}
    >
      {children}
      {close && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          data-slot="alert-close"
          className="group shrink-0 size-5 rounded inline-flex items-center justify-center hover:bg-black/5 transition-colors"
        >
          <X className="opacity-60 group-hover:opacity-100 size-4" />
        </button>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('grow tracking-tight font-semibold', className)}
      {...props}
    />
  );
}

function AlertIcon({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-icon" className={cn('shrink-0', className)} {...props}>
      {children}
    </div>
  );
}

function AlertToolbar({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-toolbar" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-sm [&_p]:leading-relaxed [&_p]:mb-2', className)}
      {...props}
    />
  );
}

function AlertContent({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-content"
      className={cn('space-y-1 [&_[data-slot=alert-title]]:font-semibold flex-1', className)}
      {...props}
    />
  );
}

export { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle, AlertToolbar };
