import { create, insertMultiple, Results, search } from "@orama/orama";

export class OramaManager {
  db: any;
  accountId: string;
  prisma: any;

  constructor(accountId: string, prisma: any) {
    this.accountId = accountId;
    this.prisma = prisma;
  }

  // 🔹 Initialize Orama DB and insert emails
  async initialize() {
    if (this.db) return; // Already initialized

    console.log("🧠 [OramaManager] Initializing Orama DB for account:", this.accountId);

    // ✅ Create Orama schema
    this.db = await create({
      schema: {
        id: "string",
        threadId: "string",
        title: "string",
        from: "string",
        to: "string[]",
        rawBody: "string",
      },
    });

    console.log("📨 [OramaManager] Fetching emails for account:", this.accountId);

    // ✅ Fetch recent emails related to this account (joined via Thread → Account)
    const emails = await this.prisma.email.findMany({
      where: {
        thread: {
          accountId: this.accountId,
        },
      },
      select: {
        id: true,
        threadId: true,
        subject: true,
        bodySnippet: true,
        from: {
          select: {
            address: true,
          },
        },
        to: {
          select: {
            address: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: 300, // Limit for performance
    });

    console.log(`✅ [OramaManager] Found ${emails.length} emails for indexing.`);

    if (!emails.length) {
      console.warn("⚠️ [OramaManager] No emails found for account:", this.accountId);
      return;
    }

    // ✅ Format and insert emails into Orama DB
    const formattedEmails = emails.map((email) => ({
      id: email.id,
      threadId: email.threadId,
      title: email.subject || "(No Subject)",
      from: email.from?.address || "Unknown",
      to: email.to?.map((t) => t.address) || [],
      rawBody: email.bodySnippet || "",
    }));

    await insertMultiple(this.db, formattedEmails);

    console.log("🧾 [OramaManager] Inserted emails into Orama:", formattedEmails.length);
  }

  // 🔍 Perform full-text search
  async search({ term }: { term: string }) {
    if (!this.db) throw new Error("❌ Orama database not initialized");

    console.log(`🔎 [OramaManager] Searching for "${term}"...`);

    const results = await search(this.db, { term });

    console.log("📊 [OramaManager] Search complete. Hits:", results.hits.length);

    return results;
  }

  // Vector search wrapper
  async vectorSearch({ prompt }: { prompt: string }): Promise<Results<any>> {
    return this.search({ term: prompt });
  }

}
