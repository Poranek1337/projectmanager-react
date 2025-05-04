import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";

const roleLabels = {
  owner: "Właściciel",
  admin: "Admin",
  user: "Użytkownik",
};

function getInitials(user) {
  if (!user) return "?";
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  if (first || last) return (first + last).toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  if (user.uid) return user.uid[0].toUpperCase();
  return "?";
}

export default function UserRow({ user, userDetails, project, canManage, currentUser, loading, handleRoleChange, handleRemove }) {
  const isOwner = user.role === "owner";
  const isCurrent = currentUser?.uid === user.uid;

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 px-3 flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.photo} alt={user.firstName} />
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.firstName} {user.lastName}</span>
          <span className="text-xs text-zinc-500">{user.email}</span>
        </div>
      </td>
      <td className="py-2 px-3">
        {canManage && !isOwner ? (
          <Select
            value={user.role}
            onChange={role => handleRoleChange(user, role)}
            disabled={loading}
          >
            <SelectItem value="user">Użytkownik</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </Select>
        ) : (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
            {roleLabels[user.role] || user.role}
          </span>
        )}
      </td>
      {canManage && (
        <td className="py-2 px-3">
          {!isOwner && !isCurrent && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemove(user)}
              disabled={loading}
              className="text-xs px-2 py-1"
            >
              Usuń
            </Button>
          )}
        </td>
      )}
    </tr>
  );
} 