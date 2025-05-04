import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";

export async function createInvite(projectId, expiresInHours, maxUses, createdBy) {
  const token = uuidv4();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + expiresInHours * 3600 * 1000));
  await addDoc(collection(db, "invites"), {
    projectId,
    token,
    expiresAt,
    maxUses,
    usedCount: 0,
    createdBy,
  });
  return `/invite/${token}`;
}

export async function getInviteByToken(token) {
  const q = query(collection(db, "invites"), where("token", "==", token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), id: snap.docs[0].id };
} 