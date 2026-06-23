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

    async function saveSubscription(userId: string) {
      const subscriptionId = OneSignal.User.PushSubscription.id;

      if (!subscriptionId || !OneSignal.User.PushSubscription.optedIn) return;

      const { error } = await supabase.from("notification_subscriptions").upsert(
        {
          user_id: userId,
          onesignal_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "onesignal_subscription_id" }
      );

      if (error) {
        console.error("Saving the OneSignal subscription failed:", error);
      }
    }

    async function initialize() {
      await OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerParam: { scope: "/" },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await OneSignal.login(user.id);
        await saveSubscription(user.id);
      }
    }

    if (!initialization.current) {
      initialization.current = initialize();
    }

    const initializationPromise = initialization.current;
    let disposed = false;

    const handleSubscriptionChange = () => {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          return saveSubscription(user.id);
        }
      });
    };

    void initializationPromise.catch((error) => {
      console.error("OneSignal initialization failed:", error);
    });

    void initializationPromise.then(() => {
      if (!disposed) {
        OneSignal.User.PushSubscription.addEventListener(
          "change",
          handleSubscriptionChange
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void initializationPromise
        .then(async () => {
          if (session?.user) {
            await OneSignal.login(session.user.id);
            await saveSubscription(session.user.id);
          } else {
            await OneSignal.logout();
          }
        })
        .catch((error) => {
          console.error("OneSignal user update failed:", error);
        });
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
      OneSignal.User.PushSubscription.removeEventListener(
        "change",
        handleSubscriptionChange
      );
    };
  }, []);

  return null;
}
