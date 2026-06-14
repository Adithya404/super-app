export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function showMessageNotification(options: {
  title: string;
  body: string;
  roomId: string;
  onClick?: () => void;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(options.title, {
    body: options.body,
    tag: `pingpal-${options.roomId}`,
    icon: "/favicon.ico",
  });

  notification.onclick = () => {
    window.focus();
    options.onClick?.();
    notification.close();
  };
}
