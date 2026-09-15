import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function SetupCheckPage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              ARC
            </div>
            <span className="font-bold text-primary">ARC Service</span>
          </div>
          <CardTitle>Étape 1 — Vérification de la config</CardTitle>
          <CardDescription>
            Si cette carte s&apos;affiche avec le bleu marine, l&apos;orange et
            des composants stylés, le projet est prêt pour la suite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test">Champ de test</Label>
            <Input id="test" placeholder="Tape quelque chose..." />
          </div>
          <div className="flex gap-2">
            <Button variant="primary">Bouton navy</Button>
            <Button>Bouton orange</Button>
            <Button variant="outline">Bouton outline</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
