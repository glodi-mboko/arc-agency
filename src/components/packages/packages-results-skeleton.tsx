export function PackagesResultsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
      <div className="h-96 bg-muted rounded" />
    </div>
  );
}
