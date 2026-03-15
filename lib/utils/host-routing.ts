export const hostnames = {
  marketing: "armatadetraderi.com",
  app: "app.armatadetraderi.com",
  admin: "admin.armatadetraderi.com",
} as const;

export type HostRole = "marketing" | "app" | "admin" | "local";

export function getHostRole(hostname: string): HostRole {
  const normalizedHostname = hostname.toLowerCase();

  if (normalizedHostname === hostnames.app) {
    return "app";
  }

  if (normalizedHostname === hostnames.admin) {
    return "admin";
  }

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname.endsWith(".localhost")
  ) {
    return "local";
  }

  return "marketing";
}

export function isMemberFacingPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/upgrade" ||
    pathname.startsWith("/dashboard")
  );
}

export function getAbsoluteHostUrl(target: "marketing" | "app" | "admin", path: string) {
  return `https://${hostnames[target]}${path}`;
}
