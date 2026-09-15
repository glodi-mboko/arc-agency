import { LogOut, Search } from "lucide-react";

export function Topbar({
  agentName,
  agentRole,
}: {
  agentName: string;
  agentRole: string;
}) {
  const initials = agentName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 bg-background print:hidden">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un colis, client..."
          className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-primary font-semibold text-sm">
          {initials}
        </div>
        <div className="text-sm leading-tight">
          <div className="font-semibold text-foreground">{agentName}</div>
          <div className="text-muted-foreground text-xs">{agentRole}</div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Se déconnecter"
            className="ml-1 p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
