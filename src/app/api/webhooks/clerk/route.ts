import { Webhook } from "svix";
import type { WebhookEvent, UserJSON } from "@clerk/nextjs/server";
import { db } from "../../../../server/db.ts";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET ) {
    return res.status(400).send("Missing secret");
  }     

  // 1️⃣ Get headers directly from Node
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send("Missing svix headers");
  }

  const payload = JSON.stringify(req.body);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return res.status(400).send("Invalid signature");
  }

  if (evt.type === "user.created") {
    const user = evt.data as UserJSON;

    const id = user.id;
    const emailAddress =
      user.email_addresses?.[0]?.email_address ?? "no-email@example.com";
    const firstName = user.first_name ?? "";
    const lastName = user.last_name ?? "";
    const imageUrl = user.image_url ?? "";

    await db.user.upsert({
      where: { id },
      update: { emailAddress, firstName, lastName, imageUrl },
      create: { id, emailAddress, firstName, lastName, imageUrl },
    });

    console.log("✅ User created/updated:", emailAddress);
  }

  return res.status(200).send("OK");
}
