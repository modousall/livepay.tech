import { useCallback, useEffect, useState } from "react";

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
  createAppointment,
  createCrmTicket,
  getCrmAgents,
  getCrmTicketBySource,
  getAppointments,
  updateCrmTicketStatus,
  updateAppointment,
  type Appointment,
  type AppointmentStatus,
  type CrmAgent,
  type CrmPriority,
  type CrmTicket,
} from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_ORDER: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export default function AppointmentsPage() {
  const { user } = useAuth();\r\n  const entityId = user?.entityId || user?.id;
  const { toast } = useToast();
  const [items, setItems] = useState<Appointment[]>([]);
  const [crmBySource, setCrmBySource] = useState<Record<string, CrmTicket>>({});
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState<CrmPriority>("normal");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    serviceType: "",
    scheduledAt: "",
  });

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getAppointments(entityId), getCrmAgents(entityId)]);
      setItems(data);
      setAgents(agentsData);
      const crmEntries = await Promise.all(
        data.map(async (it) => [it.id, await getCrmTicketBySource(entityId, "appointments", it.id)] as const)
      );
      const map: Record<string, CrmTicket> = {};
      crmEntries.forEach(([id, ticket]) => {
        if (ticket) map[id] = ticket;
      });
      setCrmBySource(map);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const createItem = async () => {
    if (!entityId) return;
    if (!form.customerName || !form.customerPhone || !form.serviceType || !form.scheduledAt) {
      toast({ title: "Champs requis", description: "Renseignez tous les champs", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createAppointment({
        vendorId: entityId,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        serviceType: form.serviceType,
        scheduledAt: new Date(form.scheduledAt),
        status: "pending",
      });
      const crmTicket = await createCrmTicket({
        vendorId: entityId,
        module: "appointments",
        sourceRefId: created.id,
        title: `Creneau - ${form.serviceType}`,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        priority,
        status: "open",
      });
      if (assignedAgentId) {
        await assignCrmTicket(crmTicket.id, entityId, assignedAgentId, user.email || "vendor");
      }
      setForm({ customerName: "", customerPhone: "", serviceType: "", scheduledAt: "" });
      setPriority("normal");
      setAssignedAgentId("");
      await load();
      toast({ title: "Creneau cree" });
    } finally {
      setSaving(false);
    }
  };

  const nextStatus = async (item: Appointment) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
    await updateAppointment(item.id, { status: next });
    const ticket = await getCrmTicketBySource(user!.id, "appointments", item.id);
    if (ticket) {
      const toStatus =
        next === "completed" || next === "cancelled" || next === "no_show"
          ? "closed"
          : "in_progress";
      await updateCrmTicketStatus(ticket.id, user!.id, ticket.status, toStatus, user?.email || "vendor", `appointment:${next}`);
    }
    await load();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-muted-foreground">Gestion des creneaux et confirmations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau Agenda</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label>Client</Label>
            <Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Telephone</Label>
            <Input value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Service</Label>
            <Input value={form.serviceType} onChange={(e) => setForm((p) => ({ ...p, serviceType: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Date/heure</Label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
          </div>
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
          <div className="md:col-span-4">
            <Button onClick={createItem} disabled={saving}>{saving ? "Creation..." : "Ajouter un creneau"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun Agenda pour le moment.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.customerName} - {item.serviceType}</p>
                  <p className="text-sm text-muted-foreground">{item.customerPhone} - {item.scheduledAt.toLocaleString("fr-FR")}</p>
                  {crmBySource[item.id]?.slaDueAt && (
                    <p className="text-xs text-muted-foreground">
                      SLA: {crmBySource[item.id].slaDueAt?.toLocaleString("fr-FR")} - Agent: {crmBySource[item.id].assignedAgentId || "non assigne"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <Button variant="outline" size="sm" onClick={() => nextStatus(item)}>Statut suivant</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}



