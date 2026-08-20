import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — AtelierImmo" },
      {
        name: "description",
        content:
          "Créez votre compte AtelierImmo pour publier vos biens immobiliers et générer vos fiches par intelligence artificielle.",
      },
      { property: "og:title", content: "Connexion — AtelierImmo" },
      {
        property: "og:description",
        content: "Accédez à votre espace de création de fiches immobilières augmentées par l'IA.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/mes-biens" });
    });
  }, [navigate]);

  async function handle(mode: "signin" | "signup") {
    setLoading(true);
    try {
      const fn =
        mode === "signin"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            });
      const { data, error } = await fn;
      if (error) throw error;
      if (data.session) {
        toast.success(mode === "signin" ? "Bienvenue !" : "Compte créé");
        navigate({ to: "/mes-biens" });
      } else {
        toast.info("Vérifiez votre boîte mail pour confirmer votre compte.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'authentification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hero-surface flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Building2 className="size-5" />
          </span>
          <span className="text-xl font-semibold">
            Atelier<span className="text-brand">Immo</span>
          </span>
        </Link>

        <div className="surface-panel glow-ring p-6">
          <Tabs defaultValue="signin">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@agence.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <TabsContent value="signin" className="mt-6">
              <Button className="w-full" disabled={loading} onClick={() => handle("signin")}>
                Se connecter
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <Button className="w-full" disabled={loading} onClick={() => handle("signup")}>
                Créer mon compte
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
