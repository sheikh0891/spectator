import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Calendar, Bell, MapPin, ChevronRight, Clock,
  Trophy, Users, ArrowLeft, Zap, Volume2, LogOut, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useRole";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { ScheduleTab, type EventRow } from "@/components/dashboard/ScheduleTab";
import { BuyTicketDialog } from "@/components/dashboard/BuyTicketDialog";
import { StadiumGuide } from "@/components/dashboard/StadiumGuide";

type TicketRow = {
  id: string;
  reference: string;
  tribune: string | null;
  row_number: string | null;
  seat: string | null;
  qr_code: string;
  status: string;
  event_id?: string;
  event: { teams: string; starts_at: string } | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  urgent: boolean;
  read: boolean;
  created_at: string;
};

const tabs = [
  { id: "schedule", label: "Programme", icon: Calendar },
  { id: "ticket", label: "Mon billet", icon: QrCode },
  { id: "map", label: "Guide", icon: MapPin },
  { id: "notifications", label: "Alertes", icon: Bell },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [firstName, setFirstName] = useState<string>("");
  const [buyEvent, setBuyEvent] = useState<EventRow | null>(null);

  const loadTickets = () => {
    if (!user) return;
    supabase.from("tickets")
      .select("id, reference, tribune, row_number, seat, qr_code, status, event_id, event:events(teams, starts_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setTickets(data as unknown as TicketRow[]); });
  };

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFirstName(data?.first_name ?? ""));

    supabase.from("events").select("*").order("starts_at").then(({ data }) => {
      if (data) setEvents(data as EventRow[]);
    });

    loadTickets();

    supabase.from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setNotifications(data as NotificationRow[]); });

    const eventsCh = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        setEvents((prev) => {
          if (payload.eventType === "INSERT") return [...prev, payload.new as EventRow];
          if (payload.eventType === "UPDATE") return prev.map((e) => e.id === (payload.new as EventRow).id ? payload.new as EventRow : e);
          if (payload.eventType === "DELETE") return prev.filter((e) => e.id !== (payload.old as EventRow).id);
          return prev;
        });
      })
      .subscribe();

    const notifCh = supabase
      .channel("notif-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as NotificationRow;
        setNotifications((prev) => [n, ...prev]);
        if (n.urgent) {
          toast.error(n.title, { description: n.body ?? undefined, duration: 6000 });
        } else {
          toast.message(n.title, { description: n.body ?? undefined, duration: 5000 });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsCh);
      supabase.removeChannel(notifCh);
    };
  }, [user]);

  const liveEvent = events.find((e) => e.status === "live");
  const primaryTicket = tickets[0];
  const ownedEventIds = new Set(tickets.map((t) => t.event_id).filter(Boolean) as string[]);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const formatRelative = (iso: string) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "à l'instant";
    if (diff < 60) return `il y a ${diff} min`;
    const h = Math.round(diff / 60);
    if (h < 24) return `il y a ${h}h`;
    return new Date(iso).toLocaleDateString("fr-FR");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnecté");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="glass-card sticky top-0 z-50 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-lg font-bold">Fan 360</h1>
              <p className="text-xs text-muted-foreground">
                Bienvenue{firstName ? `, ${firstName}` : ""} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Admin">
                  <Shield className="h-4 w-4 text-primary" />
                </Button>
              </Link>
            )}
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut} title="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Live banner */}
      {liveEvent && (
        <div className="container mx-auto px-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 border-primary/30 glow-primary"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                EN DIRECT
              </span>
              <span className="text-xs text-muted-foreground">{liveEvent.venue}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-display text-xl font-bold">{liveEvent.teams}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> {liveEvent.sport}
                </div>
              </div>
              {liveEvent.score && (
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-gradient">{liveEvent.score}</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab content */}
      <div className="container mx-auto px-6 mt-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "schedule" && (
            <ScheduleTab
              key="schedule"
              events={events}
              onBuy={(e) => setBuyEvent(e)}
              hasTicketFor={(id) => ownedEventIds.has(id)}
            />
          )}

          {activeTab === "ticket" && (
            <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-display text-xl font-bold mb-4">Mon billet</h2>
              {!primaryTicket ? (
                <div className="glass-card rounded-2xl p-8 text-center max-w-sm mx-auto">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Vous n'avez pas encore de billet.</p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center glow-primary max-w-sm mx-auto">
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground">BILLET #{primaryTicket.reference}</span>
                  </div>
                  <div className="bg-white rounded-xl p-6 mb-6 inline-block">
                    <QRCodeSVG value={primaryTicket.qr_code} size={160} level="H" />
                  </div>
                  <div className="font-display text-lg font-bold">{primaryTicket.event?.teams ?? "Événement"}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {[primaryTicket.tribune, primaryTicket.row_number && `Rang ${primaryTicket.row_number}`, primaryTicket.seat && `Siège ${primaryTicket.seat}`].filter(Boolean).join(" — ")}
                  </div>
                  {primaryTicket.event && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(primaryTicket.event.starts_at).toLocaleDateString("fr-FR")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(primaryTicket.event.starts_at)}</span>
                    </div>
                  )}
                  <div className="mt-4 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium inline-block">
                    ✓ Billet {primaryTicket.status === "valid" ? "vérifié" : primaryTicket.status}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "map" && <StadiumGuide key="map" />}

          {activeTab === "notifications" && (
            <motion.div key="notifs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="font-display text-xl font-bold mb-4">Notifications</h2>
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
              )}
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`glass-card rounded-xl p-4 flex items-center gap-4 ${notif.urgent ? "border-primary/30" : ""}`}
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${notif.urgent ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{notif.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatRelative(notif.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BuyTicketDialog
        event={buyEvent}
        onClose={() => setBuyEvent(null)}
        onPurchased={loadTickets}
      />

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border">
        <div className="container mx-auto flex items-center justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
