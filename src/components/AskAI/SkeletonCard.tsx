interface SkeletonCardProps {
  type: 'content' | 'pictures' | 'video';
}

const shimmer = 'animate-pulse bg-white/[0.08]';

export function SkeletonCard({ type }: SkeletonCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between">
        <div className={`h-5 w-32 rounded-full ${shimmer}`} />
        <div className="flex gap-2">
          <div className={`h-8 w-16 rounded-xl ${shimmer}`} />
          <div className={`h-8 w-20 rounded-xl ${shimmer}`} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className={`h-4 w-40 rounded-full ${shimmer}`} />
        <div className={`h-4 w-full rounded-full ${shimmer}`} />
        <div className={`h-4 w-5/6 rounded-full ${shimmer}`} />
        {type !== 'video' && <div className={`h-4 w-2/3 rounded-full ${shimmer}`} />}
      </div>

      <div className="mt-6 flex justify-between text-xs text-white/30">
        <div className={`h-3 w-16 rounded-full ${shimmer}`} />
        <div className={`h-3 w-14 rounded-full ${shimmer}`} />
      </div>
    </div>
  );
}
