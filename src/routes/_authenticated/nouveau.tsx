import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeProperty } from "@/lib/ai.functions";
import { uploadPhotos } from "@/lib/properties";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/nouveau")({
  head: () => ({
    meta: [
      { title: "Nouveau bien — AtelierImmo" },
      {
        name: "description",
        content:
          "Importez les photos de votre bien, précisez ses caractéristiques et laissez l'IA rédiger la fiche de présentation.",
      },
      { property: "og:title", content: "Nouveau bien — AtelierImmo" },
      {
        property: "og:description",
        content: "Génération automatique de fiches immobilières à partir de vos photos.",
      },
    ],
  }),
  component: NewProperty,
});

const STEPS = ["Photos en cours d'envoi…", "Analyse IA des photos…", "Publication de la fiche…"];

function NewProperty() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeProperty);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState<number>(-1);
  const [form, setForm] = useState({
    city: "",
    propertyType: "appartement",
    transaction: "vente",
    surface: "75",
    rooms: "3",
    bedrooms: "2",
    price: "250000",
    condition: "bon",
    extra: "",
  });

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).slice(0, 6 - files.length);
    setFiles((f) => [...f, ...next]);
    setPreviews((p) => [...p, ...next.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(i: number) {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (files.length === 0) {
      toast.error("Ajoutez au moins une photo du bien.");
      return;
    }
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Session expirée");

      setStep(0);
      const photos = await uploadPhotos(userId, files);

      setStep(1);
      const ai = await analyze({
        data: {
          photos,
          city: form.city,
          propertyType: form.propertyType,
          transaction: form.transaction,
          surface: Number(form.surface) || 0,
          rooms: Number(form.rooms) || 1,
          bedrooms: Number(form.bedrooms) || 1,
          price: Number(form.price) || 0,
          condition: form.condition,
          extra: form.extra,
        },
      });

      setStep(2);
      const { data: inserted, error } = await supabase
        .from("properties")
        .insert({
          user_id: userId,
          title: ai.title,
          city: form.city,
          property_type: form.propertyType,
          transaction: form.transaction,
          surface: Number(form.surface) || 0,
          rooms: Number(form.rooms) || 1,
          bedrooms: Number(form.bedrooms) || 1,
          price: Number(form.price) || 0,
          condition: form.condition,
          description: ai.description,
          highlights: ai.highlights,
          ai_analysis: {
            style: ai.style,
            luminosity: ai.luminosity,
            detectedRooms: ai.detectedRooms,
          },
          photos,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success("Fiche générée et publiée !");
      navigate({ to: "/bien/$id", params: { id: inserted.id } });
    } catch (e) {
      setStep(-1);
      toast.error(e instanceof Error ? e.message : "Une erreur est survenue");
    }
  }

  const busy = step >= 0;

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Créer une fiche de bien</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Importez vos photos, précisez les caractéristiques : l'IA analyse et rédige la fiche.
        </p>

        <section className="surface-panel mt-8 p-6">
          <h2 className="mb-4 text-lg font-medium">1. Photos du bien</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img src={src} alt={`Aperçu ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 text-foreground"
                  aria-label="Retirer la photo"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {files.length < 6 && (
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus className="size-6" />
                Ajouter
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </section>

        <section className="surface-panel mt-6 p-6">
          <h2 className="mb-4 text-lg font-medium">2. Caractéristiques</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ville">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Bordeaux"
              />
            </Field>
            <Field label="Type de bien">
              <Choice
                value={form.propertyType}
                onChange={(v) => setForm({ ...form, propertyType: v })}
                options={["appartement", "maison", "studio", "loft", "villa", "terrain"]}
              />
            </Field>
            <Field label="Transaction">
              <Choice
                value={form.transaction}
                onChange={(v) => setForm({ ...form, transaction: v })}
                options={["vente", "location"]}
              />
            </Field>
            <Field label="État">
              <Choice
                value={form.condition}
                onChange={(v) => setForm({ ...form, condition: v })}
                options={["neuf", "rénové", "bon", "à rafraîchir", "à rénover"]}
              />
            </Field>
            <Field label="Surface (m²)">
              <Input
                type="number"
                value={form.surface}
                onChange={(e) => setForm({ ...form, surface: e.target.value })}
              />
            </Field>
            <Field label="Prix (€)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Pièces">
              <Input
                type="number"
                value={form.rooms}
                onChange={(e) => setForm({ ...form, rooms: e.target.value })}
              />
            </Field>
            <Field label="Chambres">
              <Input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Précisions (optionnel)">
              <Textarea
                rows={3}
                value={form.extra}
                onChange={(e) => setForm({ ...form, extra: e.target.value })}
                placeholder="Terrasse plein sud, proche tramway, copropriété de 12 lots…"
              />
            </Field>
          </div>
        </section>

        <div className="mt-6 flex items-center gap-4">
          <Button size="lg" onClick={submit} disabled={busy}>
            <Sparkles className="size-4" />
            {busy ? "Génération en cours…" : "Générer la fiche avec l'IA"}
          </Button>
          {busy && <span className="text-sm text-muted-foreground">{STEPS[step]}</span>}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
