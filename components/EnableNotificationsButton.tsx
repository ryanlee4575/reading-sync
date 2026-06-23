"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { createClient } from "@/lib/supabase/client";

type NotificationState =
  | "checking"
  | "enabled"
  | "disabled"
  | "blocked"
  | "unsupported";

export default function EnableNotificationsButton() {
  const [notificationState, setNotificationState] =
    useState<NotificationState>("checking");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setNotificationState("blocked");
      return;
    }

    const checkSubscription = () => {
      const optedIn = OneSignal.User.PushSubscription.optedIn;
      setNotificationState(optedIn ? "enabled" : "disabled");
      return optedIn;
    };

    if (checkSubscription()) return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (checkSubscription() || attempts === 10) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  async function updateNotifications(enable: boolean) {
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const subscriptionId = OneSignal.User.PushSubscription.id;

      if (enable) {
        await OneSignal.User.PushSubscription.optIn();

        const enabledSubscriptionId = OneSignal.User.PushSubscription.id;
        if (
          !enabledSubscriptionId ||
          !OneSignal.User.PushSubscription.optedIn
        ) {
          setNotificationState("disabled");
          return;
        }

        const { error } = await supabase
          .from("notification_subscriptions")
          .upsert(
            {
              user_id: user.id,
              onesignal_subscription_id: enabledSubscriptionId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "onesignal_subscription_id" }
          );

        if (error) throw error;

        setNotificationState("enabled");
        return;
      }

      await OneSignal.User.PushSubscription.optOut();

      if (subscriptionId) {
        const { error } = await supabase
          .from("notification_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("onesignal_subscription_id", subscriptionId);

        if (error) throw error;
      }

      setNotificationState("disabled");
    } catch (error) {
      console.error("Notification preference update failed:", error);
      setNotificationState("disabled");
    } finally {
      setSaving(false);
    }
  }

  if (notificationState === "unsupported") return null;

  if (notificationState === "blocked") {
    return (
      <p className="text-sm text-gray-500">
        Notifications are blocked in your browser settings.
      </p>
    );
  }

  const isEnabled = notificationState === "enabled";

  return (
    <label className="inline-flex items-center gap-3 text-sm">
      <span>Notifications</span>
      <input
        type="checkbox"
        checked={isEnabled}
        disabled={saving || notificationState === "checking"}
        onChange={(event) => updateNotifications(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
