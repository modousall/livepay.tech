import { useEffect, useMemo, useState } from "react";
import { UsersRound, Copy, PlusCircle, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getEntityMembers, updateUserProfile, type UserProfile } from "@/lib/firebase";

type EntityRole = NonNullable<UserProfile["entityRole"]>;

export default function EntityMembersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const entityId = user?.entityId || user?.id;
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<EntityRole>("agent");

  const canManage = useMemo(() => {
    if (!user) return false;
    if (user.role === "superadmin" || user.role === "admin") return true;
    return user.entityRole === "owner" || user.entityRole === "admin";
  }, [user]);

  const loadMembers = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const data = await getEntityMembers(entityId);
      setMembers(data);
    } catch (error) {
      console.error("Error loading entity members:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres de l'entite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [entityId]);

  const handleCopyEntityId = async () => {
    if (!entityId) return;
    await navigator.clipboard.writeText(entityId);
    toast({ title: "ID entite copie" });
  };

  const handleAttachMember = async () => {
    if (!entityId) return;
    const trimmed = newMemberId.trim();
    if (!trimmed) {
      toast({ title: "Erreur", description: "Saisissez l'ID utilisateur.", variant: "destructive" });
      return;
    }
    try {
      await updateUserProfile(trimmed, { entityId, entityRole: newMemberRole });
      toast({ title: "Membre rattache", description: "L'utilisateur est maintenant lie a cette entite." });
      setNewMemberId("");
      setNewMemberRole("agent");
      await loadMembers();
    } catch (error) {
      console.error("Attach member failed:", error);
      toast({ title: "Erreur", description: "Impossible de rattacher ce membre.", variant: "destructive" });
    }
  };

  const handleRoleChange = async (memberId: string, role: EntityRole) => {
    try {
      await updateUserProfile(memberId, { entityRole: role });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, entityRole: role } : m)));
      toast({ title: "Role mis a jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de modifier le role.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-primary" />
            Gestion des membres d'entite
          </h1>
          <p className="text-muted-foreground">
            Rattachez plusieurs utilisateurs a une meme entite et distribuez les roles.
          </p>
        </div>
        {entityId && (
          <Button variant="outline" className="gap-2" onClick={handleCopyEntityId}>
            <Copy className="h-4 w-4" />
            Copier ID entite
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            ID entite actif
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{entityId || "Non disponible"}</Badge>
          <p className="text-sm text-muted-foreground">
            Partagez cet identifiant pour rattacher de nouveaux membres.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rattacher un membre existant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="member-id">ID utilisateur</Label>
              <Input
                id="member-id"
                value={newMemberId}
                onChange={(event) => setNewMemberId(event.target.value)}
                placeholder="UID Firebase de l'utilisateur"
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label>Role entite</Label>
              <Select value={newMemberRole} onValueChange={(value: EntityRole) => setNewMemberRole(value)} disabled={!canManage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="gap-2" onClick={handleAttachMember} disabled={!canManage}>
            <PlusCircle className="h-4 w-4" />
            Rattacher le membre
          </Button>
          {!canManage && (
            <p className="text-xs text-muted-foreground">
              Seuls les owners, admins ou super admins peuvent modifier les membres.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membres rattaches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre trouve.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role plateforme</TableHead>
                  <TableHead>Role entite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="font-medium">
                        {member.businessName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "Utilisateur"}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.id}</div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.entityRole || "agent"}
                        onValueChange={(value: EntityRole) => handleRoleChange(member.id, value)}
                        disabled={!canManage}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
