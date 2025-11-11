import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_CREDITS_PER_DAY } from "@/app/constants";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    // ✅ Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Parse request body
    const { messages, accountId } = await req.json();
    if (!messages || !accountId) {
      return NextResponse.json({ error: "Missing messages or accountId" }, { status: 400 });
    }

    // ✅ Subscription / free-limit check
    const isSubscribed = await getSubscriptionStatus();
    const today = new Date().toDateString();

    if (!isSubscribed) {
      const interaction = await db.chatbotInteraction.findUnique({
        where: {
          day_userId: { day: today, userId } // ✅ compound key
        }
      });

      if (!interaction) {
        await db.chatbotInteraction.create({
          data: { userId, day: today, count: 1 },
        });
      } else if (interaction.count >= FREE_CREDITS_PER_DAY) {
        return NextResponse.json({ error: "Limit reached" }, { status: 429 });
      }
    }

    // ✅ Initialize OramaManager and index emails
    const oramaManager = new OramaManager(accountId, db);
    await oramaManager.initialize();

    // ✅ Get last user message and search context
    const lastMessage = messages[messages.length - 1];
    const context = await oramaManager.search({ term: lastMessage.content });
    console.log(`${context.hits.length} context hits found.`);

    // ✅ System prompt with context
    const systemPrompt = {
      role: "system",
      content: `You are an AI email assistant embedded in an email client app.
Current time: ${new Date().toLocaleString()}

START CONTEXT BLOCK
${context.hits.map(hit => JSON.stringify(hit.document)).join("\n")}
END CONTEXT BLOCK

Instructions:
- Be concise, helpful, and articulate.
- Only use the provided email context.
- If you don't know the answer, say so.
- Do not invent or speculate about anything not in context.`,
    };

    // ✅ Create streaming chat completion
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        systemPrompt,
        ...messages.filter((m: any) => m.role === "user"),
      ],
      stream: true,
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        console.log("Streaming started...");
      },
      onCompletion: async () => {
        if (!isSubscribed) {
          await db.chatbotInteraction.update({
            where: {
              day_userId: { day: today, userId } // ✅ update with compound key
            },
            data: { count: { increment: 1 } }
          });
        }
      },
    });

    return new StreamingTextResponse(stream);

  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
