
import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClerkEvent = {
  type: string;
  data: any;
};

export async function POST(req: Request) {
  const svixId = headers().get("svix-id");
  const svixTimestamp = headers().get("svix-timestamp");
  const svixSignature = headers().get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing Svix headers", { status: 400 });
  }

  const payload = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new NextResponse("Server misconfigured", { status: 500 });
  }
  const wh = new Webhook(secret);

  let evt: ClerkEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;
  const id = data.id as string;
  const emailAddress =
    data.email_addresses?.[0]?.email_address ?? "no-email@example.com";
  const firstName = data.first_name ?? null;
  const lastName = data.last_name ?? null;
  const imageUrl = data.image_url ?? null;

  try {
    if (type === "user.created" || type === "user.updated") {
      await db.user.upsert({
        where: { id },
        update: { emailAddress, firstName, lastName, imageUrl },
        create: { id, emailAddress, firstName, lastName, imageUrl },
      });
    }

    if (type === "user.deleted") {
      await db.user.delete({ where: { id } }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook DB error:", e);
    return new NextResponse("DB error", { status: 500 });
  }
}
