import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { EventRow } from "./ScheduleTab";

const TRIBUNES = ["Nord", "Sud", "Est", "Ouest", "VIP"];

type Props = {
  event: EventRow | null;
  onClose: () => void;
  onPurchased: () => void;
};

export const BuyTicketDialog = ({ event, onClose, onPurchased }: Props) => {
  const { user } = useAuth();
  const [tribune, setTribune] = useState("Est");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event) { setTribune("Est"); setRow(""); setSeat(""); }
  }, [event]);

  if (!event) return null;

  const submit = async () => {
    if (!user) return;
    if (!row.trim() || !seat.trim()) {
      toast.error("Renseignez le rang et le siège");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      event_id: event.id,
      tribune,
      row_number: row.trim().slice(0, 8),
      seat: seat.trim().slice(0, 8),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    toast.success("Billet réservé 🎟️");
    onPurchased();
    onClose();
  };

  const date = new Date(event.starts_at);

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" /> Réserver un billet
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/30 p-4 mb-2">
          <div className="font-display font-semibold">{event.teams}</div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date.toLocaleDateString("fr-FR")}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>Tribune</Label>
            <Select value={tribune} onValueChange={setTribune}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIBUNES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="row">Rang</Label>
              <Input id="row" value={row} onChange={(e) => setRow(e.target.value)} placeholder="12" maxLength={8} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seat">Siège</Label>
              <Input id="seat" value={seat} onChange={(e) => setSeat(e.target.value)} placeholder="34" maxLength={8} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} disabled={submitting} className="gap-2">
            <Ticket className="h-4 w-4" />
            {submitting ? "Réservation…" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};