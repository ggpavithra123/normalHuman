import { createTRPCRouter, protectedProcedure } from "../trpc.ts";
import Account from "@/lib/account.ts";
import { syncEmailsToDatabase } from "@/lib/sync-to-db.ts";
import { db } from "@/server/db.ts";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
  const account = await db.account.findFirst({
      where: {
          id: accountId,
          userId: userId,
      },
      select: {
          id: true, emailAddress: true, name: true, token: true
      }
  })
  if (!account) throw new Error("Invalid token")
  return account
}
const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  inboxStatus: true
})

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  sentStatus: true
})

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
  accountId,
  draftStatus: true
})
export const accountRouter = createTRPCRouter({
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    console.log("🔍 [tRPC:getAccounts] Called by userId:", ctx.auth?.userId);

    try {
      const accounts = await ctx.db.account.findMany({
        where: {
          userId: ctx.auth.userId,
        },
        select: {
          id: true,
          emailAddress: true,
          name: true,
        },
      });

      console.log("✅ [tRPC:getAccounts] Accounts found:", accounts);
      return accounts;
    } catch (error) {
      console.error("❌ [tRPC:getAccounts] Error details:", error);
      throw new Error("Failed to fetch accounts from DB");
    }
  }),

  getNumThreads: protectedProcedure.input(z.object({
    accountId: z.string(),
    tab: z.string()
  })).query(async ({ ctx, input }) => {
    const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
    let filter: Prisma.ThreadWhereInput = {}
    if (input.tab === "inbox") {
        filter = inboxFilter(account.id)
    } else if (input.tab === "sent") {
        filter = sentFilter(account.id)
    } else if (input.tab === "drafts") {
        filter = draftFilter(account.id)
    }
    return await ctx.db.thread.count({
        where: filter
    })
  }),
});
