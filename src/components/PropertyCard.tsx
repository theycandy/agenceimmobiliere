import { Link } from "@tanstack/react-router";
import { MapPin, Maximize, BedDouble } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";
import { Badge } from "@/components/ui/badge";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/bien/$id"
      params={{ id: property.id }}
      className="surface-panel group overflow-hidden transition-transform hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {property.photos[0] ? (
          <img
            src={property.photos[0]}
            alt={`Photo principale : ${property.title}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            Sans photo
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="capitalize">
            {property.transaction}
          </Badge>
          <span className="font-semibold text-primary">
            {formatPrice(property.price, property.transaction)}
          </span>
        </div>
        <h3 className="line-clamp-1 font-medium">{property.title}</h3>
        <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {property.city || "—"}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-3.5" /> {property.surface} m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" /> {property.bedrooms} ch.
          </span>
        </p>
      </div>
    </Link>
  );
}
