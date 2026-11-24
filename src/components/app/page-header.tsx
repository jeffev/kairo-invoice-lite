export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-4 py-12 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <div className="grid gap-1">
        <p className="font-medium">{title}</p>
        {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}
