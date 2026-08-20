import { supabase } from "@/integrations/supabase/client";

export type Property = {
  id: string;
  user_id: string;
  title: string;
  city: string;
  property_type: string;
  transaction: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  price: number;
  condition: string;
  description: string;
  highlights: string[];
  ai_analysis: Record<string, unknown>;
  photos: string[];
  published: boolean;
  created_at: string;
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 ans

export function formatPrice(value: number, transaction: string) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
  return transaction === "location" ? `${formatted} / mois` : formatted;
}

export async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data, error: signError } = await supabase.storage
      .from("property-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signError || !data) throw signError ?? new Error("URL de photo indisponible");
    urls.push(data.signedUrl);
  }
  return urls;
}

export async function fetchPublishedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Property[];
}

export async function fetchMyProperties(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Property[];
}

export async function fetchProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as Property) ?? null;
}
