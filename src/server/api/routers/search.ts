import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OramaManager } from "@/lib/orama";

export const searchRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        query: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { accountId, query } = input;
      const { userId } = ctx.auth;

      console.log("🔍 [searchRouter] Incoming search request:", {
        userId,
        accountId,
        query,
      });

      // ✅ Verify account ownership
      const account = await ctx.db.account.findFirst({
        where: { id: accountId, userId },
        select: { id: true, emailAddress: true },
      });

      if (!account) {
        console.error("❌ [searchRouter] Invalid or unauthorized account.");
        throw new Error("Invalid account or unauthorized access");
      }

      // ✅ Initialize Orama index and search
      const oramaManager = new OramaManager(account.id, ctx.db);
      await oramaManager.initialize();

      console.log("🔎 [searchRouter] Running Orama search for:", query);
      const results = await oramaManager.search({ term: query });

      console.log("📊 [searchRouter] Search completed:", {
        resultsCount: results?.hits?.length || 0,
      });

      return results;
    }),
});
