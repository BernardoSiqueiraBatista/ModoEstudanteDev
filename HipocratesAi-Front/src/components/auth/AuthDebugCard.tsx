import React from "react";
import { useAuth } from "../../auth/AuthProvider";

export default function AuthDebugCard() {
  const { loading, user, doctor, session } = useAuth();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <h3 className="mb-3 font-bold text-slate-800">Debug de autenticação</h3>

      <div className="space-y-1 text-slate-600">
        <p><strong>loading:</strong> {String(loading)}</p>
        <p><strong>user.id:</strong> {user?.id ?? "null"}</p>
        <p><strong>user.email:</strong> {user?.email ?? "null"}</p>
        <p><strong>session:</strong> {session ? "ativa" : "null"}</p>
        <p><strong>doctor.id:</strong> {doctor?.id ?? "null"}</p>
        <p><strong>doctor.full_name:</strong> {doctor?.full_name ?? "null"}</p>
        <p><strong>doctor.email:</strong> {doctor?.email ?? "null"}</p>
        <p><strong>doctor.specialty:</strong> {doctor?.specialty ?? "null"}</p>
      </div>
    </div>
  );
}