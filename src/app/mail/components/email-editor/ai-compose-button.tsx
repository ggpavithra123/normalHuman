'use client'

import React from 'react'
import { Bot } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { generateEmail } from "./action"
import { readStreamableValue } from "ai/rsc"
import useThreads from "../../use-threads"
import { useThread } from "../../use-thread"
import { turndown } from '@/lib/turndown'

type Props = {
  onGenerate: (value: string) => void
  isComposing?: boolean
}

const AIComposeButton = ({ onGenerate, isComposing }: Props) => {
  const [prompt, setPrompt] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const { account, threads } = useThreads()
  const [threadId] = useThread()
  const thread = threads?.find(t => t.id === threadId)

  const aiGenerate = async (userPrompt: string) => {
    console.log("🧠 Generating AI email...")

    let context = ''
    if (!isComposing && thread?.emails) {
      context = thread.emails
        .map(m => {
          const text = turndown.turndown(m.body ?? m.bodySnippet ?? '')
          return `Subject: ${m.subject}\nFrom: ${m.from.address}\n\n${text}`
        })
        .join('\n\n')
    }

    console.log("📜 Context prepared:", context)

    try {
      const { output } = await generateEmail(
        `${context}\n\nMy name is: ${account?.name || 'User'}`,
        userPrompt
      )

      console.log("📡 Streaming AI response...")
      let fullMessage = ''
      for await (const chunk of readStreamableValue(output)) {
        if (chunk) {
          fullMessage = chunk // ✅ use the latest full text, not appended parts
          onGenerate(fullMessage)
        }
      }
      console.log("✅ Stream finished.")
    } catch (err) {
      console.error("❌ Error generating email:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            console.log("🤖 Opening AI Compose dialog")
            setOpen(true)
          }}
          size="icon"
          variant="outline"
        >
          <Bot className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>
            AI will draft a meaningful, concise email for you.
          </DialogDescription>

          <div className="h-2" />

          <Textarea
            placeholder="What would you like to write about?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="h-2" />

          <Button
            onClick={() => {
              aiGenerate(prompt)
              setPrompt('')
              setOpen(false)
            }}
          >
            Generate
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default AIComposeButton
