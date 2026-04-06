---
title: Agent Skill
description: How the trx agent skill works with Claude Code for post-processing.
order: 3
---

## What is the agent skill?

trx ships with a `SKILL.md` that teaches Claude Code how to use the CLI and post-process transcription results. When installed, agents can:

- Transcribe URLs and files autonomously
- Fix common Whisper mistakes (proper nouns, technical terms)
- Extract structured data from transcripts
- Generate summaries, translations, and subtitles

## Install

```bash
npx skills add crafter-station/trx -g
```

Or during `trx init`, accept the skill installation prompt.

## How it works

1. Agent calls `trx schema transcribe` to discover available flags
2. Agent runs `trx <input> --output json` to get structured output
3. Agent reads the `.txt` file and applies corrections
4. Agent can chain with other tools (translation, summarization)

## Example agent workflow

```
User: "Transcribe this video and fix any technical terms"

Agent:
1. trx schema transcribe          # discover flags
2. trx "https://..." --output json # transcribe
3. Read output .txt file           # get raw text
4. Fix "reakt" → "React", etc.    # post-process
5. Write corrected file            # save result
```

## Self-correction patterns

The skill teaches agents to watch for:
- **Proper nouns**: Brand names, people, places
- **Technical terms**: Programming languages, frameworks, APIs
- **Homophones**: "their/there/they're", "your/you're"
- **Filler removal**: "um", "uh", "like" (optional)
