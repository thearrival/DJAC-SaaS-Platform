import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[280px] border-r border-border bg-sidebar flex flex-col p-4 gap-6 shrink-0">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2 h-8">
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Menu groups — scrollable area */}
        <div className="flex-1 space-y-1 px-2 overflow-hidden">
          {/* Group 1: Overview */}
          <Skeleton className="h-2.5 w-16 rounded mb-2 opacity-40" />
          <Skeleton className="h-9 w-full rounded-lg" />

          {/* Group 2: Intelligence */}
          <div className="pt-3">
            <Skeleton className="h-2.5 w-20 rounded mb-2 opacity-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg mt-1" />
            <Skeleton className="h-9 w-full rounded-lg mt-1" />
          </div>

          {/* Group 3: Compliance */}
          <div className="pt-3">
            <Skeleton className="h-2.5 w-24 rounded mb-2 opacity-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg mt-1" />
          </div>

          {/* Group 4: Reports */}
          <div className="pt-3">
            <Skeleton className="h-2.5 w-16 rounded mb-2 opacity-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>

          {/* Group 5: Platform */}
          <div className="pt-3">
            <Skeleton className="h-2.5 w-18 rounded mb-2 opacity-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg mt-1" />
          </div>

          {/* Group 6: Account */}
          <div className="pt-3">
            <Skeleton className="h-2.5 w-16 rounded mb-2 opacity-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg mt-1" />
          </div>
        </div>

        {/* User profile area at bottom */}
        <div className="border-t border-border/60 pt-3">
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Content blocks */}
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
