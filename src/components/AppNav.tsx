import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, LogOut, Plus, LayoutGrid, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppNav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="mr-auto flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Building2 className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Atelier<span className="text-brand">Immo</span>
          </span>
        </Link>

        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <Home className="size-4" /> Vitrine
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/mes-biens">
            <LayoutGrid className="size-4" /> Mes biens
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/nouveau">
            <Plus className="size-4" /> Nouveau bien
          </Link>
        </Button>

        {email ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            aria-label="Se déconnecter"
          >
            <LogOut className="size-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Connexion</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
