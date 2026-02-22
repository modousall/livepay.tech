import { useEffect, useMemo, useState } from "react";
import { UsersRound, Copy, PlusCircle, ShieldCheck, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getEntityMembers, updateUserProfile, type UserProfile, registerWithEmail } from "@/lib/firebase";

type EntityRole = NonNullable<UserProfile["entityRole"]>;

export default function EntityMembersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const entityId = user?.entityId || user?.id;
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<EntityRole>("agent");
  
  // Creation utilisateur avec Firebase Auth
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");

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
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading entity members:", error);
      // Ne pas afficher d'erreur si aucun membre - c'est normal pour une nouvelle entite
      if ((error as any).message?.includes("not found")) {
        setMembers([]);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les membres de l'entite.",
          variant: "destructive",
        });
      }
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

  const handleCreateUser = async () => {
    if (!entityId) return;
    if (!newUserEmail || !newUserPassword) {
      toast({ title: "Erreur", description: "Email et mot de passe requis.", variant: "destructive" });
      return;
    }
    
    setCreatingUser(true);
    try {
      // Creation utilisateur avec Firebase Auth
      const newUser = await registerWithEmail(newUserEmail, newUserPassword, {
        firstName: newUserName.split(" ")[0] || "",
        lastName: newUserName.split(" ").slice(1).join(" ") || "",
        entityId,
      });
      
      // Update entity role
      await updateUserProfile(newUser.id, { entityRole: newMemberRole });
      
      toast({ 
        title: "Utilisateur cree", 
        description: "L'utilisateur a ete cree et rattache a l'entite." 
      });
      
      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setShowCreateDialog(false);
      await loadMembers();
    } catch (error) {
      console.error("Create user failed:", error);
      toast({ 
        title: "Erreur", 
        description: (error as Error).message || "Impossible de creer l'utilisateur.", 
        variant: "destructive" 
      });
    } finally {
      setCreatingUser(false);
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
          <CardTitle className="flex items-center justify-between">
            <span>Membres de l'entite</span>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" variant="outline" disabled={!canManage}>
                  <UserPlus className="h-4 w-4" />
                  Creer un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creer un utilisateur et le rattacher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUserName">Nom complet</Label>
                    <Input
                      id="newUserName"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">Email</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="jean@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPassword">Mot de passe</Label>
                    <Input
                      id="newUserPassword"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role entite</Label>
                    <Select value={newMemberRole} onValueChange={(value: EntityRole) => setNewMemberRole(value)}>
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
                  <Button className="w-full" onClick={handleCreateUser} disabled={creatingUser}>
                    {creatingUser ? "Creation en cours..." : "Creer et rattacher"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
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
            <div className="text-center py-8">
              <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Aucun membre dans cette entite.</p>
              <p className="text-xs text-muted-foreground">
                Partagez l'ID d'entite avec vos collaborateurs pour les rattacher.
              </p>
            </div>
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
