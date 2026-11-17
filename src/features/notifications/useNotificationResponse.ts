import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

/**
 * Opens the event detail when the user taps an event reminder.
 * The last response is also consumed on cold start; request identifiers avoid
 * opening the same event twice when the listener and cold-start path overlap.
 */
export function useNotificationResponse(): void {
  const router = useRouter();
  const handledRequestId = useRef<string | null>(null);

  useEffect(() => {
    type Response = NonNullable<
      Awaited<ReturnType<typeof Notifications.getLastNotificationResponseAsync>>
    >;

    const openEvent = (response: Response) => {
      const request = response.notification.request;
      const uid = request.content.data?.uid;
      if (typeof uid !== 'string' || !uid) return;
      if (handledRequestId.current === request.identifier) return;
      handledRequestId.current = request.identifier;
      router.push(`/event/${encodeURIComponent(uid)}`);
      const clearLast = (
        Notifications as typeof Notifications & {
          clearLastNotificationResponseAsync?: () => Promise<void>;
        }
      ).clearLastNotificationResponseAsync;
      void clearLast?.().catch(() => {});
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(openEvent);
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) openEvent(response);
      })
      .catch(() => {});

    return () => subscription.remove();
  }, [router]);
}
