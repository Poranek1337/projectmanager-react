import React from "react";
import InviteUserDialog from "@/components/dashboard/InviteUserDialog";

export default function InvitePopup({ projectId, onClose }) {
  return (
    <InviteUserDialog open={true} onOpenChange={onClose} projectId={projectId} />
  );
}
