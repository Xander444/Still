# Still 2

A small, warm ELIZA-inspired chatbot that runs entirely in your browser. No API keys, AI model, backend, account, build step, or installed packages are needed.

Version 2 adds structured conversation memory, specific reflections, corrections to its interpretations, preferences, varied pacing, and occasional grounded encouragement. It is still a finite, rule-based program.

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

- **Just listen:** warm acknowledgements and space to continue, with ordinary advice and questions kept out of the way. A direct request for a question, clarification, or safety concern can change the reply.
- **Untangle it:** one thread at a time, with follow-up questions that advance through a topic.
- **A small step:** choose an action, name what could make it difficult, and keep it as a revisable proposal.
- **Conversation notes:** explicitly shared names, people, a school subject, an upcoming event, an interest, a goal, and a possible next step. Notes are visible, editable, and removable.
- **Conversation threads:** up to six separate situations, with the event, people, feeling, effort, expectation, outcome, and needs the bot recognized. Inspect them in settings, return to one, mark it resolved, or remove it.
- **Specific reflections:** connect details such as studying all week and then failing, including when those details arrive in separate messages. Supported questions are skipped when their answers have already been volunteered.
- **Real corrections:** replace a mistaken person, feeling, or outcome. A tentative interpretation remains separate from the record of what you explicitly said until you confirm it.
- **Pacing and preferences:** balanced conversation alternates questions with reflections. You can request direct questions, fewer questions, shorter replies, or no exercises.
- **Occasional kind words:** acknowledge an explicit effort or constructive action, such as asking for help or taking a break. Enabled by default and can be switched off in settings.
- **Optional local saving:** off by default. Turn on “Save this chat and its notes” in Privacy & settings to restore the conversation after reloading.
- **Grounding pause:** an optional five-senses attention exercise. Every part can be skipped, and it can be stopped at any time.
- **Wrap up:** a brief summary based on recorded topics and explicit goals/steps, with a natural place to finish.
- **Light and dark modes**, a mobile layout, keyboard controls, reduced-motion support, and downloadable text transcripts.

The voice aims to validate feelings while staying honest. “Everyone hates me” receives acknowledgement of how painful that belief feels, without agreeing that everyone does. It does not promise that everything will work out, flatter indiscriminately, diagnose conditions, or claim to feel love for the user.

Extra encouragement is eligible only after at least four substantive updates, with at least six user turns between acknowledgements and a relevant action in the active thread from the last three turns. A longer chat alone earns no praise. The bot does not praise hypothetical or recognized harmful actions, and crisis replies always take priority. The phrase checks remain imperfect; they are not a moral or clinical assessment.

When a recognized concern repeats without new details, Still gently offers to identify the unanswered part, try a small action, or stop. New facts reset that repetition check.

Engagement comes from continuity, choice, varied wording, and relevant questions. There are no streaks, guilt for leaving, affection rewards, push notifications, or claims that the user needs the bot.

## Try these conversations

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

“Forget everything” removes notes, structured thread details, and learned preferences; the visible messages remain. **Erase chat & notes** in settings removes the chat too and switches off saving. **New conversation** clears messages and threads while retaining the small fact notes and conversation-style preferences. Removing a thread removes its working details, not the original messages in the transcript.

Existing version 1 saved chats are accepted. Their messages and notes survive; version 2 starts collecting structured details from new messages rather than reinterpreting the old transcript. To retain browser storage when updating a hosted copy, replace the app files at the same URL and use the same browser profile.

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
    engine.js                Memory, scoring, dialogue state, boundaries
    app.js                   Chat UI, browser storage, text export
  tests/
    engine.test.cjs           Dependency-free conversation regression tests
    dialogue.test.cjs         Version 2 understanding and interaction tests
  README.md
  DESIGN.md                  Rule structure, customization, limitations
  LICENSE
  .gitignore
  .nojekyll
```

## Customize it

Start with `assets/content.js`. Each topic has keywords, reflections, ordered questions, and suggestions for a small step. Replies are handwritten; variation comes from selecting appropriate phrases without reusing recent ones.

Change the colors at the beginning of `assets/styles.css`. Both light and dark themes have their own variables.

For structured fields, supported sentence patterns, answered-question mappings, or kindness timing, edit `assets/dialogue.js`. For routing, corrections, preferences, special responses, or exercises, edit `assets/engine.js`. Keep the safety and correction rules ahead of ordinary topic matching. See `DESIGN.md` for details.

In **Privacy & settings → How Still works**, enable **Show why a reply was chosen** to see the selected rule, message role, extracted fields, missing details, active thread, pacing decisions, and evidence behind any encouragement. Saved chat restores do not reload arbitrary trace objects; the engine restores a bounded set of supported memory fields.

## Run the checks

Node.js is only needed for tests, not for chatting. Use a supported Node release with the built-in test runner (Node 22 or newer is a practical choice).

```bash
node --test tests/engine.test.cjs tests/dialogue.test.cjs
```

The 56 tests cover the original conversation behavior plus linked reflections, volunteered answers, separate threads, tentative interpretations, preferences, pacing, encouragement evidence and cooldown, repetition handling, and saved-state migration. No package install is needed.

## Privacy and limitations

Still's code makes no network requests. It has no analytics, tracking pixels, external fonts, or AI dependencies. The HTML also contains a Content Security Policy with `connect-src 'none'`. Support links and downloads open only when you choose them. A provider hosting the static page can still log ordinary page requests.

When enabled, saving uses ordinary unencrypted `localStorage`. People or software with access to the browser profile may be able to read it. Avoid enabling it on a shared device. Clearing browser/site data removes the stored chat; downloaded copies are separate. The app retains at most 160 messages (user and bot entries combined), seven fact notes, six situation threads, and 24 recent structured message records. Older messages fall out of the transcript and export, but a thread's latest details remain until the thread is removed or replaced at the limit. Two tabs do not silently merge chats: a detected external save pauses saving in the other tab.

This is an **English-only reflection prototype, not therapy or a clinically validated product**. Its rules can misunderstand sarcasm, pronouns, complex sentences, dates, medical language, or unfamiliar wording. A note can be wrong even when it was extracted from an explicit statement. It does not understand arbitrary text like a language model and does not learn new rules from chats.

Urgent-language checks are limited phrase rules, not a risk assessment. They can miss a crisis or react to a harmless sentence. The urgent support button is always available. Still cannot monitor anyone, contact emergency services, or promise safety. Review the content with qualified people before presenting it as a mental-health service.

The Canada and US support information was checked against the official [Canada 9-8-8 service](https://988.ca/get-help/what-to-expect), [Government of Canada mental-health support page](https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html), and [US 988 Lifeline](https://988lifeline.org/get-help/what-to-expect/) on September 9, 2026. Keep those details current if you distribute the app.

Released under the MIT license. You can modify it and put it in your own repository.
