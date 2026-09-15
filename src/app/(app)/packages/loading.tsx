import { PackagesResultsSkeleton } from "@/components/packages/packages-results-skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-10 w-36 bg-muted rounded" />
      </div>
      <div className="h-10 w-full bg-muted rounded" />
      <PackagesResultsSkeleton />
    </div>
  );
}
