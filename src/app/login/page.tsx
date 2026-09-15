"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, MapPin, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  getAgentByUsername,
  getAuthorizedAgencies,
  type AgentLoginInfo,
} from "@/lib/queries/agents";
import type { Agency } from "@/lib/types";

const GENERIC_ERROR = "Nom d'utilisateur ou mot de passe incorrect.";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resolvingAgent, setResolvingAgent] = useState(false);
  const [resolvedAgent, setResolvedAgent] = useState<AgentLoginInfo | null>(
    null,
  );
  const [defaultAgency, setDefaultAgency] = useState<Agency | null>(null);
  const [authorizedAgencies, setAuthorizedAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [changingAgency, setChangingAgency] = useState(false);

  async function handleUsernameBlur() {
    if (!username.trim()) return;

    setResolvingAgent(true);
    const lookup = await getAgentByUsername(username.trim());

    if (!lookup) {
      // Stay silent here: we only surface the generic error on submit,
      // so we don't reveal whether a username exists.
      setResolvedAgent(null);
      setDefaultAgency(null);
      setAuthorizedAgencies([]);
      setResolvingAgent(false);
      return;
    }

    setResolvedAgent(lookup.agent);
    setDefaultAgency(lookup.defaultAgency);
    setSelectedAgencyId(lookup.defaultAgency.id);

    const agencies = await getAuthorizedAgencies(
      lookup.agent.id,
      lookup.defaultAgency,
    );
    setAuthorizedAgencies(agencies);
    setResolvingAgent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resolvedAgent) {
      setError(GENERIC_ERROR);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: resolvedAgent.email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(GENERIC_ERROR);
      return;
    }

    // Remember which agency the agent chose for this session
    // (read later by the dashboard / package forms).
    document.cookie = `active_agency_id=${selectedAgencyId}; path=/; max-age=${
      60 * 60 * 24 * 7
    }`;

    // Swap to the redirect overlay: the dashboard's first server render
    // runs several queries, so this avoids a moment where the screen
    // looks frozen between "Connexion..." and the dashboard appearing.
    setLoading(false);
    setRedirecting(true);
    router.push("/dashboard");
    router.refresh();
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-sm text-muted-foreground">
            Connexion réussie, redirection vers votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-white p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center font-bold text-sm">
              ARC
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">ARC Service</div>
              <div className="text-xs tracking-widest text-white/60">
                PORTAIL LOGISTIQUE
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-accent text-xs font-bold tracking-widest">
            LIAISON DIRECTE
          </div>
          <div className="text-5xl font-bold leading-tight">
            France ⇄<br />
            Kinshasa
          </div>
          <p className="text-white/70 max-w-sm">
            Votre partenaire logistique de confiance. Connectez-vous pour gérer
            les expéditions, suivre les colis et superviser les flux financiers.
          </p>
        </div>

        <div className="text-xs text-white/40">Agence Paris / Kinshasa</div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-2xl font-bold text-primary">
              Connexion à votre espace agent
            </h1>
            <p className="text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre tableau de bord
              sécurisé.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={handleUsernameBlur}
                    placeholder="Entrez votre nom d'utilisateur"
                    className="pl-9"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Agence / Pays</Label>
                {!changingAgency ? (
                  <div className="relative">
                    {resolvingAgent ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    ) : (
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      readOnly
                      value={
                        resolvingAgent
                          ? "Recherche de l'agence..."
                          : defaultAgency
                            ? `${defaultAgency.name}, ${defaultAgency.country}`
                            : "—"
                      }
                      className="pl-9 pr-9 bg-muted"
                    />
                    {!resolvingAgent && (
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <select
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {authorizedAgencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}, {agency.country}
                      </option>
                    ))}
                  </select>
                )}
                {authorizedAgencies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setChangingAgency((v) => !v)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {changingAgency
                      ? "Utiliser l'agence par défaut"
                      : "Changer d'agence"}
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || resolvingAgent}
              >
                {loading ? "Connexion..." : "Se connecter →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
