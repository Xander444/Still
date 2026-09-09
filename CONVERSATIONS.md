# Still 6 conversation guide

Still now adds **32 topic packs, 96 opening variants, and 384 stage questions** to its earlier conversation paths. These are authored choices combined with context, not 384 independent conversations or an unlimited understanding of English. A path can pause, switch topics, skip a known detail, reflect the user's wording, or return to a remembered story.

## Why these topics

A 2023 Pew Research Center survey of U.S. adults found work and family life were the most frequent topics among those it asked close friends about, followed by current events. It also examined health, pop culture, and sports. This is evidence about that survey population and question list, not a worldwide ranking of every possible topic. Still uses it to prioritize broad coverage. [Pew Research Center: What does friendship look like in America?](https://www.pewresearch.org/short-reads/2023/10/12/what-does-friendship-look-like-in-america/)

The DailyDialog paper describes a human-written everyday dialogue collection with topic, communicative-intention, and emotion annotations. It informed the decision to track conversational purpose and tone separately from the subject. The paper's curated conversations are not a representative frequency survey. No dataset dialogue was copied into Still, and no model was trained. [Li et al., 2017: DailyDialog](https://aclanthology.org/I17-1099/)

School, uncertainty, interests, and practical planning also follow this project's requested use. All response wording and rules in the new packs were authored for Still.

## What you can talk about

| Topic | Example starting message | Directions it can follow |
| --- | --- | --- |
| Daily life | My day was surprisingly good. | Moments, company, highlights, energy, tomorrow |
| Family life | My parents keep comparing me to my brother. | Patterns, impact, wishes, easier conversations |
| Belonging | My friends did not invite me. | What happened, frequency, connection, reaching out |
| Dating | She asked me out yesterday. | Connection, feelings, communication, hopes, pace |
| Workload | Work keeps piling up. | Priorities, deadlines, control, support, stopping points |
| Career | I do not know what to study. | Options, interests, constraints, values, exploration |
| Procrastination | I keep procrastinating on my homework. | The task, the block, the first action, conditions |
| Decisions | I am torn between two colleges. | Benefits, costs, values, reversibility, missing information |
| Confidence | I keep comparing myself to my classmates. | Triggers, standards, evidence, exceptions, fair expectations |
| Boundaries | I find it hard to say no. | Requests, limits, reactions, wording, support |
| Changes | I just moved to a new city. | Differences, what is missed, hopes, familiar routines |
| Sleep and energy | My sleep schedule is a mess. | Patterns, thoughts, daytime effects, support |
| Health worries | I am waiting for blood test results. | Known information, questions, waiting, company |
| Money | Money is tight this month. | Immediate concerns, timing, unknowns, practical organization |
| Technology | My laptop will not turn on. | Goal, observed behavior, changes, attempts, help requests |
| Social media | I keep doomscrolling at night. | Experience, effects, attraction, useful parts, limits |
| Games | I have been playing Minecraft. | Goals, recent sessions, company, enjoyment, next attempts |
| Music | I am making a playlist. | Tracks, sound, words, mood, memories, discovery |
| Films and shows | I just watched a movie. | Reaction, characters, moments, meaning, preferences |
| Reading | I just finished reading a book. | Reading experience, ideas, connections, taste |
| Food and cooking | I made a cake yesterday. | The dish, flavor, outcome, sharing, changes |
| Exercise | I went for a run. | Experience, goals, routine, company, next session |
| Sports | Our team lost last night. | The game, moments, reactions, connection, next time |
| Pets | My dog is named Pip. | Personality, recent moments, routines, bond |
| Outdoors | I went fishing today. | Places, details, activities, company, memories |
| Travel | We are planning a trip. | Place, purpose, company, pace, unresolved plans |
| Creativity | I have been writing a poem. | Intention, what works, where it is stuck, experiments |
| Learning | I am trying to understand the lesson. | What is known, the gap, attempts, preferred explanations |
| Nostalgia | I miss the old days. | Details, people, feelings, meaning, the present |
| Boredom | Every day feels the same. | Energy, interests, setting, company, a small change |
| News | I saw a headline that surprised me. | The claim, reaction, verification questions, personal relevance |
| Meaning | I keep thinking about my purpose. | Questions, meaningful moments, values, tensions, choices |

The examples show supported starting points; unfamiliar wording may take a clarification. Earlier school-event, crush, conflict, breakup, achievement, setback, work-event, and personal-update routes remain available. Use Friend mode for the broad everyday paths. Untangle it can also follow the new packs; A small step retains its explicit action flow.

## Feeling heard

When someone asks whether they are overreacting, Still takes their feelings seriously without declaring that every conclusion or action is correct. When someone is unsure of their ability, it can acknowledge uncertainty and refer to effort they actually described. Apologies for talking can receive permission to explain the thought without making it polished. Other people's quoted questions are not automatically treated as the user's own feelings.

ELIZA reflections remain part of the default rhythm. For example, “I feel left out when my friends make plans” can become “You feel left out when your friends make plans?” Still alternates these with relevant questions and statements, and tracks which question it actually displayed. Fewer questions and Direct and focused remain available in settings.

## When a question is outside its knowledge

Still does not secretly know the answer or look it up. It states the limit briefly and seeks a relevant conversational direction. For example:

1. “What is quantum entanglement?” is recognized as a factual request, rather than stored as a personal preference.
2. Still says it does not have a reliable answer and asks what prompted the interest.
3. “I saw it in a movie” can enter the films path.
4. “It was in Interstellar” supplies the title; “The ending confused me” supplies the reaction.

If meaning remains unclear, it offers concrete examples or supported topic choices instead of pretending it understood. Its identity as a chatbot stays visible. It does not fabricate human experiences, personal affection, diagnoses, current prices, scores, or news.

## Customizing and checking

The packs are in `assets/everyday.js`. A pack has phrase patterns, opening variants, six question stages, a practical prompt, and anchors used during recovery. `assets/conversation.js` handles selection, context, story memory, validation, and recovery. `assets/language.js` handles reflections and ordinary sentence repetition.

Add realistic input-and-follow-up examples when changing a pack. Check the question a reply actually answers, other people versus the user, negation, several details together, a topic switch, and a correction. The included 206 automated tests cover supported examples; they do not establish human-level comprehension or clinical effectiveness.

Everything works offline after opening the extracted folder. Saving remains opt-in and local to the browser. Reports from “That didn’t fit” are exported only when the user chooses to download them. Health, sleep, money, confidence, and exercise stories have automatic check-ins disabled; manual returns remain available.
