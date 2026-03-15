export function getEmailPrefix(email?: string | null) {
  const prefix = email?.split("@")[0]?.trim();
  return prefix || "membru";
}

export function getDisplayIdentity(fullName: string | null, email?: string | null) {
  const normalizedFullName = fullName?.trim() || null;
  const fallbackName = getEmailPrefix(email);
  const displayName = normalizedFullName || fallbackName;
  const initialsSource = normalizedFullName || fallbackName;
  const initials =
    initialsSource
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "M";

  return {
    displayName,
    firstName: normalizedFullName?.split(/\s+/)[0] || fallbackName,
    initials,
  };
}
