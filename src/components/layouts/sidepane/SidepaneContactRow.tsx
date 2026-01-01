import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidepaneContactRowProps {
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
  onClick?: () => void;
}

export function SidepaneContactRow({
  firstName,
  lastName,
  role,
  email,
  onClick,
}: SidepaneContactRowProps) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left h-auto min-h-11"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fullName}</p>
        {role && <p className="text-xs text-muted-foreground truncate">{role}</p>}
        {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
      </div>
    </button>
  );
}
