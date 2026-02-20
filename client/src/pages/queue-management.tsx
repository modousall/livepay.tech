import { useCallback, useEffect, useMemo, useState } from "react";

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
  createQueueTicket,
  getQueueTickets,
  updateQueueTicket,
  type CrmAgent,
  type CrmPriority,
  type CrmTicket,
  type QueueTicket,
} from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QueueManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<QueueTicket[]>([]);
  const [crmBySource, setCrmBySource] = useState<Record<string, CrmTicket>>({});
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState<CrmPriority>("normal");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    servicePoint: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getQueueTickets(user.id), getCrmAgents(user.id)]);
      setItems(data);
      setAgents(agentsData);
      const crmEntries = await Promise.all(
        data.map(async (it) => [it.id, await getCrmTicketBySource(user.id, "queue_management", it.id)] as const)
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

  const nextQueueNumber = useMemo(
    () => (items.length ? Math.max(...items.map((x) => x.queueNumber || 0)) + 1 : 1),
    [items]
  );

  const createItem = async () => {
    if (!user) return;
    if (!form.customerName || !form.customerPhone || !form.servicePoint) {
      toast({ title: "Champs requis", description: "Renseignez tous les champs", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createQueueTicket({
        vendorId: user.id,
        queueNumber: nextQueueNumber,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        servicePoint: form.servicePoint,
        priority: "normal",
        status: "waiting",
      });
      const crmTicket = await createCrmTicket({
        vendorId: user.id,
        module: "queue_management",
        sourceRefId: created.id,
        title: `Queue #${created.queueNumber} - ${created.servicePoint}`,
        customerName: created.customerName,
        customerPhone: created.customerPhone,
        priority,
        status: "open",
      });
      if (assignedAgentId) {
        await assignCrmTicket(crmTicket.id, user.id, assignedAgentId, user.email || "vendor");
      }
      setForm({ customerName: "", customerPhone: "", servicePoint: "" });
      setPriority("normal");
      setAssignedAgentId("");
      await load();
      toast({ title: "Ticket file cree" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: QueueTicket, status: QueueTicket["status"]) => {
    await updateQueueTicket(item.id, {
      status,
      calledAt: status === "called" ? new Date() : item.calledAt,
      servedAt: status === "completed" ? new Date() : item.servedAt,
    });
    const ticket = await getCrmTicketBySource(user!.id, "queue_management", item.id);
    if (ticket) {
      const toStatus =
        status === "completed" || status === "cancelled" || status === "missed"
          ? "closed"
          : "in_progress";
      await updateCrmTicketStatus(ticket.id, user!.id, ticket.status, toStatus, user?.email || "vendor", `queue:${status}`);
    }
    await load();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">File d'attente</h1>
        <p className="text-muted-foreground">Tickets numeriques et appel des clients</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nouveau ticket</CardTitle></CardHeader>
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
            <Label>Guichet / service</Label>
            <Input value={form.servicePoint} onChange={(e) => setForm((p) => ({ ...p, servicePoint: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Numero attribue</Label>
            <Input value={String(nextQueueNumber)} disabled />
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
            <Button onClick={createItem} disabled={saving}>{saving ? "Creation..." : "Creer ticket"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tickets en cours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ticket enregistree.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">#{item.queueNumber} - {item.customerName}</p>
                  <p className="text-sm text-muted-foreground">{item.customerPhone} - {item.servicePoint}</p>
                  {crmBySource[item.id]?.slaDueAt && (
                    <p className="text-xs text-muted-foreground">
                      SLA: {crmBySource[item.id].slaDueAt?.toLocaleString("fr-FR")} - Agent: {crmBySource[item.id].assignedAgentId || "non assigne"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item, "called")}>Appeler</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item, "serving")}>Servir</Button>
                  <Button size="sm" onClick={() => updateStatus(item, "completed")}>Terminer</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
