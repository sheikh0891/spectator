import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Volume2, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type EventRow = {
  id: string;
  sport: string;
  teams: string;
  venue: string;
  starts_at: string;
  status: "upcoming" | "live" | "finished";
  score: string | null;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

type Props = {
  events: EventRow[];
  onBuy: (event: EventRow) => void;
  hasTicketFor: (eventId: string) => boolean;
};

export const ScheduleTab = ({ events, onBuy, hasTicketFor }: Props) => {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const sports = useMemo(
    () => Array.from(new Set(events.map((e) => e.sport))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (sport !== "all" && e.sport !== sport) return false;
      if (status !== "all" && e.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !e.teams.toLowerCase().includes(q) &&
          !e.venue.toLowerCase().includes(q) &&
          !e.sport.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [events, sport, status, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of filtered) {
      const key = new Date(e.starts_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
    );
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-display text-xl font-bold mb-4">Programme & calendrier</h2>

      {/* Filters */}
      <div className="glass-card rounded-xl p-3 mb-5 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher équipe, lieu, sport…"
            className="pl-9 bg-transparent border-border"
          />
        </div>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous sports</SelectItem>
            {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="live">En direct</SelectItem>
            <SelectItem value="finished">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun événement pour ces filtres.</p>
      )}

      <div className="space-y-6">
        {grouped.map(([day, list]) => (
          <div key={day}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {dateLabel(list[0].starts_at)}
            </h3>
            <div className="space-y-3">
              {list.map((event) => {
                const owned = hasTicketFor(event.id);
                return (
                  <div key={event.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-sm truncate">{event.teams}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{event.sport}</span>
                        <span>•</span>
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {event.status === "live" ? (
                        <span className="text-sm font-bold text-gradient">{event.score ?? "Live"}</span>
                      ) : event.status === "finished" ? (
                        <span className="text-xs text-muted-foreground">{event.score ?? "Terminé"}</span>
                      ) : (
                        <span className="text-sm font-semibold">{formatTime(event.starts_at)}</span>
                      )}
                      {event.status === "live" && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <Volume2 className="h-3 w-3" /> Live
                        </div>
                      )}
                      {event.status === "upcoming" && (
                        owned ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                            ✓ Billet
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onBuy(event)}>
                            <Plus className="h-3 w-3" /> Billet
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};