'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';

// ---- AI COMPOSE ----
export async function generateEmail(context: string, prompt: string) {
    console.log("🧠 generateEmail called with:", { context, prompt });

    // Create a streamable value
    const stream = createStreamableValue('');

    (async () => {
        try {
            const { textStream } = await streamText({
                model: openai('gpt-4o-mini'),
                prompt: `
You are an AI email assistant embedded in an email client app. 
THE TIME NOW IS ${new Date().toLocaleString()}

START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

USER PROMPT:
${prompt}

When responding, please keep in mind:
- Be helpful, clever, and articulate.
- Rely on the provided email context.
- Keep your response focused and relevant.
- Output only the email body text (no subject, greeting, or fluff).
                `,
            });

            for await (const token of textStream) {
                stream.update(token);
                console.log("🪄 Streaming token:", token);
            }

            stream.done();
            console.log("✅ Stream completed successfully");
        } catch (err) {
            console.error("❌ Error in generateEmail:", err);
            stream.done();
        }
    })();

    // ✅ Only return serializable value
    return { output: stream.value };
}

// ---- AI AUTOCOMPLETE ----
export async function generate(input: string) {
    console.log("🧠 generate called with input:", input);

    const stream = createStreamableValue('');

    (async () => {
        try {
            const { textStream } = await streamText({
                model: openai('gpt-4o-mini'),
                prompt: `
ALWAYS RESPOND IN PLAIN TEXT (no markdown or HTML).
You are a helpful AI that autocompletes text in an email editor.
Continue the following thought naturally:

<input>${input}</input>

Be concise, polite, and contextually relevant.
                `,
            });

            for await (const token of textStream) {
                stream.update(token);
                console.log("✍️ Autocomplete token:", token);
            }

            stream.done();
            console.log("✅ Autocomplete stream completed");
        } catch (err) {
            console.error("❌ Error in generate:", err);
            stream.done();
        }
    })();

    // ✅ Only return serializable value
    return { output: stream.value };
}
