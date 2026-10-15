export interface StateUpdate {
  reputation?: Record<string, number>
  events?: string[]
  notes?: string
}

const BLOCK = /<!--\s*state\s*([\s\S]*?)-->/i
const FENCE = /```(?:json|state)?\s*(\{[\s\S]*?"(?:reputation|events|notes)"[\s\S]*?\})\s*```/i
const LINE = /^\s*(?:state|nexus-state)\s*[:=]\s*(\{[\s\S]*?\})\s*$/im

/**
 * Extracts an optional trailing machine-readable state block that the model
 * emits in the World theme, so reputation / world events can update on the fly
 * without a second API call.
 */
export function extractState(text: string): { clean: string; update: StateUpdate | null } {
  const matcher = text.match(BLOCK) ?? text.match(FENCE) ?? text.match(LINE)
  if (!matcher) return { clean: text, update: null }
  const clean = text.replace(matcher[0], '').trimEnd()
  try {
    const parsed = JSON.parse(matcher[1].trim()) as StateUpdate
    return { clean, update: parsed }
  } catch {
    return { clean, update: null }
  }
}

export const STATE_INSTRUCTION = `FORMAT CONTRACT — mandatory, read carefully.
Every single one of your replies has exactly two parts:
1. The story: your in-character prose, dialogue and actions.
2. Then, as the VERY LAST thing — nothing may follow it — one line that is an HTML comment holding raw JSON, exactly in this shape:
<!--state {"reputation":{"Character Name": 25}, "events":["short factual event"], "notes":"brief ongoing context"}-->
Rules for part 2:
- reputation maps character names to ABSOLUTE scores from -100 (despised) to 100 (devoted). Include ONLY characters whose opinion of the player changed this turn; if none changed, use {}.
- events: at most one short factual event, or [].
- notes: brief ongoing context under 200 characters, or "".
- Never omit part 2. Never wrap it in code fences. Never mention it inside the story. Emit it every time, even as <!--state {"reputation":{},"events":[],"notes":""}-->.`

