import { useState } from "react";
import { useDataProvider, useNotify, useRefresh } from "react-admin";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_CHOICES, type UserInvite, type UserRole } from "./schemas";
import type { CrmDataProvider } from "../../providers/types";

interface UserInviteFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UserInviteForm = ({ open, onClose, onSuccess }: UserInviteFormProps) => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();
  const refresh = useRefresh();

  const [formData, setFormData] = useState<Partial<UserInvite>>({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "rep",
  });
  const [error, setError] = useState<string | null>(null);

  const { mutate: inviteUser, isPending } = useMutation({
    mutationFn: async (data: UserInvite) => {
      return dataProvider.inviteUser(data);
    },
    onSuccess: () => {
      notify("User invited successfully");
      refresh();
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to invite user");
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      role: "rep",
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    inviteUser(formData as UserInvite);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              aria-invalid={!!error}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CHOICES.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id}>
                    {choice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="h-11">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-11">
              {isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
