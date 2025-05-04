// Uniwersalna funkcja do pobierania inicjałów użytkownika
export function getInitials(user) {
  if (!user) return "?";
  const first = user.firstName?.[0] || "";
  const last = user.lastName?.[0] || "";
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  if (last) return last.toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  if (user.uid) return user.uid[0].toUpperCase();
  return "?";
} 