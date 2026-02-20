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
  createServiceIntervention,
  getServiceInterventions,
  updateServiceIntervention,
  type CrmAgent,
  type CrmPriority,
  type CrmTicket,
  type ServiceIntervention,
  type ServiceInterventionStatus,
} from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NEXT_STATUS: Record<ServiceInterventionStatus, ServiceInterventionStatus> = {
  new: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
  closed: "closed",
};

export default function InterventionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ServiceIntervention[]>([]);
  const [crmBySource, setCrmBySource] = useState<Record<string, CrmTicket>>({});
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState<CrmPriority>("normal");
  const [assignedAgentId, setAssignedAgentId] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    customerName: "",
    customerPhone: "",
    location: "",
    assignedTo: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getServiceInterventions(user.id), getCrmAgents(user.id)]);
      setItems(data);
      setAgents(agentsData);
      const crmEntries = await Promise.all(
        data.map(async (it) => [it.id, await getCrmTicketBySource(user.id, "interventions", it.id)] as const)
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
    if (!form.title || !form.customerName || !form.customerPhone) {
      toast({ title: "Champs requis", description: "Titre, client et telephone sont obligatoires", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await createServiceIntervention({
        vendorId: user.id,
        title: form.title,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        location: form.location || undefined,
        priority: "normal",
        assignedTo: form.assignedTo || undefined,
        status: "new",
        openedAt: new Date(),
      });
      const crmTicket = await createCrmTicket({
        vendorId: user.id,
        module: "interventions",
        sourceRefId: created.id,
        title: created.title,
        customerName: created.customerName,
        customerPhone: created.customerPhone,
        priority,
        status: "open",
      });
      if (assignedAgentId) {
        await assignCrmTicket(crmTicket.id, user.id, assignedAgentId, user.email || "vendor");
      }
      setForm({ title: "", customerName: "", customerPhone: "", location: "", assignedTo: "" });
      setPriority("normal");
      setAssignedAgentId("");
      await load();
      toast({ title: "Intervention enregistree" });
    } finally {
      setSaving(false);
    }
  };

  const moveNext = async (item: ServiceIntervention) => {
    const status = NEXT_STATUS[item.status];
    await updateServiceIntervention(item.id, {
      status,
      closedAt: status === "closed" ? new Date() : item.closedAt,
    });
    const ticket = await getCrmTicketBySource(user!.id, "interventions", item.id);
    if (ticket) {
      const toStatus = status === "closed" ? "closed" : "in_progress";
      await updateCrmTicketStatus(ticket.id, user!.id, ticket.status, toStatus, user?.email || "vendor", `intervention:${status}`);
    }
    await load();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Interventions</h1>
        <p className="text-muted-foreground">Suivi terrain des demandes clients</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nouvelle intervention</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-3">
          <div className="space-y-1"><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Client</Label><Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Telephone</Label><Input value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Localisation</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Assigne a</Label><Input value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} /></div>
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
          <div className="md:col-span-5"><Button onClick={createItem} disabled={saving}>{saving ? "Creation..." : "Creer intervention"}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tableau des interventions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune intervention ouverte.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.customerName} ({item.customerPhone}) - {item.location || "Lieu non specifie"}
                  </p>
                  {crmBySource[item.id]?.slaDueAt && (
                    <p className="text-xs text-muted-foreground">
                      SLA: {crmBySource[item.id].slaDueAt?.toLocaleString("fr-FR")} - Agent: {crmBySource[item.id].assignedAgentId || "non assigne"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => moveNext(item)}>Etape suivante</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
