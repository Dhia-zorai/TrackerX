"use client";

export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={"skeleton " + className}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-4 border-l-4 border-[var(--border)]">
      <Skeleton className="w-[52px] h-[52px] rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2 text-right shrink-0">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-14 ml-auto" />
        <Skeleton className="h-2 w-16 ml-auto" />
      </div>
    </div>
  );
}
