/**
 * Web Push (opcional). Requer:
 * - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
 * - tabela push_subscriptions
 * - pacote web-push (npm i web-push)
 *
 * Se chaves ou pacote faltarem, no-op.
 */

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@familytasks.app";

  if (!publicKey || !privateKey) return;

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    console.warn("[push] web-push não instalado — npm i web-push");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  // Service role para ler subscriptions de qualquer user
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const admin = createClient(url, key);
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const body = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }),
  );
}
