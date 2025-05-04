import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInviteByToken } from "../services/inviteService";
import { useAuth } from "../hooks/auth/useAuth";
import AcceptInviteButton from "../components/project/AcceptInviteButton";

export default function InvitePage() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInvite() {
      const data = await getInviteByToken(token);
      if (!data) {
        setError("Zaproszenie nie istnieje.");
        return;
      }
      if (data.expiresAt.toDate() < new Date()) {
        setError("Zaproszenie wygasło.");
        return;
      }
      if (data.usedCount >= data.maxUses) {
        setError("Limit użyć przekroczony.");
        return;
      }
      setInvite(data);
    }
    fetchInvite();
  }, [token]);

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (!invite) return <div className="p-8 text-center">Ładowanie...</div>;

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="backdrop-blur-md bg-white/70 p-8 rounded shadow">
          <p className="mb-4">Nie jesteś zalogowany!</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => navigate("/login?redirect=" + encodeURIComponent(window.location.pathname))}
          >
            Przejdź do logowania
          </button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Zaproszenie do projektu</h2>
        <p className="mb-4">Kliknij poniżej, aby dołączyć do projektu.</p>
        <AcceptInviteButton invite={invite} user={user} />
      </div>
    );
  }

  return null;
} 