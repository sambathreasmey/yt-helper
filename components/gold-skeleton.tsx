import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GoldSummarySkeleton() {
  return (
    <Card aria-busy="true" className="gold-summary">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-2xl" />
        <span className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-full" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-11 rounded-xl" />)}
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-7 flex-1 rounded-full" />
        <Skeleton className="h-7 flex-1 rounded-full" />
      </div>
    </Card>
  );
}

export function GoldHoldingsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      {[0, 1].map((item) => (
        <div key={item} className="space-y-3 rounded-2xl border border-border p-3.5">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </span>
            <Skeleton className="h-12 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-3/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Full-page placeholder shown while the gold feature chunk is downloaded. */
export function GoldPageSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-[520px] space-y-4">
      <div className="mb-5 flex min-h-14 items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <span className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3 w-52 rounded-full" />
        </span>
      </div>
      <Card>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-2xl" />
          <span className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-2.5 w-32 rounded-full" />
          </span>
        </CardContent>
      </Card>
      <GoldSummarySkeleton />
      <Card>
        <CardContent>
          <GoldHoldingsSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
