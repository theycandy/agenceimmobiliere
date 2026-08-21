import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Maximize, BedDouble, DoorOpen, Sparkles } from "lucide-react";
import { fetchProperty, formatPrice } from "@/lib/properties";
import { AppNav } from "@/components/AppNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bien/$id")({
  head: () => ({
    meta: [
      { title: "Fiche du bien — AtelierImmo" },
      {
        name: "description",
        content:
          "Découvrez la fiche détaillée du bien : photos, caractéristiques, atouts et analyse générée par l'IA.",
      },
      { property: "og:title", content: "Fiche du bien — AtelierImmo" },
      {
        property: "og:description",
        content: "Photos, caractéristiques et description rédigée par l'IA.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
  });

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="size-4" /> Retour à la vitrine
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !property ? (
          <p className="text-sm text-muted-foreground">Ce bien n'est pas disponible.</p>
        ) : (
          <article className="space-y-8">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {property.transaction}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {property.property_type}
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">{property.title}</h1>
              <p className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" /> {property.city || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Maximize className="size-4" /> {property.surface} m²
                </span>
                <span className="flex items-center gap-1">
                  <DoorOpen className="size-4" /> {property.rooms} pièces
                </span>
                <span className="flex items-center gap-1">
                  <BedDouble className="size-4" /> {property.bedrooms} chambres
                </span>
              </p>
              <p className="text-2xl font-semibold text-primary">
                {formatPrice(property.price, property.transaction)}
              </p>
            </header>

            {property.photos.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {property.photos.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${property.title} — photo ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`w-full rounded-xl object-cover ${
                      i === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  />
                ))}
              </div>
            )}

            <section className="surface-panel p-6">
              <h2 className="text-lg font-medium">Présentation</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </section>

            {property.highlights?.length > 0 && (
              <section className="surface-panel p-6">
                <h2 className="text-lg font-medium">Points forts</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {property.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /> {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <AiAnalysis analysis={property.ai_analysis} condition={property.condition} />
          </article>
        )}
      </main>
    </div>
  );
}

function AiAnalysis({
  analysis,
  condition,
}: {
  analysis: Record<string, unknown> | null;
  condition: string;
}) {
  const style = typeof analysis?.style === "string" ? analysis.style : null;
  const luminosity = typeof analysis?.luminosity === "string" ? analysis.luminosity : null;
  const detected = Array.isArray(analysis?.detectedRooms)
    ? (analysis.detectedRooms as unknown[]).filter((r): r is string => typeof r === "string")
    : [];

  return (
    <section className="surface-panel p-6">
      <h2 className="text-lg font-medium">Analyse IA des photos</h2>
      <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">État déclaré</dt>
          <dd className="capitalize">{condition}</dd>
        </div>
        {style && (
          <div>
            <dt className="text-muted-foreground">Style perçu</dt>
            <dd>{style}</dd>
          </div>
        )}
        {luminosity && (
          <div>
            <dt className="text-muted-foreground">Luminosité</dt>
            <dd>{luminosity}</dd>
          </div>
        )}
        {detected.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Pièces identifiées</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {detected.map((r) => (
                <Badge key={r} variant="secondary" className="capitalize">
                  {r}
                </Badge>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
