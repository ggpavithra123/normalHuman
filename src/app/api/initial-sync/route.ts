import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { userId } = body;

    console.log("📥 Received POST request for initial sync");
    console.log("➡️ userId:", userId);

    if (!userId) {
      console.error("❌ Missing userId in request body");
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    // ✅ Fetch all accounts for this user, newest first
    const dbAccount = await db.account.findFirst({
      where: { userId },
      orderBy: { id: "desc" }, // or createdAt if available
      select: { id: true, token: true },
    });

    if (!dbAccount) {
      console.error("❌ No accounts found for user:", userId);
      return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
    }

    console.log("✅ Using LATEST account from DB:", dbAccount.id);

    const account = new Account(dbAccount.token);

    console.log("🔄 Starting initial sync for account:", dbAccount.id);
    const response = await account.performInitialSync();

    if (!response) {
      console.error("❌ Failed to perform initial sync for account:", dbAccount.id);
      return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });
    }

    const { deltaToken, emails } = response;
    console.log("📨 Emails fetched:", emails?.length || 0);
    console.log("🧩 Delta token received:", deltaToken);

    await syncEmailsToDatabase(emails, dbAccount.id);
    console.log("💾 Emails synced to database for account:", dbAccount.id);

    await db.account.update({
      where: { id: dbAccount.id },
      data: { nextDeltaToken: deltaToken },
    });

    console.log("✅ Sync complete for account:", dbAccount.id);
    console.log("🆕 Updated deltaToken:", deltaToken);

    return NextResponse.json({ success: true, deltaToken, accountId: dbAccount.id }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Error during initial sync:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", details: error.message },
      { status: 500 }
    );
  }
};
