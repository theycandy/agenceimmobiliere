import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PropertyBrief = {
  photos: string[];
  city: string;
  propertyType: string;
  transaction: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  price: number;
  condition: string;
  extra: string;
};

export type AiResult = {
  title: string;
  description: string;
  highlights: string[];
  style: string;
  luminosity: string;
  detectedRooms: string[];
};

const SYSTEM = `Tu es un expert en rédaction d'annonces immobilières françaises.
Tu analyses les photos fournies et les caractéristiques du bien, puis tu rédiges une fiche de présentation vendeuse, précise et honnête.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"title": string (max 70 caractères), "description": string (150 à 250 mots, en français), "highlights": string[] (4 à 6 atouts courts), "style": string (style architectural / déco perçu), "luminosity": string (appréciation de la luminosité), "detectedRooms": string[] (pièces identifiées sur les photos)}`;

export const analyzeProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PropertyBrief) => input)
  .handler(async ({ data }): Promise<AiResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Clé Lovable AI manquante");

    const facts = [
      `Type: ${data.propertyType}`,
      `Transaction: ${data.transaction}`,
      `Ville: ${data.city || "non précisée"}`,
      `Surface: ${data.surface} m²`,
      `Pièces: ${data.rooms}`,
      `Chambres: ${data.bedrooms}`,
      `Prix: ${data.price} €`,
      `État: ${data.condition}`,
      data.extra ? `Précisions du vendeur: ${data.extra}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: `Caractéristiques du bien :\n${facts}` },
      ...data.photos.slice(0, 6).map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 429) throw new Error("Trop de requêtes IA, réessayez dans un instant.");
      if (res.status === 402) throw new Error("Crédits IA épuisés : ajoutez des crédits Lovable.");
      throw new Error(`Analyse IA impossible (${res.status}) : ${detail.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<AiResult> = {};
    try {
      parsed = JSON.parse(raw) as Partial<AiResult>;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]) as Partial<AiResult>;
    }

    return {
      title: parsed.title ?? `${data.propertyType} ${data.rooms} pièces à ${data.city}`,
      description: parsed.description ?? "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 6) : [],
      style: parsed.style ?? "",
      luminosity: parsed.luminosity ?? "",
      detectedRooms: Array.isArray(parsed.detectedRooms) ? parsed.detectedRooms : [],
    };
  });
