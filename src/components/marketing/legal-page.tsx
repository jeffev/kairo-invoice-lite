export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; body: string }[] }) {
  return (
    <article className="mx-auto grid max-w-3xl gap-8 px-4 py-16 sm:px-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
        <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          Template text — have it reviewed by a lawyer before you launch.
        </p>
      </header>
      {sections.map((s) => (
        <section key={s.heading} className="grid gap-2">
          <h2 className="text-lg font-semibold">{s.heading}</h2>
          <p className="leading-relaxed text-muted-foreground">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
