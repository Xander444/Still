# Still 6

A small, warm ELIZA-inspired chatbot that runs entirely in your browser. No API keys, AI model, backend, account, build step, or installed packages are needed.

Version 6 adds 32 everyday topic packs with 384 follow-up questions, warmer responses to uncertainty, and more useful redirection when a question is outside Still's knowledge. It retains ELIZA-style reflections, sentence repetition checks, personal memory, story tracking, corrections, and local feedback. It is still a finite, rule-based program, with no AI model or backend.

## Start in 20 seconds

1. Extract the ZIP.
2. Open `still-chatbot/index.html` in a current Chrome, Firefox, Edge, or Safari browser.
3. Start typing. On a desktop keyboard, **Enter** sends and **Shift+Enter** makes a new line. On touch devices, use the send button.

All files must remain together. Do not open the HTML from inside the ZIP viewer.

The complete app works from a local `file://` URL, including its scripts and styles. Browsers differ in how they allow persistent storage for local files. If saving is unavailable, the chat still works for the current page; you can download a text copy.

For consistent browser storage, optionally serve the folder with Python (already installed on many systems):

```bash
cd still-chatbot
python3 -m http.server 8000
```

Then open [the local app](http://localhost:8000). On Windows, `py -m http.server 8000` is an alternative. This optional command only serves static files; there is no conversational backend. Stop it with **Ctrl+C**.

## The experience

- **Friend mode (default):** everyday conversation with follow-up questions about what you share. Say “Just listen” to temporarily leave questions aside; “Ask me a question” restores them.
- **Intent before keywords:** a crush at school follows the relationship context. Ambiguous “I like her” wording prompts a clarification about friendship, romance, or uncertainty. Short replies follow the question actually shown.
- **People & interests:** remembers up to 12 explicitly introduced people and eight interests. Supports sibling names, distinct siblings, corrections, and simple pronoun updates. Delayed check-ins happen during conversational openings; they ask for an update rather than inventing one. Names can be edited and individual check-ins disabled in settings.
- **Untangle it:** one thread at a time, with follow-up questions that advance through a topic.
- **A small step:** choose an action, name what could make it difficult, and keep it as a revisable proposal.
- **Conversation notes:** explicitly shared names, people, a school subject, an upcoming event, an interest, a goal, and a possible next step. Notes are visible, editable, and removable.
- **Conversation threads:** up to six separate situations, with the event, people, feeling, effort, expectation, outcome, and needs the bot recognized. Inspect them in settings, return to one, mark it resolved, or remove it.
- **Specific reflections:** connect details such as studying all week and then failing, including when those details arrive in separate messages. Supported questions are skipped when their answers have already been volunteered.
- **Real corrections:** replace a mistaken person, feeling, or outcome. A tentative interpretation remains separate from the record of what you explicitly said until you confirm it.
- **Pacing and preferences:** Untangle it alternates questions with reflections; Friend mode usually follows up conversationally. You can request direct questions, fewer questions, shorter replies, or no exercises.
- **Occasional kind words:** acknowledge an explicit effort or constructive action, such as asking for help or taking a break. Enabled by default and can be switched off in settings.
- **Optional local saving:** off by default. Turn on “Save this chat and its notes” in Privacy & settings to restore the conversation after reloading.
- **Grounding pause:** an optional five-senses attention exercise. Every part can be skipped, and it can be stopped at any time.
- **Wrap up:** a brief summary based on recorded topics and explicit goals/steps, available when you explicitly choose to finish. Ordinary replies do not suggest wrapping up.
- **Light and dark modes**, a mobile layout, keyboard controls, reduced-motion support, and downloadable text transcripts.

The voice aims to validate feelings while staying honest. “Everyone hates me” receives acknowledgement of how painful that belief feels, without agreeing that everyone does. It does not promise that everything will work out, flatter indiscriminately, diagnose conditions, or claim to feel love for the user.

Extra encouragement is eligible only after at least four substantive updates, with at least six user turns between acknowledgements and a relevant action in the active thread from the last three turns. A longer chat alone earns no praise. The bot does not praise hypothetical or recognized harmful actions, and crisis replies always take priority. The phrase checks remain imperfect; they are not a moral or clinical assessment.

When a recognized concern repeats without new details, Still gently offers to identify the unanswered part, try a small action, or change the conversation’s direction. New facts reset that repetition check.

Engagement comes from continuity, choice, varied wording, and relevant questions. There are no streaks, guilt for leaving, affection rewards, push notifications, or claims that the user needs the bot.

## Try these conversations

In either Friend mode or Untangle it:

```text
You:   I like this girl at my school.
Still: Oh, you have a crush. What is it about them that you like?
You:   I really like her, like a crush.
Still: Got it—a crush. Have you two talked much yet?
You:   No.
Still: So it’s mostly from a distance so far. Do you share a class,
       an activity, or mutual friends?
```

Try “My brother is Leo”, then “He plays soccer”. Later, when a natural opening occurs, Still can ask about Leo. “Don’t ask about Leo” disables automatic check-ins; “Forget Leo” removes the person note. Deceased or estranged people are excluded from automatic check-ins when those circumstances are recognized. Lowercase names work best with an explicit label such as “My brother’s name is leo”.

When you send “nothing”, “idk”, or “ask me something”, Still suggests a fresh topic or a spaced-out memory check-in. It sends no messages while the page is idle. “Stop” and “goodbye” are respected.

The examples below use **Untangle it**:

```text
You:   I have an exam tomorrow.
Still: Which subject is it for?
You:   Chemistry.
Still: Which part of chemistry feels hardest right now:
       understanding the material, getting started, or the
       pressure around the result?
You:   The result.
Still: The concern you named is “The result”.
You:   I'd like a question.
Still: What are you afraid a disappointing result would mean?
```

Balanced pacing may leave space after two questions. Choose **Direct and focused** in settings if you prefer a question on each relevant reply.

```text
You:   I failed even though I studied all week.
Still: You studied all week, and you still describe the result
       as “i failed”. That is a difficult gap between effort
       and outcome.
       Is the disappointment mostly about the result, or about
       not knowing what you could have done differently?
```

Other useful messages:

```text
My name is Alex.
I just need to vent.
I'd like a question.
That isn't what I meant.
Sorry, I meant my sister.
My exam was moved to Friday.
What do you remember about me?
Forget my name.
Forget everything.
Talk about something else.
A grounding pause.
A small step.
Wrap up.
I prefer direct questions.
Fewer questions, please.
Keep it short.
I hate exercises.
Exercises are okay now.
Stop praising me.
I like kind words.
Back to my exam.
Summarize this.
Forget this thread.
Mark this resolved.
```

“Forget everything” removes notes, structured thread details, and learned preferences; the visible messages remain. **Erase chat & notes** in settings removes the chat too and switches off saving. **New conversation** clears messages and threads while retaining the small fact notes, people, interests, and conversation-style preferences. Removing a thread removes its working details, not the original messages in the transcript.

Existing version 1, 2, and 3 saved chats are accepted. Their messages and notes survive; new personal memory is collected from new messages rather than reinterpreting the old transcript. Legacy Just listen becomes Friend mode. To retain browser storage when updating a hosted copy, replace the app files at the same URL and use the same browser profile.

## Put it on GitHub Pages

1. Create a GitHub repository.
2. Upload the **contents** of the extracted `still-chatbot` folder to the repository root. `index.html` should be at the top level, alongside `assets`.
3. In the repository’s Pages settings, select publishing from the main branch and its root folder. The precise settings labels may change.
4. Open the Pages URL when GitHub has finished publishing.

All asset URLs are relative, so the app supports project URLs such as `https://username.github.io/still/`. No secrets need to be configured. Each visitor has their own browser state; there is no shared message database. Reopening a hosted page needs the network to load its files; once loaded, replies use no network. The downloaded folder is the fully offline option.

## Files

```text
still-chatbot/
  index.html                 App markup and privacy/support dialogs
  assets/
    styles.css               Colors, typography, responsive layout
    favicon.svg              Small local icon
    content.js               Handwritten topics, questions, reply variants
    dialogue.js              Structured details, threads, pacing evidence
    friend.js                Casual dialogue, intent, people, check-ins
    everyday.js              32 topic packs, reassurance, practical prompts
    conversation.js          Typed questions, stories, clarification, corrections
    language.js              ELIZA reflections and sentence repetition checks
    engine.js                Memory, scoring, dialogue state, boundaries
    app.js                   Chat UI, browser storage, text export
  tests/
    engine.test.cjs           Dependency-free conversation regression tests
    dialogue.test.cjs         Structured understanding and interaction tests
    friend.test.cjs           Intent, people memory, and Friend mode checks
    conversation.test.cjs     Story, tone, and answer-context checks
    language.test.cjs         Reflections, ambiguity, pacing, corrections, feedback
    everyday.test.cjs         New topics, validation, context, fallback, boundaries
  README.md
  DESIGN.md                  Rule structure, customization, limitations
  CONVERSATIONS.md           New topic examples, research, and conversation paths
  LICENSE
  .gitignore
  .nojekyll
```

## Customize it

Start with `assets/content.js`. Each topic has keywords, reflections, ordered questions, and suggestions for a small step. Replies are handwritten; variation comes from selecting appropriate phrases without reusing recent ones.

Change the colors at the beginning of `assets/styles.css`. Both light and dark themes have their own variables.

For casual prompts, romantic intent rules, person-name extraction, or memory check-ins, edit `assets/friend.js`. For structured fields, supported sentence patterns, answered-question mappings, or kindness timing, edit `assets/dialogue.js`. For routing, corrections, preferences, special responses, or exercises, edit `assets/engine.js`. Keep the safety and correction rules ahead of ordinary topic matching. See `DESIGN.md` for details.

In **Privacy & settings → How Still works**, enable **Show why a reply was chosen** to see the selected rule, message role, extracted fields, missing details, active thread, pacing decisions, and evidence behind any encouragement. Saved chat restores do not reload arbitrary trace objects; the engine restores a bounded set of supported memory fields.

## Run the checks

Node.js is only needed for tests, not for chatting. Use a supported Node release with the built-in test runner (Node 22 or newer is a practical choice).

```bash
node --test tests/engine.test.cjs tests/dialogue.test.cjs tests/friend.test.cjs tests/conversation.test.cjs tests/language.test.cjs tests/everyday.test.cjs
```

The 206 tests cover the supported conversation paths, including everyday topics, grounded reassurance, factual limits and redirection, ELIZA reflections, question ownership, ambiguity, multiple thoughts, volunteered answers, corrections, feedback, memory, pacing, urgent-language routing, and saved-state migration. No package install is needed.

## Privacy and limitations

Still's code makes no network requests. It has no analytics, tracking pixels, external fonts, or AI dependencies. The HTML also contains a Content Security Policy with `connect-src 'none'`. Support links and downloads open only when you choose them. A provider hosting the static page can still log ordinary page requests.

When enabled, saving uses ordinary unencrypted `localStorage`. People or software with access to the browser profile may be able to read it. Avoid enabling it on a shared device. Clearing browser/site data removes the stored chat; downloaded copies are separate. The app retains at most 160 messages (user and bot entries combined), seven fact notes, 12 people, eight interests, six situation threads, and 24 recent structured message records. Older messages fall out of the transcript and export, but a thread's latest details remain until the thread is removed or replaced at the limit. Two tabs do not silently merge chats: a detected external save pauses saving in the other tab.

This is an **English-only reflection prototype, not therapy or a clinically validated product**. Its rules can misunderstand sarcasm, pronouns, complex sentences, dates, medical language, or unfamiliar wording. A note can be wrong even when it was extracted from an explicit statement. It does not understand arbitrary text like a language model and does not learn new rules from chats.

Urgent-language checks are limited phrase rules, not a risk assessment. They can miss a crisis or react to a harmless sentence. The urgent support button is always available. Still cannot monitor anyone, contact emergency services, or promise safety. Review the content with qualified people before presenting it as a mental-health service.

The Canada and US support information was checked against the official [Canada 9-8-8 service](https://988.ca/get-help/what-to-expect), [Government of Canada mental-health support page](https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html), and [US 988 Lifeline](https://988lifeline.org/get-help/what-to-expect/) on September 9, 2026. Keep those details current if you distribute the app.

Released under the MIT license. You can modify it and put it in your own repository.

## New in version 4

Friend mode now uses a shared phrase-scoring and conversation-frame layer for romance, school events, plans, hobbies, achievements, setbacks, conflict, relationship events, work, and updates about other people. Questions carry the subject and expected answer types so short replies can follow the actual question.

Replies combine a reaction, an available detail, and a follow-up. Explicit tone detection distinguishes your feelings from someone else's, handles simple negation and mixed feelings, and asks for clarification on a few recognized sarcasm cues. These remain finite phrase rules.

**Ongoing stories** in settings shows up to eight situations. Inspect their details, return to one, disable its check-ins, mark it resolved, or remove it. Open stories may return after a gap at a conversational opening. Saving still requires your opt-in. A new conversation clears story context; saved-page reloads preserve it.

The shared layer currently drives Friend mode. Untangle it and A small step retain their existing structured reflection and action routing. There is no general knowledge database or unrestricted language understanding.

New source: `assets/conversation.js`. New checks: `tests/conversation.test.cjs`.

## New in version 5

- **More ELIZA:** suitable feelings, wishes, needs, and thoughts are rephrased as questions using your words. For example, “I feel left out when my friends make plans” can become “You feel left out when your friends make plans?” Collective or ambiguous wording can stay in quotation marks to avoid changing its meaning. Rejecting a reflection asks what needs correcting.
- **Less repetition:** ordinary replies are checked against the last 100 conversational sentences, including close word overlap. Reused filler is removed, question forms rotate, and repeated questions can become an invitation to elaborate. Required support information and explicit clarification questions can still repeat.
- **Clarification:** “I like her” does not immediately become a stored crush. Friendship, romantic interest, uncertainty, and supported sarcasm choices have follow-up handling. You can change the subject without completing a clarification.
- **Several thoughts:** recognizable separate events are acknowledged together, with one followed more closely. An explicitly stated priority takes precedence; otherwise a stated concern or setback usually leads. This does not infer that one event caused another.
- **Answered questions:** supported details such as “we talk every day about music,” “I already studied,” and named company for a plan can skip questions. Feelings are not saved as durations or school subjects. Not every paraphrase is recognized.
- **Corrections:** “Excited, not worried” updates the active feeling and keeps the correction with the story. Later explicit feelings can update it again. Confirmed friendship does not silently turn back into a crush. Existing person/name and structured-thread corrections remain available.
- **Less interviewing:** the default Balanced setting mixes questions with observations and invitations. Fewer questions slows the pace further. Direct and focused keeps the typed questions and disables automatic ELIZA substitutions. Optional encouragement remains tied to something you actually shared or did.
- **That didn’t fit:** beneath a reply, choose Wrong topic, Wrong assumption, or Already answered. Feedback on the latest ordinary reply can repair the current direction; older reports leave the current conversation alone. An answered question is marked to skip in that story. No examples are uploaded and no model is trained.

In Privacy & settings, **Download flagged examples** exports only the selected examples and up to four preceding messages per example as JSON. Review the file before sharing it. Reports are limited to 40; they are saved across visits only when chat saving is on. Clear flagged examples removes the reports; New conversation or Erase chat & notes also clears them. These actions cannot erase downloaded copies.

The everyday story layer remains centered on Friend mode. Untangle it also uses its ambiguity checks and handling of separate recognized events while retaining its structured reflection rules. A small step keeps its action flow. Sentence checks apply to eligible ordinary conversational replies; support, exercises, identity, and other explicit controls keep their own wording.

Older saved chats migrate automatically. Replace the entire `assets` folder and `index.html` together, then reload the page. No installation or API configuration is needed.

## New in version 6

The 32 new packs add daily routines, family life, belonging, dating, workload, careers, procrastination, decisions, confidence, boundaries, life changes, sleep, health worries, money, technology, social media, games, music, films, books, food, exercise, sports, pets, outdoors, travel, creativity, learning, nostalgia, boredom, news, and meaning. Each pack has six conversation stages with two question variants per stage, plus three opening variants. These supplement the earlier crush, school-event, conflict, achievement, setback, and other paths.

Still recognizes supported informal wording and common misspellings, tracks several details in one reply, and distinguishes some details that answer a different question. For example, “I got lunch with a friend” can provide both a moment from the day and company. A family discussion does not need to become an exam discussion just because a grade is mentioned.

Uncertainty has more tailored responses: permission to explain an unfinished thought, acknowledgement that feelings matter, and reassurance that doubt does not establish inability. When relevant, Still can refer to preparation you actually described. It does not guarantee success, agree automatically that someone else is wrong, or pretend to know another person's feelings.

When a factual answer is unavailable, Still says so briefly and asks about the relevant interest, situation, or purpose. A science question prompted by a movie can continue as a conversation about the movie. Repeated unclear input leads to concrete examples or usable topic choices instead of the same question endlessly. Type “Talk about music,” “Games,” or “My day” at a fresh starting point to enter those paths.

“What should I do?” in an everyday story offers a modest, relevant practical prompt while staying in Friend mode. The explicit **A small step** mode remains available. Health, sleep, money, confidence, and exercise stories have automatic check-ins disabled; you can return to them yourself through notes. No one is monitored, and nothing is sent out for analysis.

See [CONVERSATIONS.md](CONVERSATIONS.md) for examples and the research used to choose coverage. These topics are research-informed design choices, not a universal frequency ranking. All new dialogue is original; no conversation dataset, private chats, or model weights are bundled.
