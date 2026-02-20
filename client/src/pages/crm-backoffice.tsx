import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  assignCrmTicket,
  createCrmAgent,
  getCrmAgents,
  getCrmSlaPolicies,
  getCrmTicketHistory,
  getCrmTickets,
  runCrmAutoEscalation,
  upsertCrmSlaPolicy,
  updateCrmTicketStatus,
  type CrmAgent,
  type CrmModule,
  type CrmTicket,
  type CrmTicketStatus,
} from "@/lib/firebase";

const MODULE_OPTIONS: CrmModule[] = [
  "appointments",
  "queue_management",
  "ticketing",
  "interventions",
  "banking_microfinance",
  "insurance",
  "telecom",
  "utilities",
];

export default function CrmBackofficePage() {
  const { user } = useAuth();
  const entityId = user?.entityId || user?.id;
  const { toast } = useToast();
  const [tickets, setTickets] = useState<CrmTicket[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [selectedModule, setSelectedModule] = useState<CrmModule | "all">("all");
  const [historyPreview, setHistoryPreview] = useState<Record<string, string>>({});
  const [newAgent, setNewAgent] = useState({ name: "", phone: "" });
  const [slaEdit, setSlaEdit] = useState({
    module: "appointments" as CrmModule,
    low: "1440",
    normal: "480",
    high: "120",
    critical: "30",
    escalation: "30",
  });

  const load = useCallback(async () => {
    if (!entityId) return;
    const [ticketsData, agentsData] = await Promise.all([getCrmTickets(entityId), getCrmAgents(entityId)]);
    setTickets(ticketsData);
    setAgents(agentsData);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTickets = useMemo(
    () => (selectedModule === "all" ? tickets : tickets.filter((t) => t.module === selectedModule)),
    [tickets, selectedModule]
  );

  const addAgent = async () => {
    if (!user || !newAgent.name || !entityId) return;
    await createCrmAgent({
      vendorId: entityId,
      name: newAgent.name,
      phone: newAgent.phone || undefined,
      active: true,
    });
    setNewAgent({ name: "", phone: "" });
    await load();
    toast({ title: "Agent ajoute" });
  };

  const saveSla = async () => {
    if (!entityId) return;
    await upsertCrmSlaPolicy(entityId, slaEdit.module, {
      targetMinutesLow: Number(slaEdit.low),
      targetMinutesNormal: Number(slaEdit.normal),
      targetMinutesHigh: Number(slaEdit.high),
      targetMinutesCritical: Number(slaEdit.critical),
      escalationMinutes: Number(slaEdit.escalation),
      active: true,
    } as any);
    toast({ title: "Politique SLA enregistree" });
    await getCrmSlaPolicies(entityId);
  };

  const moveTicket = async (ticket: CrmTicket, toStatus: CrmTicketStatus) => {
    if (!entityId) return;
    await updateCrmTicketStatus(ticket.id, entityId, ticket.status, toStatus, user?.email || "vendor");
    await load();
  };

  const assignTicket = async (ticket: CrmTicket, agentId: string) => {
    if (!user || !agentId || !entityId) return;
    await assignCrmTicket(ticket.id, entityId, agentId, user.email || "vendor");
    await load();
  };

  const escalateNow = async () => {
    if (!entityId) return;
    const count = await runCrmAutoEscalation(entityId, user?.email || "vendor");
    await load();
    toast({ title: "Escalade auto executee", description: `${count} ticket(s) escalade(s)` });
  };

  const previewHistory = async (ticketId: string) => {
    if (!entityId) return;
    const history = await getCrmTicketHistory(entityId, ticketId);
    setHistoryPreview((prev) => ({
      ...prev,
      [ticketId]: history
        .slice(-4)
        .map((h) => `${h.action} (${h.actor})`)
        .join(" -> "),
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">CRM Back-office</h1>
        <p className="text-muted-foreground">Tickets, SLA, assignation agents, escalade et historique</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Agents</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input placeholder="Nom agent" value={newAgent.name} onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Telephone" value={newAgent.phone} onChange={(e) => setNewAgent((p) => ({ ...p, phone: e.target.value }))} />
            <Button onClick={addAgent}>Ajouter agent</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {agents.map((a) => (
              <Badge key={a.id} variant="outline">{a.name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Politique SLA</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-6 gap-3">
          <Select value={slaEdit.module} onValueChange={(v) => setSlaEdit((p) => ({ ...p, module: v as CrmModule }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULE_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="low" value={slaEdit.low} onChange={(e) => setSlaEdit((p) => ({ ...p, low: e.target.value }))} />
          <Input type="number" placeholder="normal" value={slaEdit.normal} onChange={(e) => setSlaEdit((p) => ({ ...p, normal: e.target.value }))} />
          <Input type="number" placeholder="high" value={slaEdit.high} onChange={(e) => setSlaEdit((p) => ({ ...p, high: e.target.value }))} />
          <Input type="number" placeholder="critical" value={slaEdit.critical} onChange={(e) => setSlaEdit((p) => ({ ...p, critical: e.target.value }))} />
          <Input type="number" placeholder="escalation" value={slaEdit.escalation} onChange={(e) => setSlaEdit((p) => ({ ...p, escalation: e.target.value }))} />
          <div className="md:col-span-6 flex gap-2">
            <Button onClick={saveSla}>Enregistrer SLA</Button>
            <Button variant="outline" onClick={escalateNow}>Executer escalade auto</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Tickets CRM</span>
            <Select value={selectedModule} onValueChange={(v) => setSelectedModule(v as CrmModule | "all")}>
              <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all modules</SelectItem>
                {MODULE_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-muted-foreground">{ticket.module} - {ticket.customerName || "-"} ({ticket.customerPhone || "-"})</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ticket.priority}</Badge>
                  <Badge>{ticket.status}</Badge>
                  {ticket.escalated && <Badge variant="destructive">escalated L{ticket.escalationLevel}</Badge>}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                SLA: {ticket.slaDueAt?.toLocaleString("fr-FR") || "-"} | Escalade: {ticket.escalationDueAt?.toLocaleString("fr-FR") || "-"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={ticket.assignedAgentId || ""} onValueChange={(v) => assignTicket(ticket, v)}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Assigner agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => moveTicket(ticket, "in_progress")}>In progress</Button>
                <Button size="sm" variant="outline" onClick={() => moveTicket(ticket, "waiting_customer")}>Waiting customer</Button>
                <Button size="sm" variant="outline" onClick={() => moveTicket(ticket, "resolved")}>Resolve</Button>
                <Button size="sm" onClick={() => moveTicket(ticket, "closed")}>Close</Button>
                <Button size="sm" variant="ghost" onClick={() => previewHistory(ticket.id)}>Historique</Button>
              </div>
              {historyPreview[ticket.id] && (
                <p className="text-xs text-muted-foreground">{historyPreview[ticket.id]}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

