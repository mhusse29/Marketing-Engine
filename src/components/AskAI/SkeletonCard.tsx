
import CardShell from '../Outputs/CardShell';

interface SkeletonCardProps {
  title?: string;
}

export function SkeletonCard({ title = 'Loading…' }: SkeletonCardProps) {
  return (
    <CardShell sheen>
      <header className="mb-4 border-b border-white/10 pb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{title}</div>
        <div className="mt-2 h-3 w-40 skeleton" />
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="h-6 w-3/4 skeleton" />
        <div className="h-6 w-2/3 skeleton" />
        <div className="h-24 w-full rounded-xl skeleton" />
        <div className="mt-auto h-4 w-1/3 skeleton" />
      </div>

      <footer className="mt-4 border-t border-white/10 pt-3">
        <div className="h-3 w-28 skeleton" />
      </footer>
    </CardShell>
  );
}
