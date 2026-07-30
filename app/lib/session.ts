export async function syncSessionCookie(idToken: string | null) {
  if (idToken) {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } else {
    await fetch("/api/session", { method: "DELETE" });
  }
}
