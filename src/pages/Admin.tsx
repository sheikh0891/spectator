import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Send, Calendar, Bell, Shield, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EventStatus = "upcoming" | "live" | "finished";
type EventRow = {
  id: string;
  sport: string;
  teams: string;
  venue: string;
  starts_at: string;
  status: EventStatus;
  score: string | null;
};

const emptyEvent = {
  id: "",
  sport: "",
  teams: "",
  venue: "",
  starts_at: "",
  status: "upcoming" as EventStatus,
  score: "",
};

const Admin = () => {
  const [tab, setTab] = useState<"events" | "notifications">("events");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Event dialog state
  const [openEvent, setOpenEvent] = useState(false);
  const [editing, setEditing] = useState<typeof emptyEvent>(emptyEvent);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifUrgent, setNotifUrgent] = useState(false);
  const [sending, setSending] = useState(false);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) toast.error("Impossible de charger les événements");
    else setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreate = () => {
    setEditing({ ...emptyEvent });
    setOpenEvent(true);
  };

  const openEdit = (e: EventRow) => {
    setEditing({
      id: e.id,
      sport: e.sport,
      teams: e.teams,
      venue: e.venue,
      starts_at: e.starts_at.slice(0, 16), // for datetime-local
      status: e.status,
      score: e.score ?? "",
    });
    setOpenEvent(true);
  };

  const saveEvent = async () => {
    if (!editing.sport || !editing.teams || !editing.venue || !editing.starts_at) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setSaving(true);
    const payload = {
      sport: editing.sport.trim().slice(0, 60),
      teams: editing.teams.trim().slice(0, 120),
      venue: editing.venue.trim().slice(0, 120),
      starts_at: new Date(editing.starts_at).toISOString(),
      status: editing.status,
      score: editing.score ? editing.score.trim().slice(0, 30) : null,
    };
    const { error } = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    toast.success(editing.id ? "Événement mis à jour" : "Événement créé");
    setOpenEvent(false);
    loadEvents();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("events").delete().eq("id", deleteId);
    if (error) toast.error("Erreur : " + error.message);
    else {
      toast.success("Événement supprimé");
      loadEvents();
    }
    setDeleteId(null);
  };

  const sendBroadcast = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("broadcast-notification", {
      body: {
        title: notifTitle,
        body: notifBody,
        urgent: notifUrgent,
      },
    });
    setSending(false);
    if (error) {
      // Try to surface server validation errors
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        try {
          const payload = await ctx.json();
          if (payload?.errors) {
            const first = Object.values(payload.errors)[0] as string;
            toast.error(first);
            return;
          }
          if (payload?.error) {
            toast.error(payload.error);
            return;
          }
        } catch {/* ignore */}
      }
      toast.error("Erreur d'envoi : " + error.message);
      return;
    }
    const recipients = (data as { recipients?: number } | null)?.recipients ?? 0;
    toast.success(`Notification envoyée à ${recipients} spectateur(s)`);
    setNotifTitle("");
    setNotifBody("");
    setNotifUrgent(false);
  };

  // Live client-side validation (mirrors server rules for instant feedback)
  const previewTitle = notifTitle.trim();
  const previewBody = notifBody.trim();
  const validationError = useMemo(() => {
    if (!previewTitle) return null; // empty = nothing to preview yet
    if (previewTitle.length < 3) return "Titre trop court (min. 3 caractères)";
    if (previewTitle.length > 120) return "Titre trop long (max. 120)";
    if (previewBody.length > 500) return "Message trop long (max. 500)";
    if (/<script|javascript:|onerror=|onload=/i.test(previewTitle + " " + previewBody))
      return "Contenu non autorisé";
    return null;
  }, [previewTitle, previewBody]);
  const canSend = !!previewTitle && !validationError && !sending;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Admin Fan 360</h1>
          </div>
          <div className="w-16" />
        </div>
        <div className="container mx-auto px-4 flex gap-2 pb-3">
          <button
            onClick={() => setTab("events")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === "events"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" /> Événements
          </button>
          <button
            onClick={() => setTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === "notifications"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="h-4 w-4" /> Notifications
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {tab === "events" && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Liste des événements</h2>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                Aucun événement. Créez le premier.
              </div>
            ) : (
              <div className="grid gap-3">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="uppercase tracking-wider">{e.sport}</span>
                        <span>•</span>
                        <span
                          className={
                            e.status === "live"
                              ? "text-accent font-semibold"
                              : e.status === "finished"
                              ? "text-muted-foreground"
                              : "text-primary"
                          }
                        >
                          {e.status}
                        </span>
                      </div>
                      <p className="font-semibold truncate">{e.teams}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {e.venue} — {new Date(e.starts_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(e.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {tab === "notifications" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-lg font-semibold mb-1">Diffuser une notification</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Envoyée à tous les spectateurs inscrits.
            </p>

            <div className="rounded-xl bg-card border border-border p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ntitle">Titre</Label>
                <Input
                  id="ntitle"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Changement de programme"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground text-right">{notifTitle.length}/120</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nbody">Message</Label>
                <Textarea
                  id="nbody"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Détails de l'alerte…"
                />
                <p className="text-xs text-muted-foreground text-right">{notifBody.length}/500</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
                  <p className="text-xs text-muted-foreground">Mise en avant côté spectateur</p>
                </div>
                <Switch id="urgent" checked={notifUrgent} onCheckedChange={setNotifUrgent} />
              </div>
              {validationError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
              <Button onClick={sendBroadcast} disabled={!canSend} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Envoi…" : "Envoyer à tous"}
              </Button>
            </div>

            {/* Live preview */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Prévisualisation côté spectateur</span>
              </div>
              {previewTitle ? (
                <div
                  className={`rounded-xl border p-4 transition ${
                    notifUrgent
                      ? "border-accent/60 bg-accent/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        notifUrgent ? "bg-accent text-accent-foreground" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {notifUrgent ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold truncate">{previewTitle}</p>
                        {notifUrgent && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-bold">
                            Urgent
                          </span>
                        )}
                      </div>
                      {previewBody ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {previewBody}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">(Pas de message)</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-2">À l'instant</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Saisissez un titre pour voir la prévisualisation.
                </div>
              )}
            </div>
          </motion.section>
        )}
      </main>

      {/* Event create/edit dialog */}
      <Dialog open={openEvent} onOpenChange={setOpenEvent}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="sport">Sport</Label>
              <Input
                id="sport"
                value={editing.sport}
                onChange={(e) => setEditing({ ...editing, sport: e.target.value })}
                placeholder="Football"
                maxLength={60}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teams">Équipes / Match</Label>
              <Input
                id="teams"
                value={editing.teams}
                onChange={(e) => setEditing({ ...editing, teams: e.target.value })}
                placeholder="Sénégal vs Maroc"
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="venue">Lieu</Label>
              <Input
                id="venue"
                value={editing.venue}
                onChange={(e) => setEditing({ ...editing, venue: e.target.value })}
                placeholder="Stade Abdoulaye Wade"
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="starts">Début</Label>
                <Input
                  id="starts"
                  type="datetime-local"
                  value={editing.starts_at}
                  onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Statut</Label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as EventStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">À venir</SelectItem>
                    <SelectItem value="live">En direct</SelectItem>
                    <SelectItem value="finished">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="score">Score (optionnel)</Label>
              <Input
                id="score"
                value={editing.score}
                onChange={(e) => setEditing({ ...editing, score: e.target.value })}
                placeholder="2 - 1"
                maxLength={30}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenEvent(false)}>Annuler</Button>
            <Button onClick={saveEvent} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;