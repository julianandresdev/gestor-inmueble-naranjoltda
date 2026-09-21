"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { enviarLatido } from "@/app/actions-presencia";

export function PresenceHeartbeat({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const sessionIdRef = useRef<string>("");
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    try {
      let sid = sessionStorage.getItem("app_presence_session_id");
      if (!sid) {
        sid = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem("app_presence_session_id", sid);
      }
      sessionIdRef.current = sid;
    } catch {
      sessionIdRef.current = `sess_${Date.now()}`;
    }

    const sendBeat = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      lastSentRef.current = now;
      try {
        await enviarLatido(sessionIdRef.current, pathname || "/");
      } catch (err) {
        // Silently swallow client network failure
      }
    };

    // Envío inmediato al montar o cambiar de ruta
    sendBeat();

    // Intervalo de 60 segundos
    const interval = setInterval(sendBeat, 60000);

    // Escuchar cambios de visibilidad de la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastSentRef.current >= 45000) {
          sendBeat();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, pathname]);

  return null;
}
