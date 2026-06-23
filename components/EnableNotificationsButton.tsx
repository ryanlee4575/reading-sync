"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";

type NotificationState = "idle" | "requesting" | "enabled" | "blocked" | "unsupported";

function getNotificationState(): NotificationState {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "enabled";
  if (Notification.permission === "denied") return "blocked";
  return "idle";
}

export default function EnableNotificationsButton() {
  const [notificationState, setNotificationState] =
    useState<NotificationState>("idle");

  useEffect(() => {
    setNotificationState(getNotificationState());
  }, []);

  async function enableNotifications() {
    setNotificationState("requesting");

    try {
      const granted = await OneSignal.Notifications.requestPermission();
      setNotificationState(granted ? "enabled" : getNotificationState());
    } catch (error) {
      console.error("Notification permission request failed:", error);
      setNotificationState(getNotificationState());
    }
  }

  if (notificationState === "unsupported") return null;

  if (notificationState === "enabled") {
    return <p className="text-sm text-green-700">Notifications enabled</p>;
  }

  if (notificationState === "blocked") {
    return (
      <p className="text-sm text-gray-500">
        Notifications are blocked in your browser settings.
      </p>
    );
  }

  return (
    <button
      onClick={enableNotifications}
      disabled={notificationState === "requesting"}
      className="rounded-lg border px-4 py-2 text-sm disabled:text-gray-400"
    >
      {notificationState === "requesting"
        ? "Enabling..."
        : "Enable notifications"}
    </button>
  );
}
