"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

export default function OneSignalProvider() {
  const initialization = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const supabase = createClient();

    if (!appId) return;

    const oneSignalAppId = appId;

    async function initialize() {
      await OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await OneSignal.login(user.id);
      }
    }

    if (!initialization.current) {
      initialization.current = initialize();
    }

    const initializationPromise = initialization.current;

    void initializationPromise.catch((error) => {
      console.error("OneSignal initialization failed:", error);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void initializationPromise
        .then(() =>
          session?.user
            ? OneSignal.login(session.user.id)
            : OneSignal.logout()
        )
        .catch((error) => {
          console.error("OneSignal user update failed:", error);
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
