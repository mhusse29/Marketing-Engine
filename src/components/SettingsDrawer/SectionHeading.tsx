export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description ? <p className="mt-1 text-xs text-white/55">{description}</p> : null}
    </div>
  );
}
