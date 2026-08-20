import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyProperties, formatPrice } from "@/lib/properties";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/mes-biens")({
  head: () => ({
    meta: [
      { title: "Mes biens — AtelierImmo" },
      {
        name: "description",
        content: "Gérez vos biens immobiliers : publication, retrait de la vitrine et suppression.",
      },
      { property: "og:title", content: "Mes biens — AtelierImmo" },
      {
        property: "og:description",
        content: "Tableau de bord de vos fiches immobilières générées par l'IA.",
      },
    ],
  }),
  component: MyProperties,
});

function MyProperties() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["my-properties", userId],
    queryFn: () => fetchMyProperties(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("my-properties")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-properties", userId] });
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  async function togglePublish(id: string, published: boolean) {
    const { error } = await supabase.from("properties").update({ published }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(published ? "Bien remis en vitrine" : "Bien retiré de la vitrine");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Bien supprimé");
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Mes biens</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {properties.length} fiche{properties.length > 1 ? "s" : ""} · synchronisation en temps
              réel
            </p>
          </div>
          <Button asChild>
            <Link to="/nouveau">
              <Plus className="size-4" /> Nouveau bien
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement…</p>
        ) : properties.length === 0 ? (
          <div className="surface-panel mt-10 flex flex-col items-center gap-3 p-12 text-center">
            <Building2 className="size-8 text-primary" />
            <p className="text-muted-foreground">Aucun bien pour le moment.</p>
            <Button asChild variant="outline">
              <Link to="/nouveau">Créer ma première fiche</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {properties.map((p) => (
              <li
                key={p.id}
                className="surface-panel flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.photos[0] && (
                    <img src={p.photos[0]} alt={p.title} className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 grow">
                  <Link
                    to="/bien/$id"
                    params={{ id: p.id }}
                    className="line-clamp-1 font-medium hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.city || "—"} · {p.surface} m² · {formatPrice(p.price, p.transaction)}
                  </p>
                </div>
                <Badge variant={p.published ? "default" : "secondary"}>
                  {p.published ? "En vitrine" : "Masqué"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePublish(p.id, !p.published)}
                  aria-label="Changer la visibilité"
                >
                  {p.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(p.id)}
                  aria-label="Supprimer le bien"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
