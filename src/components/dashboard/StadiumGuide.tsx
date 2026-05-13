import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Coffee, Heart, LogOut, ParkingCircle, ShoppingBag, Toilet, Users,
} from "lucide-react";

type POI = {
  id: string;
  name: string;
  type: "entry" | "tribune" | "food" | "shop" | "wc" | "first_aid" | "exit" | "parking";
  x: number; // 0-100
  y: number; // 0-100
  info: string;
};

const POIS: POI[] = [
  { id: "ent", name: "Entrée principale", type: "entry", x: 50, y: 92, info: "Contrôle billets · Ouvert dès 17h" },
  { id: "tn", name: "Tribune Nord", type: "tribune", x: 50, y: 18, info: "Places 1-5000" },
  { id: "ts", name: "Tribune Sud", type: "tribune", x: 50, y: 82, info: "Places 5001-10000 · Votre place" },
  { id: "te", name: "Tribune Est", type: "tribune", x: 82, y: 50, info: "Places 10001-15000" },
  { id: "tw", name: "Tribune Ouest", type: "tribune", x: 18, y: 50, info: "VIP & Loges" },
  { id: "f1", name: "Buvette B2", type: "food", x: 30, y: 30, info: "120m · File courte" },
  { id: "f2", name: "Buvette B5", type: "food", x: 70, y: 70, info: "180m · 5 min d'attente" },
  { id: "shop", name: "Boutique officielle", type: "shop", x: 28, y: 70, info: "Maillots & souvenirs" },
  { id: "wc1", name: "Toilettes Est", type: "wc", x: 75, y: 35, info: "Accès libre" },
  { id: "wc2", name: "Toilettes Ouest", type: "wc", x: 25, y: 50, info: "Accès libre · PMR" },
  { id: "med", name: "Poste de secours", type: "first_aid", x: 50, y: 50, info: "24/7 pendant l'événement" },
  { id: "ex1", name: "Sortie d'urgence A", type: "exit", x: 12, y: 22, info: "Évacuation rapide" },
  { id: "ex2", name: "Sortie d'urgence B", type: "exit", x: 88, y: 78, info: "Évacuation rapide" },
  { id: "park", name: "Parking visiteurs", type: "parking", x: 8, y: 95, info: "300m · Navette gratuite" },
];

const ICONS: Record<POI["type"], typeof MapPin> = {
  entry: MapPin,
  tribune: Users,
  food: Coffee,
  shop: ShoppingBag,
  wc: Toilet,
  first_aid: Heart,
  exit: LogOut,
  parking: ParkingCircle,
};

const COLORS: Record<POI["type"], string> = {
  entry: "bg-primary text-primary-foreground",
  tribune: "bg-info/80 text-info-foreground",
  food: "bg-warning/80 text-warning-foreground",
  shop: "bg-secondary text-secondary-foreground",
  wc: "bg-muted text-foreground",
  first_aid: "bg-destructive text-destructive-foreground",
  exit: "bg-success/80 text-success-foreground",
  parking: "bg-card text-foreground border border-border",
};

const LEGEND: { type: POI["type"]; label: string }[] = [
  { type: "entry", label: "Entrée" },
  { type: "tribune", label: "Tribunes" },
  { type: "food", label: "Buvettes" },
  { type: "shop", label: "Boutique" },
  { type: "wc", label: "Toilettes" },
  { type: "first_aid", label: "Secours" },
  { type: "exit", label: "Sortie" },
  { type: "parking", label: "Parking" },
];

export const StadiumGuide = () => {
  const [filter, setFilter] = useState<POI["type"] | "all">("all");
  const [selected, setSelected] = useState<POI | null>(null);
  const visible = POIS.filter((p) => filter === "all" || p.type === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-display text-xl font-bold mb-4">Guide interactif du stade</h2>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          Tout
        </button>
        {LEGEND.map((l) => (
          <button
            key={l.type}
            onClick={() => setFilter(l.type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === l.type ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="glass-card rounded-2xl p-3 mb-4">
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-card">
          {/* Field */}
          <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
            <rect x="60" y="60" width="280" height="180" rx="8"
              fill="hsl(var(--success) / 0.18)" stroke="hsl(var(--success) / 0.5)" strokeWidth="1.5" />
            <line x1="200" y1="60" x2="200" y2="240" stroke="hsl(var(--success) / 0.5)" strokeWidth="1" />
            <circle cx="200" cy="150" r="22" fill="none" stroke="hsl(var(--success) / 0.5)" strokeWidth="1" />
            <rect x="60" y="110" width="30" height="80" fill="none" stroke="hsl(var(--success) / 0.5)" strokeWidth="1" />
            <rect x="310" y="110" width="30" height="80" fill="none" stroke="hsl(var(--success) / 0.5)" strokeWidth="1" />
          </svg>

          {/* POIs */}
          {visible.map((p) => {
            const Icon = ICONS[p.type];
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center shadow-lg transition hover:scale-110 ${COLORS[p.type]} ${selected?.id === p.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                title={p.name}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected info */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-4 flex items-center gap-3 border-primary/30"
        >
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${COLORS[selected.type]}`}>
            {(() => { const I = ICONS[selected.type]; return <I className="h-5 w-5" />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-sm">{selected.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{selected.info}</div>
          </div>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-2">
        {visible.map((p) => {
          const Icon = ICONS[p.type];
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:border-primary/30 transition"
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${COLORS[p.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.info}</div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};