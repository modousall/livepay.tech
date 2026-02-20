import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  assignCrmTicket,
  createCrmTicket,
  getCrmAgents,
  getCrmTicketBySource,
  updateCrmTicketStatus,
  createEventTicket,
  getEventTickets,
  updateEventTicket,
  type CrmAgent,
  type CrmPriority,
  type CrmTicket,
  type EventTicket,
} from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TicketingOpsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<EventTicket[]>([]);
  const [crmBySource, setCrmBySource] = useState<Record<string, CrmTicket>>({});
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState<CrmPriority>("normal");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [form, setForm] = useState({
    eventName: "",
    eventCode: "",
    customerName: "",
    customerPhone: "",
    seatLabel: "",
    amount: "0",
    eventDate: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getEventTickets(user.id), getCrmAgents(user.id)]);
      setItems(data);
      setAgents(agentsData);
      const crmEntries = await Promise.all(
        data.map(async (it) => [it.id, await getCrmTicketBySource(user.id, "ticketing", it.id)] as const)
      );
      const map: Record<string, CrmTicket> = {};
      crmEntries.forEach(([id, ticket]) => {
        if (ticket) map[id] = ticket;
      });
      setCrmBySource(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const createItem = async () => {
    if (!user) return;
    if (!form.eventName || !form.eventCode || !form.customerName || !form.customerPhone) {
      toast({ title: "Champs requis", description: "Renseignez les champs obligatoires", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createEventTicket({
        vendorId: user.id,
        eventName: form.eventName,
        eventCode: form.eventCode.toUpperCase(),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        seatLabel: form.seatLabel || undefined,
        ticketCode: `${form.eventCode.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        amount: Number(form.amount || 0),
        status: "issued",
        eventDate: form.eventDate ? new Date(form.eventDate) : undefined,
      });
      const crmTicket = await createCrmTicket({
        vendorId: user.id,
        module: "ticketing",
        sourceRefId: created.id,
        title: `Ticket ${created.eventCode} - ${created.eventName}`,
        customerName: created.customerName,
        customerPhone: created.customerPhone,
        priority,
        status: "open",
      });
      if (assignedAgentId) {
        await assignCrmTicket(crmTicket.id, user.id, assignedAgentId, user.email || "vendor");
      }
      setForm({ eventName: "", eventCode: "", customerName: "", customerPhone: "", seatLabel: "", amount: "0", eventDate: "" });
      setPriority("normal");
      setAssignedAgentId("");
      await load();
      toast({ title: "Ticket genere" });
    } finally {
      setSaving(false);
    }
  };

  const markCheckedIn = async (item: EventTicket) => {
    await updateEventTicket(item.id, { status: "checked_in" });
    const ticket = await getCrmTicketBySource(user!.id, "ticketing", item.id);
    if (ticket) {
      await updateCrmTicketStatus(ticket.id, user!.id, ticket.status, "closed", user?.email || "vendor", "ticket:checked_in");
    }
    await load();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Billetterie</h1>
        <p className="text-muted-foreground">Emission, suivi et controle des tickets evenementiels</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Emettre un ticket</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label>Evenement</Label><Input value={form.eventName} onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Code event</Label><Input value={form.eventCode} onChange={(e) => setForm((p) => ({ ...p, eventCode: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Client</Label><Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Telephone</Label><Input value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Place</Label><Input value={form.seatLabel} onChange={(e) => setForm((p) => ({ ...p, seatLabel: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Montant</Label><Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Date event</Label><Input type="datetime-local" value={form.eventDate} onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label>Priorite SLA</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as CrmPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="normal">normal</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="critical">critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Agent assigne</Label>
            <Select value={assignedAgentId} onValueChange={setAssignedAgentId}>
              <SelectTrigger><SelectValue placeholder="Selectionner agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4"><Button onClick={createItem} disabled={saving}>{saving ? "Emission..." : "Generer ticket"}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tickets emis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ticket emis.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.eventName} - {item.ticketCode}</p>
                  <p className="text-sm text-muted-foreground">{item.customerName} ({item.customerPhone}) - {item.amount.toLocaleString("fr-FR")} FCFA</p>
                  {crmBySource[item.id]?.slaDueAt && (
                    <p className="text-xs text-muted-foreground">
                      SLA: {crmBySource[item.id].slaDueAt?.toLocaleString("fr-FR")} - Agent: {crmBySource[item.id].assignedAgentId || "non assigne"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await updateEventTicket(item.id, { status: "paid" });
                      const ticket = await getCrmTicketBySource(user!.id, "ticketing", item.id);
                      if (ticket) {
                        await updateCrmTicketStatus(ticket.id, user!.id, ticket.status, "in_progress", user?.email || "vendor", "ticket:paid");
                      }
                      await load();
                    }}
                  >
                    Marquer paye
                  </Button>
                  <Button size="sm" onClick={() => markCheckedIn(item)}>Check-in</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
