import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function InvitePopup({ projectId, onClose }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zaproś użytkownika</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Tutaj możesz dodać formularz do zapraszania użytkowników do projektu o ID: <span className="font-mono text-indigo-600">{projectId}</span>.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
