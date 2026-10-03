"use client";

export function SignOut() {
  return (
    <button
      className="text-xs text-neutral-600 hover:text-neutral-300"
      onClick={async () => {
        await fetch("/api/login", { method: "DELETE" });
        window.location.href = "/login";
      }}
    >
      sign out
    </button>
  );
}
