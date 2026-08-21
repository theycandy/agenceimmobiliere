import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublishedProperties } from "@/lib/properties";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AtelierImmo — Fiches immobilières générées par l'IA" },
      {
        name: "description",
        content:
          "Importez les photos d'un bien, l'IA analyse et rédige la fiche de présentation. Découvrez tous les biens publiés sur la vitrine.",
      },
      { property: "og:title", content: "AtelierImmo — Fiches immobilières générées par l'IA" },
      {
        property: "og:description",
        content: "Vitrine des biens immobiliers avec fiches rédigées automatiquement par l'IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchPublishedProperties,
  });

  useEffect(() => {
    const channel = supabase
      .channel("public-properties")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        queryClient.invalidateQueries({ queryKey: ["properties"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen">
      <AppNav />

      <section
        className="border-b border-border"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Analyse visuelle par intelligence
            artificielle
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Vos biens immobiliers,
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-brand)" }}>
              présentés par l'IA
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Importez les photos, indiquez quelques précisions : la plateforme analyse le bien et
            rédige une fiche professionnelle, publiée instantanément sur la vitrine.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/nouveau">
                Créer une fiche <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mes-biens">Mes biens</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Biens en vitrine</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {properties.length} bien{properties.length > 1 ? "s" : ""} · mise à jour en temps réel
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement de la vitrine…</p>
        ) : properties.length === 0 ? (
          <div className="surface-panel mt-10 flex flex-col items-center gap-3 p-14 text-center">
            <Building2 className="size-8 text-primary" />
            <p className="text-muted-foreground">
              Aucun bien publié pour l'instant. Soyez le premier à créer une fiche.
            </p>
            <Button asChild variant="outline">
              <Link to="/nouveau">Créer une fiche</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
