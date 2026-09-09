# How Still 2 chooses a reply

Still is a symbolic program, not a language model. The engine receives a string and returns a response object:

```js
const bot = new Still.Engine();
const reply = bot.respond("I'm worried about my exam tomorrow.");
// { role: 'bot', text, suggestions, support, trace }
```

The browser exposes `Still`, `StillContent`, and `StillDialogue` through ordinary script tags. Load `content.js`, `dialogue.js`, `engine.js`, then `app.js`. Node tests use CommonJS exports. This deliberate dual export avoids module-fetch restrictions when opening the downloaded HTML directly.

## Routing order

1. Normalize a small set of contractions, aliases, and spelling variants.
2. Check urgent phrases and any pending safety conversation.
3. Handle explicit commands: preferences, thread return/resolution, interpretation correction, mode changes, pause/stop, wrapping up, and memory access.
4. Handle identity, relationship boundaries, clinical requests, accountability, and selected unverifiable threat claims.
5. Continue an exercise or handle greetings and short acknowledgements.
6. Score topic keywords, keeping the existing topic when the user is answering its question or adding an emotion to a concrete situation.
7. Classify what a message contributes and extract bounded fields with source turns. Update the matching situation thread and recognize compatible answers already supplied.
8. Offer a change of approach for a recognized recurring concern with no new information. Resolve a pending short answer, next step, or obstacle.
9. Prefer a specific reflection linking recognized details. Otherwise select a topic response and an unused, unanswered question.
10. Respect pacing and brevity preferences. When eligible, offer a standalone, evidence-based acknowledgement; safety and correction replies never receive this decoration.

Specific rules have priority over topic matching. Topic scores are simple keyword weights and context bonuses; they are not probabilities. The debug display deliberately calls them scores, not confidence percentages.

## Dialogue state

`engine.state` contains the mode, active topic, recently visited topics, pending question or exercise step, explicit fact notes, recent template IDs, and bounded transcript. `state.dialogue` holds structured message records, up to six situation threads, style preferences, pacing counters, and encouragement history. No personality score or diagnosis is created.

Pending kinds include a requested school subject, a topic question, an action choice, an obstacle, a correction, a tentative interpretation, a grounding step, or a safety follow-up. Safety follow-ups track whether the last question asked about immediate danger or contacting someone; the same word “yes” must not mean both. A recognized explicit request to stop, change modes, or wrap up can interrupt an ordinary correction.

## Structured understanding

`StillDialogue.analyze(raw, normalized, context)` classifies a message as an event, explanation, answer, correction, request, feeling, or reflection. Multiple contributions may coexist; one becomes the primary role for tracing. This is a finite collection of phrase rules, not a semantic parser with general language understanding.

Fields cover the event, people, explicitly named feeling, effort, expectation, outcome, cause, need, goal, thought, concern, and related answer slots. Each field retains its wording, source kind, and turn. Missing fields remain absent; `uncertain` in the debug trace means the information has not been extracted, not that a numerical confidence score exists.

Recognized new events or feelings are not blindly stored as answers to the previous question. A short compatible answer such as “The result” can fill the concern slot after a question about what is weighing on the person. “I feel a little better” is recorded as a feeling update rather than an answer about what failure would mean.

`QUESTION_FIELDS` maps supported question IDs to the information they seek. Both an explicit answer and a volunteered matching detail can make a question unnecessary. Each thread separately tracks questions asked, questions answered, and specific reflections already used.

## Situation threads and repair

Switching topics parks the current thread. A newly described event involving another explicitly named person can form a separate thread within the same topic. Threads store their latest recognized details; recent structured message records retain evidence for linking adjacent turns.

Use `engine.threads()`, `openThread(id)`, `resolveThread(id)`, and `forgetThread(id)` to inspect and manage them. Text commands such as “Back to my exam” request an earlier thread. When multiple matches are possible, the bot asks the user to choose. A returned thread is introduced as something discussed earlier, with a check for changed circumstances.

An explicit correction can replace a person, feeling, or outcome, and correct the active thread's event description. “That isn't what I meant” refers to the last interpretation or focus, then asks which part should change. It does not require the user to start the whole story over.

The supported “unheard” interpretation is stored as a tentative hypothesis separate from explicit emotion fields. It becomes a field only after confirmation. A rejection removes the hypothesis and prevents the same suggestion from immediately returning. Explicitly corrected source details supersede earlier details in summaries.

## Pacing, preferences, and kindness

Preferences belong to the conversation state:

| Preference | Values | Behavior |
| --- | --- | --- |
| Questions | balanced, direct, few | Balanced leaves a reflective pause after two ordinary questions; few does so after one. Direct keeps relevant questions available. |
| Brevity | normal, brief | Brief trims ordinary responses while keeping key context. Safety information is not shortened by this setting. |
| Exercises | enabled or disabled | Disabled exercises are removed from suggestions and the exercise button explains the preference. Explicitly re-enable to use them. |
| Encouragement | enabled or disabled | Controls occasional extra kind words. Ordinary respectful language stays available. |

When a question is withheld for pacing, it is returned to the available question pool. It is not falsely recorded as asked or answered. A direct request for a question overrides an ordinary listening pause.

`kindWords` requires at least four substantive updates, a recent recognized completed action in the active thread, no acknowledgement within the previous six turns, and no reuse of that action. It can acknowledge effort, asking for help, a boundary, rest, an apology, or a concrete considerate action. It does not praise the number of messages, continued attendance, or a hypothetical plan. Known harmful phrases suppress action praise. This conservative list will miss many valid actions, and cannot judge arbitrary actions reliably.

Repetition checks compare recognized concerns within one thread. A new event, explanation, effort, or action resets the count. A repeated concern offers a change in approach with room for the bot to have missed something; it does not diagnose rumination or force the conversation to end.

## Facts and summaries

`remember(key, value, source)` accepts only known keys. Values are bounded strings with the source message and turn attached. Recognized facts are explicitly stated; free-form implications are not treated as knowledge. Existing notes are replaced when a supported correction is recognized. Unsupported or mistaken facts can always be corrected through the notes UI.

The summary uses current explicit situation fields, topic labels, and the user's recorded goal/step. It does not manufacture an emotional breakthrough or claim that the user has improved. Relative event dates remain the user's wording; there is no scheduling or calendar interpretation.

## Adding a topic

Add an entry to `CONTENT.topics` in `assets/content.js`:

```js
creativity: {
  label: 'Making things',
  words: ['creative block', 'painting', 'writing', 'drawing'],
  opening: 'What has making things been like for you lately?',
  reflections: [
    'You can care about a project without enjoying every part of making it.'
  ],
  questions: [
    ['creative-start', 'What part feels hardest to begin?', []],
    ['creative-want', 'What do you want this project to give you?', []],
    ['creative-standard', 'Whose standard are you measuring it against?', []],
    ['creative-play', 'What would you try if this could just be a draft?', []],
    ['creative-support', 'What would make a little room for it today?', []]
  ],
  step: 'What would a small, unfinished first version look like?',
  steps: []
}
```

Use unique question IDs. Avoid broad words that cause accidental matches: “not enough” can refer to time or money as well as self-worth. Prefer a short set of well-chosen phrases. Topic reflections should fit the range of their triggers, and should not assume a bad event merely because a topic is present.

The `opening` field is available for targeted rules; it is not automatically shown for every new topic. Default reflection mode progresses through the topic's `questions`. If an opening needs special routing, add a bounded condition to `engine.js`.

The example topic above is a customization example, not an included extra feature. After adding it, include conversations with both valid triggers and plausible false positives in the tests.

## Voice rules

- Acknowledge an emotion without certifying an interpretation: “That sounds painful” is different from “They definitely hate you.”
- Ask about observable events before making assumptions about another person's motives.
- Make affirmation specific and proportionate. Avoid universal praise, certainty about future success, or telling someone they can do anything.
- Allow ambivalence and correction. Ask rather than infer whenever a wrong assumption could hurt the conversation.
- Do not turn every distress statement into homework. Respect listening mode.
- Do not imply the program has feelings, misses the user, is their therapist, or understands them better than people can.
- Keep exercises optional, and let the conversation finish naturally.

## Persistence and rendering

- Chat saving is opt-in. The chat key is `still.chat.v1`; appearance preferences use `still.preferences.v1`.
- Saved state is reconstructed from known keys with bounds. Arbitrary persisted objects, traces, or rule names are not executed.
- The state schema is version 2. Version 1 chats migrate with their existing notes and messages, without inventing old structured records. Validated pending repairs and the supported evidence-backed interpretation can resume after reload.
- User messages, notes, and response text are written through `textContent` or input `.value`, never interpreted as HTML or code.
- There is no `fetch`, XHR, WebSocket, remote font, or remote script.
- A storage event from another tab pauses saving or clears the local conversation after deletion, preventing a stale tab from silently resurrecting an erased chat.
- New chat retains fact notes and style preferences, while clearing message and thread context. Full erasure removes those too. Saved history and UI history are capped at 160 entries, structured records at 24, and situation threads at six.
- Removing a thread deletes its working fields and recent evidence. The original transcript still contains the messages; erasing the chat removes those separately.

## Known boundaries

Negation, ownership, tense, entities, and sentiment use local phrase heuristics. They do not form a full grammatical parser. Multiple stories in a single message, quotations, uncommon names, implicit corrections, or a new topic expressed indirectly can confuse the rules. Guidance about a topic is human-authored and general; it is not a personalized clinical recommendation.

The bot has a finite response library. It does not retrieve web facts or compose unrestricted new explanations. When it reaches the end of a topic's questions, it offers listening, a small step, or a natural stopping point instead of pretending to discover limitless insight.

## Validation included with this release

The included Node suites cover 56 behavior scenarios. JavaScript syntax, HTML asset paths, script ordering, and UI control references were also checked statically. A live browser session and screen-reader audit were not performed in the build environment. Try the extracted app in your intended browser before publishing; verify mobile layout, keyboard behavior, dialog focus, local saving, erasure, export, and your own example conversations.

Automated tests establish those specific behaviors, not clinical safety or the quality of arbitrary conversations.
