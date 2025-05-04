import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/getInitials";

export default function UserAvatar({ user, className = "", size = "w-8 h-8", style }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Avatar className={`${size} ${className}`} style={style}>
      {user.photo && !imgError ? (
        <AvatarImage src={user.photo} alt={user.firstName} onError={() => setImgError(true)} />
      ) : (
        <AvatarFallback>{getInitials(user)}</AvatarFallback>
      )}
    </Avatar>
  );
} 