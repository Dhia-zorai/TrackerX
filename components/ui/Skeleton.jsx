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
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Player banner */}
      <div className="glass rounded-xl p-6 flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Match list */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <MatchCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
