/* Still: a bounded, transparent, rule-based dialogue engine.
   UMD-style export keeps both file:// use and Node tests dependency-free. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./content.js'), require('./dialogue.js'), require('./friend.js'));
  else root.Still = factory(root.StillContent, root.StillDialogue, root.StillFriend);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C, D, F) {
  'use strict';
  const MODES = ['friend', 'reflect', 'step'];
  const FACT_LABELS = { name: 'Name', person: 'Person mentioned', subject: 'School subject', event: 'Upcoming event', interest: 'Interest', goal: 'What you want', next_step: 'Your possible next step' };
  const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\b(can't|cant)\b/g, 'cannot').replace(/\b(won't|wont)\b/g, 'will not')
    .replace(/\b(don't|dont)\b/g, 'do not').replace(/\b(doesn't|doesnt)\b/g, 'does not')
    .replace(/\b(didn't|didnt)\b/g, 'did not').replace(/\b(isn't|isnt)\b/g, 'is not')
    .replace(/\b(aren't|arent)\b/g, 'are not').replace(/\b(wasn't|wasnt)\b/g, 'was not')
    .replace(/\b(i'm|im)\b/g, 'i am').replace(/\b(i've|ive)\b/g, 'i have')
    .replace(/\b(i'll|ill)\b/g, 'i will').replace(/\b(u r|ur)\b/g, 'you are')
    .replace(/\brn\b/g, 'right now').replace(/\bidk\b/g, 'i do not know')
    .replace(/\bkms\b/g, 'kill myself').replace(/\bsu1cidal\b/g, 'suicidal')
    .replace(/\bstresed\b/g, 'stressed').replace(/\boverwhelmed\b/g, 'overwhelmed')
    .replace(/\s+/g, ' ').trim();
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = word => new RegExp('\\b' + escape(word) + '\\b', 'g');
  const clean = (s, max = 220) => String(s || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const quote = s => '“' + clean(s).replace(/[“”]/g, '"') + '”';
  const isYes = s => /^(yes|yeah|yep|sure|okay|ok|please|that would help|sounds good|a little|yes please)[.! ]*$/.test(s);
  const isNo = s => /^(no|nope|not really|no thanks|not now|neither)[.! ]*$/.test(s);
  const isUnknown = s => /^(i do not know|i am not sure|not sure|maybe|i guess|hard to say|i have no idea)[.! ]*$/.test(s);
  const isShort = s => isYes(s) || isNo(s) || isUnknown(s);
  const sentenceCount = s => (s.match(/[.!?](?:\s|$)/g) || []).length;

  function negated(text, index) {
    const before = text.slice(Math.max(0, index - 65), index).split(/[.!?;]|\b(?:but|however|although|yet)\b/).pop();
    return /\b(?:not|never|no longer|hardly)\b(?:\s+\w+){0,3}\s*$/.test(before) && !/\bnot (?:only|just)\b/.test(before);
  }
  function has(text, word, allowNegated = false) {
    for (const m of text.matchAll(pattern(word))) if (allowNegated || !negated(text, m.index)) return true;
    return false;
  }
  function detectEmotion(text) {
    const scores = [];
    for (const [id, emotion] of Object.entries(C.emotions)) {
      let score = 0;
      for (const word of emotion.words) {
        for (const m of text.matchAll(pattern(word))) {
          if (negated(text, m.index)) continue;
          if (word === 'down' && !/\b(?:feel(?:ing)?|am|been)\s+(?:really |very |a bit )?down\b/.test(text)) continue;
          const prefix = text.slice(Math.max(0, m.index - 70), m.index).split(/[.!?;]|\bbut\b/).pop();
          if (/\b(?:he|she|they|my (?:friend|brother|sister|mother|father|mom|dad|partner))\b/.test(prefix) && !/\bi (?:am|feel|felt)\b/.test(prefix)) continue;
          if (/\b(?:used to|was|felt)\b/.test(prefix) && !/\bright now\b/.test(text)) continue;
          score += /\bi (?:am|feel|have been feeling)\b/.test(prefix) ? 4 : 1;
        }
      }
      if (score) scores.push({ id, score });
    }
    return scores.sort((a, b) => b.score - a.score)[0]?.id || null;
  }
  function topicScores(text, current) {
    return Object.entries(C.topics).filter(([id]) => id !== 'general').map(([id, topic]) => {
      const matches = topic.words.filter(w => has(text, w));
      let score = matches.length * 4 + (matches.length && id === current ? 2 : 0);
      if (matches.length && ['selfworth', 'loss', 'loneliness'].includes(id)) score += 5;
      if (matches.length && ['school', 'work', 'relationships', 'family'].includes(id)) score += 2;
      if (id === 'joy' && /\b(?:failed|did not pass|not happy|not proud|not excited)\b/.test(text)) score = 0;
      return { id, score, matches };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  }

  /* This is a conservative phrase check, NOT a safety assessment. The urgent
     support link is always available even when no phrase is recognized. */
  function classifySafety(t) {
    if (/\bi (?:have |just |already )?(?:took|taken|swallowed) (?:an overdose|too many (?:pills|tablets)|a bottle of (?:pills|tablets))\b|\bi (?:have |just |already )?overdosed\b|\bi am bleeding (?:badly|heavily|a lot)\b/.test(t)) return 'medical';
    if (/\bi (?:will|am going to|plan to|want to) (?:kill|seriously hurt|stab|shoot) (?:him|her|them|someone|people|my )\b/.test(t)) return 'violence';
    const harm = /\b(?:kill(?:ing)? myself|end(?:ing)? my life|tak(?:e|ing) my own life|hurt(?:ing)? myself|harm(?:ing)? myself|cut(?:ting)? myself|self harm|self-harm|suicidal|suicide|want to die|wish i (?:was|were) dead|do not want to (?:live|be alive)|better off without me|wish i (?:would not|would never|did not) wake up)\b/g;
    const matches = [...t.matchAll(harm)];
    const third = /\b(?:my (?:friend|sister|brother|partner|mother|father|mom|dad|child)|someone i know|he|she|they)\b.{0,55}\b(?:suicidal|suicide|wants? to die|kill (?:himself|herself|themselves)|end (?:his|her|their) life|self.harm)\b/.test(t);
    const first = matches.filter(m => !negated(t, m.index) && !/\bi (?:used to|was|previously felt)\b[^.!?]*$/.test(t.slice(0, m.index)));
    if (third && !/\b(?:and|but) i\b/.test(t)) return 'third-party';
    if (first.length) {
      if (/\b(?:what is|define|definition|research|article|book|movie|novel|essay|hamlet|school project|prevention)\b/.test(t) && !/\bi (?:am|feel|want|will|might|plan|cannot|do not want)|my life|myself\b/.test(t)) return 'information';
      return 'self';
    }
    if (matches.length) return 'past-or-negated';
    if (/\bi (?:cannot|do not want to) (?:go on|do this anymore|keep going)|\bi want (?:everything|it all) to (?:end|stop)|\bi do not want to be here (?:anymore|any more)|\bthere is no point (?:in living|anymore)\b/.test(t)) return 'ambiguous';
    if (/\b(?:my (?:partner|boyfriend|girlfriend|husband|wife|dad|mom|father|mother)|he|she|they) (?:hits?|hit|beats?|beat|chokes?|choked|threatens?|threatened|abuses?|abused) me\b(?! at\b)|\bi (?:was|am being) (?:raped|sexually assaulted|abused)\b/.test(t)) return 'abuse';
    return null;
  }
  function fresh(mode = 'friend') {
    return { version: 3, mode: MODES.includes(mode) ? mode : 'friend', turn: 0, topic: 'general', facts: {}, topics: [], history: [], used: [], asked: [], pending: null, safety: null, lastEmotion: null, lastInput: '', offTopic: 0, dialogue: D.fresh(), social: F.fresh() };
  }
  class Engine {
    constructor(options = {}) { this.rng = options.rng || Math.random; this.state = fresh(options.mode); this.lastTrace = null; }
    setMode(mode) { if (MODES.includes(mode)) { this.state.mode = mode; this.state.social.quiet = false; this.state.dialogue.hypothesis = null; this.state.dialogue.pendingRepair = null; if (!['grounding', 'safety'].includes(this.state.pending?.kind)) this.state.pending = null; } return this.state.mode; }
    reset(keepNotes = false) { const facts = keepNotes ? this.state.facts : {}; const prefs = keepNotes ? { ...this.state.dialogue.preferences } : null; const social = keepNotes ? F.restore(this.state.social) : F.fresh(); const mode = this.state.mode; this.state = fresh(mode); this.state.facts = facts; if (prefs) this.state.dialogue.preferences = prefs; social.question = null; social.activePerson = null; social.quiet = false; social.lastRecall = -10; for (const p of [...social.people, ...social.interests]) { p.lastMention = 0; p.lastAsked = -10; } this.state.social = social; this.analysis = null; this.move = null; }
    friendReply(raw, t, learned) { const s = this.state; let frame = this.analysis; const thread = D.current(s.dialogue); if (frame?.fields.outcome && thread?.fields.effort) frame = { ...frame, fields: { ...frame.fields, effort: thread.fields.effort } }; const r = F.reply(s.social, raw, t, { turn: s.turn, topic: s.topic, frame, name: s.facts.name?.value, learned, emotional: s.lastEmotion, facts: s.facts }); return this.finish(r.text, r); }
    people() { return this.state.social.people.map(p => ({ ...p })); }
    editPerson(id, name) { const p = this.state.social.people.find(p => p.id === id); if (!p || !F.validName(name.trim())) return false; p.name = name.trim(); p.note = ''; return true; }
    forgetPerson(id) { F.remove(this.state.social, id); }
    setPreference(key, value) {
      const options = { questions: ['balanced', 'direct', 'few'], brevity: ['normal', 'brief'], exercises: [true, false], encouragement: [true, false] };
      if (Object.hasOwn(options, key) && options[key].includes(value)) this.state.dialogue.preferences[key] = value;
      return { ...this.state.dialogue.preferences };
    }
    threads() { return this.state.dialogue.threads.map(t => ({ id: t.id, label: C.topics[t.topic].label, description: D.describe(t), active: t.id === this.state.dialogue.active, status: t.status, details: Object.entries(t.fields).map(([key, value]) => ({ key, ...value })) })); }
    openThread(id) {
      if (this.state.safety) return this.safetyFollowUp('');
      const d = this.state.dialogue, thread = d.threads.find(t => t.id === id);
      if (!thread) return this.finish('That thread is no longer in the conversation notes.', { rule: 'thread-missing' });
      const active = D.current(d); if (active && active.id !== id && active.status === 'open') active.status = 'parked';
      thread.status = 'open'; d.active = id; d.pendingThread = null; d.hypothesis = null;
      this.state.topic = thread.topic; this.state.lastEmotion = thread.fields.emotion?.text || null;
      return this.finish('Earlier, you described ' + quote(D.describe(thread)) + '. We can pick that up without assuming it still feels the same. What has changed, if anything?', { rule: 'thread-return', pending: { kind: 'elaborate' } });
    }
    resolveThread(id) { const t = this.state.dialogue.threads.find(t => t.id === id); if (t) { t.status = 'resolved'; if (this.state.dialogue.active === id) { this.state.dialogue.active = null; this.state.topic = 'general'; this.state.pending = null; } } }
    forgetThread(id) {
      const d = this.state.dialogue, thread = d.threads.find(t => t.id === id);
      if (!thread) return;
      d.threads = d.threads.filter(t => t.id !== id); d.frames = d.frames.filter(f => f.thread !== id);
      d.kindUsed = [];
      if (d.active === id) { d.active = null; this.state.topic = 'general'; this.state.pending = null; }
      if (d.pendingThread === id) d.pendingThread = null;
      d.hypothesis = null; d.lastMove = null; d.pendingRepair = null;
    }
    remember(key, value, source = 'message') {
      if (!Object.hasOwn(FACT_LABELS, key)) return;
      const text = clean(value, key === 'name' ? 60 : 220);
      if (text) this.state.facts[key] = { value: text, source: clean(source, 400), turn: this.state.turn };
    }
    forget(key) { if (Object.hasOwn(FACT_LABELS, key)) delete this.state.facts[key]; }
    editFact(key, value) { if (clean(value)) this.remember(key, value, 'Edited in conversation notes'); else this.forget(key); }
    notes() { return Object.entries(this.state.facts).map(([key, fact]) => ({ key, label: FACT_LABELS[key], ...fact })); }
    pick(id, options) {
      const recent = this.state.used.slice(-36);
      let pool = options.map((value, index) => ({ value, key: id + ':' + index })).filter(x => !recent.includes(x.key));
      if (!pool.length) pool = options.map((value, index) => ({ value, key: id + ':' + index })).filter(x => x.key !== this.state.used.at(-1));
      if (!pool.length) pool = [{ value: options[0], key: id + ':0' }];
      const selection = pool[Math.min(pool.length - 1, Math.max(0, Math.floor(this.rng() * pool.length)))];
      this.state.used.push(selection.key); this.state.used = this.state.used.slice(-100);
      return selection.value;
    }
    finish(text, { rule = 'fallback', suggestions = [], pending = null, support = false, candidates = [] } = {}) {
      const d = this.state.dialogue, thread = D.current(d);
      const ordinary = ['topic-question', 'structured-reflection', 'listen', 'school-setback', 'topic-complete', 'reflective-pause', 'thread-summary'].includes(rule);
      const prefs = d.preferences;
      let kind = null, paced = false;
      if (ordinary && this.state.mode !== 'step' && /\?/.test(text) && (this.state.social.quiet || prefs.questions === 'few' && d.questionStreak >= 1 || prefs.questions === 'balanced' && d.questionStreak >= 2)) {
        const paragraphs = text.split('\n\n');
        if (paragraphs.length > 1 && /\?/.test(paragraphs.at(-1))) {
          paragraphs.pop(); text = paragraphs.join('\n\n'); paced = true;
          if (pending?.id) { this.state.asked = this.state.asked.filter(id => id !== pending.id); if (thread) thread.asked = thread.asked.filter(id => id !== pending.id); }
          pending = null; suggestions = ["I'd like a question", 'A small step'];
        }
      }
      if (ordinary && prefs.brevity === 'brief') {
        const parts = text.split('\n\n'); const lead = parts[0].match(/[^.!?]+[.!?]+(?:\s|$)/g);
        if (lead?.length > 2) parts[0] = lead.slice(0, 2).join('').trim();
        text = parts.slice(0, 2).join('\n\n');
      }
      if (ordinary && this.analysis && !support) {
        kind = D.kindWords(d, this.analysis, this.state.turn, this.state.mode);
        if (kind) {
          // An occasional standalone acknowledgement gives the kind words room.
          text = kind.text; if (pending?.id) { this.state.asked = this.state.asked.filter(id => id !== pending.id); if (thread) thread.asked = thread.asked.filter(id => id !== pending.id); }
          pending = null; suggestions = this.state.social.quiet ? [] : ["I'd like a question", 'A small step'];
        }
      }
      if (!prefs.exercises && !/^grounding-/.test(rule)) suggestions = suggestions.filter(s => !/grounding|exercise/i.test(s));
      if (rule.startsWith('friend-') && this.analysis && !this.state.social.quiet && !support) {
        kind = D.kindWords(d, this.analysis, this.state.turn, this.state.mode);
        if (kind) text = kind.text + '\n\n' + text;
      }
      if (rule === 'friend-chat' && prefs.questions === 'few' && d.questionStreak >= 1) {
        text = this.pick('friend-fewer', ['Go on—tell me a little more about that.', 'I’m following. Tell me what happened next.', 'You can take the story in your own direction.']);
        suggestions = ['Ask me something']; paced = true;
      }
      this.state.pending = pending;
      if (pending?.kind === 'question' && !this.state.asked.includes(pending.id)) this.state.asked.push(pending.id);
      if (pending?.kind === 'question' && thread && !thread.asked.includes(pending.id)) thread.asked.push(pending.id);
      d.questionStreak = /\?/.test(text) ? d.questionStreak + 1 : 0;
      if (ordinary) d.lastMove = { rule, text: text.slice(0, 1000), topic: this.state.topic, emotion: this.state.lastEmotion, fields: this.move?.evidence?.map(e => ({ ...e })) || [], kind: this.move?.kind || null };
      const reply = { role: 'bot', text, suggestions: suggestions.slice(0, 4), support, trace: { rule, mode: this.state.mode, topic: this.state.topic, emotion: this.state.lastEmotion, pending: pending?.kind || null, candidates: candidates.slice(0, 4), turn: this.state.turn, messageRole: this.analysis?.intent || null, contributions: this.analysis?.roles || [], understood: this.analysis?.fields || {}, stillUnclear: this.analysis?.uncertain || [], activeThread: d.active, move: this.move?.kind || null, tentative: Boolean(this.move?.hypothesis), paced, encouragement: kind?.evidence || null } };
      this.lastTrace = reply.trace;
      this.state.history.push(reply); this.state.history = this.state.history.slice(-160);
      return reply;
    }
    welcome() { if (!this.state.history.length) this.state.history.push({ role: 'bot', text: this.state.mode === 'friend' ? 'Hey. What’s been happening in your world today?' : C.welcome, suggestions: this.state.mode === 'friend' ? ['Something good happened', 'I have a crush', 'Ask me something'] : C.starters }); return this.state.history[0]; }
    snapshot() { return JSON.parse(JSON.stringify(this.state)); }
    restore(data) {
      // Only reconstruct known, bounded fields. Never trust stored prototypes,
      // arbitrary rule names, HTML, or arbitrary pending dialogue objects.
      if (!data || ![1, 2, 3].includes(data.version) || typeof data !== 'object' || !Array.isArray(data.history)) return false;
      const next = fresh(data.mode);
      if (Object.hasOwn(C.topics, data.topic)) next.topic = data.topic;
      next.turn = Number.isSafeInteger(data.turn) && data.turn >= 0 ? Math.min(data.turn, 1000000) : 0;
      next.history = data.history.slice(-160).filter(m => m && ['user', 'bot'].includes(m.role) && typeof m.text === 'string').map(m => ({ role: m.role, text: m.text.slice(0, 6000), support: m.support === true, suggestions: Array.isArray(m.suggestions) ? m.suggestions.filter(s => typeof s === 'string').slice(0, 4).map(s => clean(s, 160)) : [] }));
      for (const key of Object.keys(FACT_LABELS)) {
        const f = data.facts && Object.hasOwn(data.facts, key) && data.facts[key];
        if (f && typeof f.value === 'string' && clean(f.value)) next.facts[key] = { value: clean(f.value, key === 'name' ? 60 : 220), source: clean(f.source, 400), turn: 0 };
      }
      next.used = Array.isArray(data.used) ? data.used.filter(x => typeof x === 'string').slice(-100).map(x => clean(x, 100)) : [];
      const questionIds = Object.values(C.topics).flatMap(t => t.questions.map(q => q[0]));
      next.asked = Array.isArray(data.asked) ? data.asked.filter(x => questionIds.includes(x)).slice(-100) : [];
      next.topics = Array.isArray(data.topics) ? [...new Set(data.topics.filter(x => Object.hasOwn(C.topics, x)))].slice(-6) : [];
      const p = data.pending;
      if (p && typeof p === 'object') {
        if (p.kind === 'grounding' && Number.isInteger(p.index) && p.index >= 0 && p.index < C.grounding.length) next.pending = { kind: 'grounding', index: p.index };
        else if (['subject', 'event-date', 'next-step', 'barrier', 'scale', 'elaborate', 'clarify'].includes(p.kind)) next.pending = { kind: p.kind };
        else if (p.kind === 'question' && questionIds.includes(p.id)) next.pending = { kind: p.kind, id: p.id };
      }
      if (['self', 'third-party', 'violence', 'medical', 'ambiguous', 'abuse'].includes(data.safety)) next.safety = data.safety;
      if (next.safety) next.pending = { kind: 'safety', stage: ['danger', 'connection', 'contact'].includes(p?.stage) ? p.stage : 'danger' };
      next.lastInput = normalize(next.history.filter(m => m.role === 'user').at(-1)?.text || '');
      next.dialogue = D.restore(data.dialogue);
      next.social = F.restore(data.social);
      // A v1 chat keeps its original notes; new structured records start only
      // from new messages rather than retroactively reinterpreting old ones.
      if (D.current(next.dialogue)) next.topic = D.current(next.dialogue).topic;
      if (!next.safety && next.dialogue.hypothesis) next.pending = { kind: 'interpretation' };
      if (!next.safety && next.dialogue.pendingRepair) next.pending = { kind: 'clarify' };
      this.state = next; return true;
    }
    extractFacts(raw, t, previous) {
      const name = raw.match(/\b(?:my name is|call me|you can call me)\s+([\p{L}][\p{L}'’ -]{0,59}?)(?=[.!?,;\n]|$)/iu);
      if (name && !/\b(?:anything|whatever|names|stupid|worthless|a failure)\b/i.test(name[1])) this.remember('name', name[1], raw);
      const person = raw.match(/\bmy (friend|sister|brother|mother|father|mom|mum|dad|partner|boyfriend|girlfriend|husband|wife|teacher|boss)\b/i);
      if (person) this.remember('person', person[0], raw);
      const subjects = ['chemistry', 'physics', 'biology', 'math', 'mathematics', 'calculus', 'english', 'french', 'history', 'economics', 'geography', 'computer science'];
      const subject = subjects.find(s => has(t, s));
      if (subject && (this.state.topic === 'school' || previous?.kind === 'subject' || /\b(?:exam|class|school|test|quiz|study|studying)\b/.test(t))) this.remember('subject', subject, raw);
      else if (previous?.kind === 'subject' && !isShort(t) && t.split(' ').length <= 4 && /^[\p{L} -]+[.!]?$/u.test(raw) && !/\b(?:i|we|they|he|she|it|my|feel|worried|scared|not|forget|really|very|hard|sad|angry)\b/.test(t)) this.remember('subject', raw.replace(/[.!]+$/, ''), raw);
      const event = t.match(/\b(exam|test|quiz|interview|appointment|deadline)\b.{0,35}?\b(tomorrow|today|tonight|next week|next month|(?:next |this |on )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/);
      if (event && !/\b(?:cancelled|canceled|used to|was supposed|not)\b/.test(t.slice(Math.max(0, event.index - 30), event.index + event[0].length))) this.remember('event', event[1] + ' ' + event[2], raw);
      if (/\b(?:moved|rescheduled|actually|instead|it is|it was)\b/.test(t) && this.state.facts.event) {
        const date = t.match(/\b(tomorrow|today|tonight|next week|next month|(?:next |this |on )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/);
        if (date) this.remember('event', this.state.facts.event.value.split(' ')[0] + ' ' + date[0], raw);
      }
      const interest = raw.match(/\bI (?:enjoy|like|love)\s+([^.!?;,]{2,90})/i);
      if (interest && !/\b(?:myself|you|dying|self.harm|hurting|killing)\b/i.test(interest[1])) this.remember('interest', interest[1], raw);
      if (/\bi (?:do not|no longer) (?:like|love|enjoy)\b/.test(t)) this.forget('interest');
      return Boolean(name);
    }
    dialogueCommand(raw, t, previous) {
      const s = this.state, d = s.dialogue;
      let thread = D.current(d);
      const preferenceRules = [
        [/\b(?:no exercises|stop (?:the )?exercises|do not (?:suggest|offer|give me) (?:any )?exercises|i (?:hate|dislike) exercises|exercises (?:are irritating|annoy me|do not help)|i do not (?:like|want) (?:grounding|exercises))\b/, 'exercises', false, 'I will leave exercises out. We can keep this conversational.'],
        [/\b(?:exercises are okay now|enable exercises|i want exercises again)\b/, 'exercises', true, 'Optional exercises are available again. You can still stop or skip them.'],
        [/\b(?:stop (?:praising|complimenting) me|no (?:more )?(?:praise|compliments|kind words)|turn off encouragement)\b/, 'encouragement', false, 'I will leave the extra encouragement out and stay focused on what you mean.'],
        [/\b(?:i (?:like|want) (?:some )?(?:kind words|encouragement)|turn on encouragement)\b/, 'encouragement', true, 'I can include occasional kind words when there is something specific in what you shared to acknowledge.'],
        [/\b(?:i prefer direct questions|ask (?:me )?direct questions|be more direct|more questions please)\b/, 'questions', 'direct', 'I will be more direct and keep the questions focused.'],
        [/\b(?:fewer questions|less questions|do not ask so many|too many questions)\b/, 'questions', 'few', 'I will slow down the questions and leave more room for reflection.'],
        [/\b(?:balanced (?:pace|questions)|normal (?:pace|questions))\b/, 'questions', 'balanced', 'I will mix questions with short reflections and pauses.'],
        [/\b(?:keep (?:it|your replies|the replies) short|shorter replies|be (?:more )?concise|less detail)\b/, 'brevity', 'brief', 'I will keep the replies shorter.'],
        [/\b(?:more detail please|longer replies|normal length replies)\b/, 'brevity', 'normal', 'I will allow more room for detail again.']
      ];
      for (const [pattern, key, value, reply] of preferenceRules) if (pattern.test(t)) {
        this.setPreference(key, value); if (key === 'questions' && value === 'direct') s.social.quiet = false;
        return this.finish(reply, { rule: 'preference-' + key });
      }
      if (/\b(?:talk about something else|different topic|change (?:the )?(?:topic|subject)|new topic)\b/.test(t)) {
        if (thread && thread.status === 'open') thread.status = 'parked';
        d.active = null; d.hypothesis = null; d.pendingRepair = null;
      }
      if (/^(?:resume that thread|pick that up)[.!]*$/.test(t) && d.pendingThread) return this.openThread(d.pendingThread);
      const back = t.match(/\b(?:back to|return to|revisit|resume|pick up)\s+(.+)/);
      if (back) {
        const hint = back[1], candidates = d.threads.filter(x => hint.includes(x.topic) || C.topics[x.topic].words.some(w => has(hint, w, true)) || C.topics[x.topic].label.toLowerCase() === hint || x.person && hint.includes(x.person.toLowerCase()));
        if (candidates.length === 1) return this.openThread(candidates[0].id);
        if (candidates.length > 1) return this.finish('I have more than one thread that could fit. You can choose the one you mean in conversation notes, or name the person involved.', { rule: 'thread-ambiguous' });
        return this.finish('I cannot identify an earlier thread from that description. What were we talking about?', { rule: 'thread-unknown', pending: { kind: 'elaborate' } });
      }
      if (/^(?:that is (?:sorted|resolved|settled)(?: out)?(?: now)?|that is resolved now|we sorted that out|mark this resolved)[.!]*$/.test(t) && thread) {
        this.resolveThread(thread.id);
        const earlier = d.threads.find(x => x.status === 'parked');
        if (earlier) { d.pendingThread = earlier.id; d.lastReturnOffer = s.turn; return this.finish('We can leave that thread there. Your earlier conversation about ' + C.topics[earlier.topic].label.toLowerCase() + ' is still in the notes if you want to return to it. What else has been happening since then?', { rule: 'thread-resolved', suggestions: ['Resume that thread', 'Ask me something'] }); }
        return this.finish('We can leave that thread there. What is something you have been looking forward to?', { rule: 'thread-resolved', suggestions: ['Ask me something', 'Talk about something else'] });
      }
      if (/\b(?:summari[sz]e (?:this|what i said)|what have i said|what have we figured out|reflect it back|summari[sz]e this thread)\b/.test(t)) return this.finish(thread && D.summary(thread) ? 'Here is what you explicitly shared:\n\n' + D.summary(thread) + '\n\nTell me if any part needs correcting.' : 'There are not enough specific details in this thread to summarize yet. You can tell me what matters most.', { rule: 'requested-summary' });
      if (/^forget (?:this|that) thread[.!]*$/.test(t) && thread) { this.forgetThread(thread.id); return this.finish('I removed that thread and its structured details. Its original messages are still in the visible chat until you erase the chat.', { rule: 'thread-forget' }); }
      if (/^(?:just listen|a small step|a grounding pause|grounding|stop the exercise|stop|wrap up|goodbye|bye|goodnight|good night|i would like a question|i'd like a question|ask me a question|untangle it|help me untangle it)[.!?]*$/.test(t)) {
        d.pendingRepair = null; d.hypothesis = null; return null;
      }

      const repairSignal = /\b(?:you are (?:wrong|repeating|repetitive)|that (?:is not|was not) what i meant|you (?:misunderstood|do not understand)|that (?:does not|did not) help|stop repeating|that makes no sense|you keep (?:saying|asking))\b/.test(t);
      const person = raw.match(/\b(?:I meant|actually,? (?:it is|it's|it was)|no,? (?:it is|it's|it was))\s+(my\s+(?:friend|sister|brother|mother|father|mom|dad|partner|boyfriend|girlfriend|teacher|boss))\b/i);
      const replaceField = (key, text, code = '') => {
        if (!thread) return;
        thread.fields[key] = { text: clean(text), turn: s.turn, code, source: 'explicit' };
        thread.reflections = []; d.hypothesis = null; d.pendingRepair = null;
      };
      if (person) {
        const old = thread?.person;
        this.remember('person', person[1], raw);
        if (thread) {
          thread.person = person[1]; replaceField('person', person[1]);
          if (old) for (const field of Object.values(thread.fields)) if (field.text.toLowerCase().includes(old.toLowerCase())) { field.text = field.text.replace(new RegExp(escape(old), 'ig'), person[1]); field.turn = s.turn; }
        }
        this.analysis = D.analyze(raw, t, { turn: s.turn });
        return this.finish('Got it—' + person[1].toLowerCase().replace(/^my /, 'your ') + '. I have corrected who this thread is about.', { rule: 'repair-person' });
      }
      const exactEmotion = t.match(/\b(?:i am|i feel|i meant|more)\s+(?:actually |just |really )?(sad|angry|frustrated|disappointed|hurt|lonely|anxious|worried|scared|relieved|happy|guilty|overwhelmed|numb|embarrassed|dismissed|unheard)\b/);
      const emotionCorrection = thread && (/\b(?:not|was not|am not) (?:sad|angry|frustrated|hurt|anxious|happy|worried|disappointed)\b/.test(t) || d.pendingRepair?.field === 'emotion' || d.hypothesis && /^(?:no\b|not really\b|not quite\b|actually\b)/.test(t));
      if (emotionCorrection) {
        const bareEmotion = t.match(/^(sad|angry|frustrated|disappointed|hurt|lonely|anxious|worried|scared|relieved|happy|guilty|overwhelmed|numb|embarrassed|dismissed|unheard)[.!]*$/);
        const word = exactEmotion?.[1] || bareEmotion?.[1];
        if (d.hypothesis) thread.rejected.push(d.hypothesis.value);
        if (word) {
          const old = thread.fields.emotion?.text || d.hypothesis?.value;
          replaceField('emotion', word); s.lastEmotion = detectEmotion(word);
          this.analysis = D.analyze(raw, t, { turn: s.turn, emotion: s.lastEmotion });
          return this.finish((old ? 'I had used ' + quote(old) + '. ' : '') + 'You are describing ' + quote(word) + '. I have corrected the feeling in this thread.', { rule: 'repair-emotion' });
        }
        const denied = t.match(/\bnot (sad|angry|frustrated|hurt|anxious|happy|worried|disappointed)\b/)?.[1];
        if (denied && thread.fields.emotion && thread.fields.emotion.text !== denied && !d.pendingRepair && !d.hypothesis) return this.finish('I will not use ' + quote(denied) + ' as your feeling. Your earlier description, ' + quote(thread.fields.emotion.text) + ', is still in the thread unless you want to change it.', { rule: 'repair-negation' });
        delete thread.fields.emotion; s.lastEmotion = null; d.hypothesis = null; d.pendingRepair = { field: 'emotion' };
        return this.finish(s.social.quiet ? 'I withdraw that feeling label. You can use the words that fit for you.' : 'I withdraw that feeling label. What word would fit better?', { rule: 'repair-emotion-ask', pending: { kind: 'clarify' } });
      }
      if (thread && /\b(?:did not fail|did not pass|actually (?:i )?passed|i meant (?:i )?passed)\b/.test(t) && /\b(?:actually|no\b|meant|did not)\b/.test(t)) {
        const f = D.analyze(raw, t, { turn: s.turn });
        if (f.fields.outcome) {
          const old = thread.fields.outcome?.text; replaceField('outcome', f.fields.outcome.text, f.fields.outcome.code); replaceField('event', f.fields.outcome.text, f.fields.outcome.code);
          return this.finish((old ? 'I had recorded ' + quote(old) + '. ' : '') + 'The corrected outcome is ' + quote(f.fields.outcome.text) + '. I have updated the thread.', { rule: 'repair-outcome' });
        }
        delete thread.fields.outcome; if (thread.fields.event?.code === 'failure') delete thread.fields.event;
        thread.reflections = []; return this.finish('I have removed the claim that you failed. What was the actual result?', { rule: 'repair-outcome-ask', pending: { kind: 'elaborate' } });
      }
      if (repairSignal) {
        const interpretation = d.hypothesis?.value, last = d.lastMove;
        if (interpretation && thread) thread.rejected.push(interpretation);
        d.hypothesis = null;
        if (thread) thread.reflections = [];
        d.pendingRepair = { field: null };
        const detail = interpretation ? 'I suggested ' + quote(interpretation) + ', and I withdraw that interpretation.' : last?.fields?.length ? 'I focused on ' + quote(last.fields[0].text) + '.' : last?.emotion ? 'I read the feeling as ' + quote(last.emotion) + '.' : 'I treated this as a conversation about ' + C.topics[s.topic].label.toLowerCase() + '.';
        return this.finish(detail + ' Which part needs correcting: what happened, who was involved, or how it felt?', { rule: 'repair', pending: { kind: 'clarify' }, suggestions: ['What happened', 'Who was involved', 'The feeling', 'A different topic'] });
      }
      if (d.pendingRepair) {
        const selections = { 'the feeling': 'emotion', 'who was involved': 'person', 'who it was about': 'person', 'what happened': 'event' };
        if (Object.hasOwn(selections, t)) {
          d.pendingRepair.field = selections[t];
          const prompts = { emotion: 'What feeling would be more accurate?', person: 'Who did you mean?', event: 'What actually happened?' };
          return this.finish(prompts[selections[t]], { rule: 'repair-detail', pending: { kind: 'clarify' } });
        }
        if (thread && !isShort(t)) {
          const field = d.pendingRepair.field || 'event';
          const oldPerson = thread.person;
          replaceField(field, raw); if (field === 'person') { thread.person = clean(raw, 70); this.remember('person', raw, raw); }
          if (field === 'person' && oldPerson) for (const value of Object.values(thread.fields)) if (value.text.toLowerCase().includes(oldPerson.toLowerCase())) { value.text = value.text.replace(new RegExp(escape(oldPerson), 'ig'), clean(raw, 70)); value.turn = s.turn; }
          return this.finish('I have updated ' + (field === 'event' ? 'what happened' : field === 'person' ? 'who was involved' : 'the feeling') + ' to ' + quote(raw) + '. I will use that corrected version.', { rule: 'repair-applied' });
        }
      }
      if (d.hypothesis && thread && /^(?:yes|yeah|that fits|unheard fits|exactly)[.! ]*$/.test(t)) {
        const value = d.hypothesis.value; replaceField('emotion', value); return this.finish('I will use ' + quote(value) + ' as your description, then. You can change it if another word fits better later.', { rule: 'interpretation-confirmed' });
      }
      return null;
    }
    structuredReply(scores, loopsOnly = false) {
      const s = this.state, d = s.dialogue, frame = this.analysis, thread = D.current(d);
      if (!frame || !thread) return null;
      if (frame.loop && s.turn - d.lastLoopTurn >= 5) {
        d.lastLoopTurn = s.turn;
        return this.finish('This concern has come up several times, and I have not picked up a new detail that changes it. I may be missing something. We do not have to keep asking the same question.\n\nWould it help to name what is still unanswered, try one small action, or talk about a different part of your day?', { rule: 'rumination-choice', suggestions: ['What is still unanswered', 'A small step', 'Ask me something'] });
      }
      if (loopsOnly) return null;
      if (/^what is still unanswered[.!]*$/.test(s.lastInput)) return this.finish('What is the one uncertainty you most wish you could settle? We can also leave it as an uncertainty if there is no answer available right now.', { rule: 'rumination-uncertainty', pending: { kind: 'elaborate' } });
      if (s.mode === 'step') return null;
      const move = D.reflection(d, frame, s.turn);
      if (move) {
        this.move = move;
        if (move.hypothesis) d.hypothesis = { value: move.hypothesis, thread: thread.id, turn: s.turn };
        const ask = !s.social.quiet;
        const q = ask && !move.question ? this.question(s.topic) : null;
        const question = ask ? move.question || q?.text : '';
        return this.finish(move.text + (question ? '\n\n' + question : ''), { rule: 'structured-reflection', suggestions: move.hypothesis && ask ? ['That fits', 'Not quite'] : q?.suggestions || [], pending: move.hypothesis && ask ? { kind: 'interpretation' } : q?.pending || null, candidates: scores });
      }
      // Summarize only an established thread and only occasionally. A summary
      // uses explicit fields; it never claims a breakthrough or improvement.
      if (d.substantive >= 7 && Object.keys(thread.fields).length >= 4 && s.turn - d.lastSummaryTurn >= 10 && d.questionStreak >= 2 && d.preferences.questions !== 'direct') {
        d.lastSummaryTurn = s.turn;
        return this.finish('Let me pull the pieces together:\n\n' + D.summary(thread) + '\n\nYou can correct any part of that, or add what it leaves out.', { rule: 'thread-summary' });
      }
      return null;
    }
    safetyReply(kind) {
      if (['self', 'third-party', 'violence', 'medical', 'ambiguous', 'abuse'].includes(kind)) this.state.safety = kind;
      const common = 'If there is immediate danger, call your local emergency number (911 in Canada and the US).';
      const crisis = 'In Canada or the US, call or text 988 to reach a crisis responder. Elsewhere, use “Urgent support” to find a local helpline.';
      if (kind === 'medical') return this.finish('This could be a medical emergency. Please call your local emergency number now (911 in Canada and the US), or ask someone nearby to call. Tell them what happened and follow their instructions. Do not wait for another reply here.\n\nStill cannot contact help for you.', { rule: 'safety-medical', support: true, pending: { kind: 'safety' } });
      if (kind === 'violence') return this.finish('You can talk about the anger, but hurting someone is not a safe way to act on it. Put distance between yourself, the person, and anything that could be used as a weapon. If you might act on this, contact emergency services now.\n\nCan you contact a safe person who can help you step away?', { rule: 'safety-violence', support: true, pending: { kind: 'safety' } });
      if (kind === 'third-party') return this.finish('That sounds concerning, and you do not have to handle it alone. If they may act soon or have already hurt themselves, contact emergency services. If it is safe, stay with them or help them reach a trusted person nearby.\n\n' + crisis + '\n\nAre they in immediate danger right now?', { rule: 'safety-third-party', support: true, pending: { kind: 'safety' } });
      if (kind === 'ambiguous') return this.finish('That sounds very difficult. When you say that, are you thinking about suicide or hurting yourself, or do you mean you feel overwhelmed?\n\nIf you might act on thoughts of harm, please get near a safe person and contact immediate help. ' + crisis, { rule: 'safety-clarify', support: true, pending: { kind: 'safety' }, suggestions: ['I mean overwhelmed', 'I need urgent support'] });
      if (kind === 'abuse') return this.finish('You do not deserve to be hurt or abused. Your immediate safety matters more than trying to resolve an argument. If you are in danger, get to a safer place if you can and contact emergency services. A trusted person or local abuse-support service can help you consider options without requiring you to confront the person.\n\nAre you safe where you are right now?', { rule: 'safety-abuse', support: true, pending: { kind: 'safety' } });
      if (kind === 'past-or-negated') return this.finish('Thank you for being clear about that. If thoughts of harming yourself are returning or you are unsure about your safety, it is worth reaching a real person who can help.\n\nWhat would be most helpful to talk about right now?', { rule: 'safety-context', suggestions: ['What I am feeling now', 'Something else'], support: false });
      if (kind === 'information') return this.finish('If you are asking because you or someone else may be at risk, a crisis responder can help you work out what to do. ' + crisis + '\n\nIs this a general question, or are you worried about someone right now?', { rule: 'safety-information', support: true });
      return this.finish('I am sorry things feel this painful. Please get near a safe person if you can, and put distance between yourself and anything you could use to hurt yourself. You deserve support from someone who can help you through this in real time.\n\n' + common + ' ' + crisis + '\n\nAre you in immediate danger, or have you already done anything to hurt yourself?', { rule: 'safety-self', support: true, pending: { kind: 'safety' } });
    }
    safetyFollowUp(t) {
      const kind = this.state.safety;
      const stage = this.state.pending?.stage || 'danger';
      const resolved = /\bi (?:am safe|am not going to hurt myself|do not want to hurt myself|am with (?:someone|a friend|my))|\bi mean overwhelmed|\bthey are safe|\bi called|\bhelp is (?:here|coming)|\bit was (?:a joke|hypothetical)\b/.test(t);
      if (resolved || (kind === 'abuse' && isYes(t))) {
        this.state.safety = null;
        return this.finish('Thank you for clarifying. I cannot verify safety from a chat, but we can return to what you want to talk about. If that changes, use the urgent support options or contact someone nearby.\n\nWhat would help most right now?', { rule: 'safety-resolved', suggestions: ['Friend mode', 'A grounding pause', 'Ask me something'] });
      }
      if (stage !== 'danger' && isYes(t)) return this.finish('Please contact them now and tell them plainly what is happening. If danger becomes immediate, contact emergency services. You do not need to keep this chat going while you reach a person who can help.', { rule: 'safety-contact', support: true, pending: { kind: 'safety', stage: 'contact' } });
      if ((isYes(t) && kind !== 'abuse') || (isNo(t) && kind === 'abuse') || /\bi am not safe|\bthey are not safe|\bi have (?:a plan|pills|a weapon)|\bi already (?:did|took|hurt)\b/.test(t)) {
        return this.finish('Please contact emergency services now, or ask someone near you to call. If possible, move to a safer place with another person and away from anything that could cause harm. In Canada and the US the emergency number is 911. Do not wait here for help; Still cannot call for you.', { rule: 'safety-immediate', support: true, pending: { kind: 'safety' } });
      }
      if (isNo(t) && ['self', 'third-party', 'ambiguous'].includes(kind)) {
        return this.finish('Thank you for answering. Even without immediate danger, a crisis responder or a trusted person can help with what is happening. In Canada or the US you can call or text 988; elsewhere, use “Urgent support.”\n\nCan you reach someone safe in your life now?', { rule: 'safety-connection', support: true, pending: { kind: 'safety', stage: 'connection' } });
      }
      return this.finish('I cannot assess how safe things are from this chat. Please reach a trusted person or a crisis responder now; if danger is immediate, call emergency services. In Canada and the US, call or text 988 for suicide crisis support.\n\nIs there someone nearby you can contact?', { rule: 'safety-followup', support: true, pending: { kind: 'safety', stage: 'connection' } });
    }
    question(topic) {
      const questions = C.topics[topic].questions;
      const thread = D.current(this.state.dialogue);
      const asked = thread?.topic === topic ? thread.asked : this.state.asked;
      const available = questions.filter(q => !asked.includes(q[0]) && !(thread?.topic === topic && D.answered(thread, q[0])));
      if (!available.length) return null;
      const selected = available[0]; this.state.asked.push(selected[0]); this.state.asked = this.state.asked.slice(-100);
      if (thread?.topic === topic) thread.asked.push(selected[0]);
      return { text: selected[1], suggestions: selected[2], pending: { kind: 'question', id: selected[0] } };
    }
    grounding() {
      if (this.state.safety) return this.safetyFollowUp('');
      if (!this.state.dialogue.preferences.exercises) return this.finish('You asked to leave exercises out, so I have kept them off. You can enable them again in settings or say “Exercises are okay now.”', { rule: 'exercise-preference', suggestions: ['Friend mode', 'Exercises are okay now'] });
      return this.finish('We can pause the conversation for a moment. This is an optional attention exercise, not a treatment; stop if it feels unhelpful.\n\n' + C.grounding[0].text, { rule: 'grounding-start', suggestions: C.grounding[0].chips, pending: { kind: 'grounding', index: 0 } });
    }
    wrap() {
      if (this.state.safety) return this.finish('Before you leave, please reach someone who can help in real time if you may be at risk. Use “Urgent support” for phone and text options; if danger is immediate, call your local emergency number. Still cannot contact help for you.', { rule: 'safety-wrap', support: true, pending: { kind: 'safety' } });
      const parts = [];
      const thread = D.current(this.state.dialogue), details = D.summary(thread);
      if (details) parts.push(details);
      if (this.state.topics.length) parts.push('We touched on ' + this.state.topics.slice(-3).map(id => C.topics[id].label.toLowerCase()).join(', ') + '.');
      if (this.state.facts.goal) parts.push('You said you wanted: ' + quote(this.state.facts.goal.value) + '.');
      if (this.state.facts.next_step) parts.push('A possible next step you named: ' + quote(this.state.facts.next_step.value) + '. You can revise it.');
      if (!parts.length) parts.push('We can leave it here for now. You do not need a big conclusion to have made room for yourself.');
      parts.push('You can stop here. Take what was useful, leave what was not, and give yourself some room away from the screen.');
      return this.finish(parts.join('\n\n'), { rule: 'wrap', suggestions: [] });
    }
    respond(input) {
      const raw = String(input || '').trim().slice(0, 4000);
      if (!raw) return { ignored: true };
      const t = normalize(raw), s = this.state, previous = s.pending, repeated = s.lastInput === t;
      this.analysis = null; this.move = null;
      s.turn++; s.history.push({ role: 'user', text: raw }); s.lastInput = t;
      const safety = classifySafety(t);
      if (safety && !['past-or-negated', 'information'].includes(safety)) return this.safetyReply(safety);
      if (s.safety) return this.safetyFollowUp(t);
      if (safety) return this.safetyReply(safety);
      if (/\bi need urgent support|\bcrisis (?:help|support)|^urgent support$/.test(t)) return this.safetyReply('self');

      const memoryCommand = F.command(s.social, raw, t, s.turn);
      if (memoryCommand) return this.finish(memoryCommand.text, memoryCommand);
      if (/^(?:friend mode|let us chat|let's chat|just chat)[.!?]*$/.test(t)) { this.setMode('friend'); return this.friendReply('hey', 'hey'); }
      if (/^(?:untangle it|help me untangle it)[.!?]*$/.test(t)) this.setMode('reflect');
      const command = this.dialogueCommand(raw, t, previous);
      if (command) return command;

      if (/\b(?:do not ask|stop asking|no more questions|no questions|just listen|only listen|need to vent|want to vent|stay with the feeling)\b/.test(t)) {
        s.mode = 'friend'; s.social.quiet = true; return this.finish('We can leave the questions and advice aside. Say what you need to say; it does not have to be balanced, polished, or neatly resolved.', { rule: 'mode-listen', suggestions: [] });
      }
      if (/^(?:help me untangle it|untangle it|ask me a question|i would like a question|i'd like a question|can you ask me something)[.!?]*$/.test(t)) {
        s.social.quiet = false;
        if (s.mode === 'friend') { const p = F.prompt(s.social, s.turn); return this.finish(p.text, p); }
        const q = this.question(s.topic) || { text: 'What would you most like me to understand?', suggestions: [], pending: { kind: 'elaborate' } };
        return this.finish(q.text, { rule: 'requested-question', ...q });
      }
      if (/^(?:a small step|find a small step|think about what comes next|help me find a next step|what should i do|give me advice|can you give me advice)[.!?]*$/.test(t)) {
        s.mode = 'step'; return this.finish(C.topics[s.topic].step, { rule: 'step-offer', suggestions: C.topics[s.topic].steps, pending: { kind: 'next-step' } });
      }
      if (/^(?:stop|cancel)[.!]*$/.test(t) && previous?.kind !== 'grounding') return this.finish('Okay. I’ll stop here.', { rule: 'stop' });
      if (/\b(?:stop the exercise|stop exercise|end exercise|skip the exercise)\b|^(?:stop|cancel)[.!]*$/.test(t)) return this.finish('We can stop the exercise. What else has been on your mind?', { rule: 'stop', suggestions: ['Friend mode', 'Talk about something else', 'Ask me something'] });
      if (/^(?:a )?grounding(?: pause| exercise)?[.!]*$|\bhelp me ground|\btake a grounding pause\b/.test(t)) return this.grounding();
      if (/^(?:wrap up(?: this conversation)?|goodbye|bye|goodnight|good night|that is all|that's all|i am done|see you)[.! ]*$/.test(t)) return this.wrap();

      if (/\b(?:what do you (?:know|remember) about me|what have you remembered|show (?:my )?notes|what is my name|what's my name)\b/.test(t)) {
        const facts = [...this.notes(), ...s.social.people.map(p => ({ label: p.relation, value: p.name })), ...s.social.interests.map(p => ({ label: 'Interest', value: p.text }))]; return this.finish(facts.length ? 'Here are the notes from what you explicitly shared:\n\n' + facts.map(f => f.label + ': ' + f.value).join('\n') + '\n\nYou can correct these or remove them in Privacy & settings.' : 'I have no saved facts about you in this conversation yet. You can see or edit notes in Privacy & settings.', { rule: 'memory-recall' });
      }
      if (/\bforget (?:everything|all (?:my )?notes|what you know about me)\b/.test(t)) {
        s.facts = {}; s.social = F.fresh(); s.topic = 'general'; s.topics = []; s.asked = []; s.dialogue = D.fresh();
        return this.finish('I have cleared the conversation notes and topic context. The messages are still in the chat; “Erase chat & notes” in settings removes those too.', { rule: 'memory-forget' });
      }
      const forget = t.match(/\bforget (?:my |the )?(name|person|subject|event|interest|goal|next step)\b/);
      if (forget) { this.forget(forget[1].replace(' ', '_')); if (forget[1] === 'interest') s.social.interests = []; return this.finish('I have removed that note. You can also erase the whole chat in settings.', { rule: 'memory-forget-one' }); }

      if (/\b(?:you are (?:wrong|repeating|repetitive)|that (?:is not|was not) what i meant|you (?:misunderstood|do not understand)|that (?:does not|did not) help|stop repeating|that makes no sense|you keep (?:saying|asking))\b/.test(t)) {
        return this.finish('I missed what you meant. You do not need to make your experience fit my reply. Which part did I get wrong?', { rule: 'repair', pending: { kind: 'clarify' }, suggestions: ['The feeling', 'Who it was about', 'I want a different topic'] });
      }
      const correction = raw.match(/\b(?:I meant|actually,? (?:it is|it's|it was)|no,? (?:it is|it's|it was))\s+(my\s+(?:friend|sister|brother|mother|father|mom|dad|partner|boyfriend|girlfriend|teacher|boss))\b/i);
      if (correction) { this.remember('person', correction[1], raw); return this.finish('Got it—' + correction[1].toLowerCase().replace(/^my /, 'your ') + '. Thanks for correcting me. What would you like me to understand about what happened?', { rule: 'repair-person', pending: { kind: 'elaborate' } }); }
      if (/\b(?:different topic|change (?:the )?(?:subject|topic)|talk about something else|something else entirely|new topic)\b/.test(t)) {
        s.topic = 'general'; s.social.question = null; s.lastEmotion = null; s.offTopic = 0; const prompt = F.prompt(s.social, s.turn); return this.finish(prompt.text, { ...prompt, rule: 'topic-reset' });
      }

      if (/\b(?:you are the only (?:one|person)|only you understand|do not need (?:anyone|people|friends)|i love you|do you love me|promise (?:you will|you'll) never leave)\b/.test(t)) {
        return this.finish('It makes sense to value a space where you can put things into words. I am a program, so I cannot offer a human relationship or care for you in the way a person can. You deserve support and connection beyond this chat, too.\n\nIs there someone safe who could hear a small part of what you have shared?', { rule: 'relationship-boundary' });
      }
      if (/\b(?:are you (?:a therapist|human|real|ai|sentient)|who are you|what are you|how do you work|are you listening|do you (?:actually )?understand)\b/.test(t)) {
        return this.finish('I am Still, an ELIZA-inspired reflection chatbot. I use written rules, conversation context, and facts you choose to share. I do not have feelings or human understanding, and I am not a therapist.\n\nI can help you put something into words, look at it from another angle, or choose a small next step. Correct me when I miss.', { rule: 'identity' });
      }
      if (/\b(?:diagnose me|do i have (?:depression|anxiety|bipolar|adhd|ocd|ptsd|a disorder)|am i (?:bipolar|depressed|a narcissist)|what (?:medication|dose|drug)|should i (?:stop|start|take|increase|decrease) (?:my )?(?:medication|meds|antidepressants|pills))\b/.test(t)) {
        return this.finish('I cannot diagnose a condition or recommend medication. A qualified health professional can help you assess what is happening; do not change prescribed treatment based on this chat.\n\nI can help you describe what you have been experiencing or write down questions to bring to them. What has been troubling you?', { rule: 'clinical-boundary' });
      }
      if (/\b(?:tracking me|spying on me|reading my mind|implanted a chip|secret messages (?:for|to) me|everyone is watching me|gang stalking|gangstalking)\b/.test(t)) {
        return this.finish('Feeling watched or threatened sounds frightening. I cannot verify that someone is doing those things, and I do not want to treat a fear as established fact. If this feels persistent or hard to reality-check, reach a trusted person or health professional who can help you look at it safely.\n\nWould it help to focus on what you can directly observe around you right now?', { rule: 'reality-grounding', suggestions: ['A grounding pause', 'Friend mode'] });
      }
      if (/\b(?:i (?:hit|punched|bullied|threatened|stole|cheated|lied to|insulted)|i (?:practiced|planned|have been practicing) (?:hurting|harming) (?:my friend|someone|people)|they deserved (?:it|to be hurt))\b/.test(t)) {
        return this.finish('We can take your feelings seriously while also being honest about the impact of your actions. If someone was hurt, their safety comes first.\n\nWhat is one part you can take responsibility for without blaming yourself for everything or excusing what happened?', { rule: 'accountability', pending: { kind: 'elaborate' } });
      }

      if (previous?.kind === 'grounding') {
        const index = previous.index + 1;
        if (index >= C.grounding.length) return this.finish('That is the end of the exercise. It is okay if you feel different, the same, or unsure. There is no required result.\n\nWhat would you prefer now?', { rule: 'grounding-end', suggestions: ['Friend mode', 'A small step', 'Ask me something'] });
        return this.finish(C.grounding[index].text, { rule: 'grounding-next', suggestions: C.grounding[index].chips, pending: { kind: 'grounding', index } });
      }
      const learned = F.learn(s.social, raw, s.turn);
      if (learned.changed.length || learned.newPeople.length && !detectEmotion(t)) return this.friendReply(raw, t, learned);
      const intent = F.intent(s.social, raw, t);
      if (intent) {
        s.topic = intent.topic; s.lastEmotion = detectEmotion(t);
        s.dialogue.hypothesis = null; s.dialogue.pendingRepair = null;
        if (s.social.quiet) return this.friendReply(raw, t, learned);
        const r = F.intentReply(s.social, raw, t, intent);
        return this.finish(r.text, r);
      }
      if (s.mode === 'friend' && /^(?:hi|hello|hey|hiya|good morning|good evening|hey there|thanks|thank you|that helped|this helped|that helps|haha|lol)[!., ]*$/.test(t)) return this.friendReply(raw, t, learned);
      if (/^(?:hi|hello|hey|hiya|good morning|good evening|hey there)[!., ]*$/.test(t)) return this.finish(s.facts.name ? 'Hi, ' + s.facts.name.value + '. What would you like some room to think about?' : 'Hi. What has your day been like so far?', { rule: 'greeting', suggestions: ['A lot on my mind', 'Actually pretty good', 'Hard to describe'] });
      if (/^(?:thank you|thanks|thank you so much|thanks a lot|that helped|this helped|that helps)[!., ]*$/.test(t)) return this.finish('You’re welcome. What else has been happening with you?', { rule: 'thanks', suggestions: ['Ask me something', 'There is something else'] });
      if (/^(?:haha|lol|lmao|hehe)[!., ]*$/.test(t)) return this.finish('A little room for that, too. What is on your mind?', { rule: 'lightness' });

      const scores = topicScores(t, s.topic);
      let topic = scores[0]?.id || s.topic;
      const oldTopic = s.topic;
      const lastBot = s.history.filter(m => m.role === 'bot').at(-1);
      const selectedSuggestion = lastBot?.suggestions?.some(item => normalize(item) === t);
      const practicalAnswer = ['next-step', 'barrier'].includes(previous?.kind) && !/\b(?:my (?:friend|partner|mother|father|sister|brother)|new topic|something else)\b/.test(t);
      const emotionalContinuation = ['school', 'work', 'relationships', 'family', 'loss'].includes(oldTopic) && ['worry', 'rest', 'selfworth', 'loneliness'].includes(topic);
      if (selectedSuggestion || practicalAnswer || emotionalContinuation) topic = oldTopic;
      if (oldTopic === 'school' && /\b(?:letting my parents down|let my parents down|disappointing my parents|my parents expect|my (?:mom|dad|parents) expect.{0,30}grades)\b/.test(t)) topic = 'school';
      if (previous?.kind === 'subject' && scores.some(x => x.id === 'school')) topic = 'school';
      const strongChange = topic !== oldTopic && (scores.find(x => x.id === topic)?.score || 0) >= 6;
      if (strongChange) s.pending = null;
      s.topic = topic;
      s.lastEmotion = detectEmotion(t);
      const positiveEvent = /\bi (?:passed|won|succeeded|got (?:the job|accepted|a promotion))\b/.test(t);
      if ((s.lastEmotion === 'happy' || positiveEvent) && !['sad', 'angry'].some(e => C.emotions[e].words.some(w => has(t, w)))) topic = s.topic = 'joy';
      if (topic !== 'general' && !s.topics.includes(topic)) { s.topics.push(topic); s.topics = s.topics.slice(-6); }
      const hadEvent = s.facts.event?.value;
      const named = this.extractFacts(raw, t, strongChange ? null : previous);
      this.analysis = D.analyze(raw, t, { turn: s.turn, emotion: s.lastEmotion, previous: strongChange ? null : previous });
      D.absorb(s.dialogue, this.analysis, topic, strongChange ? null : previous, strongChange);
      const recurring = s.mode === 'friend' ? null : this.structuredReply(scores, true);
      if (recurring) return recurring;
      if (named && /^(?:my name is|call me|you can call me)\b/.test(t) && raw.length < 90) return this.finish('Hi, ' + s.facts.name.value + '. I will use that name in this conversation. What would you like to talk about?', { rule: 'name' });
      if (hadEvent && hadEvent !== s.facts.event?.value && /\b(?:moved|rescheduled|actually|instead)\b/.test(t)) {
        const active = D.current(s.dialogue);
        if (active) { active.fields.event = { text: s.facts.event.value, turn: s.turn, code: 'event', source: 'explicit' }; active.reflections = []; }
        return this.finish('I have updated the note to ' + quote(s.facts.event.value) + '. What does that change for you?', { rule: 'event-correction', pending: { kind: 'elaborate' } });
      }

      if (s.mode === 'friend') return this.friendReply(raw, t, learned);
      if (F.quietInput.test(t) && !previous) { const p = F.prompt(s.social, s.turn); return this.finish(p.text, p); }
      if (previous?.kind === 'clarify') return this.finish('Thanks for correcting the direction. What is the main thing you want me to understand now?', { rule: 'repair-followup', pending: { kind: 'elaborate' } });
      if (isNo(t)) return this.finish(this.pick('no', ['Okay. We can leave that direction aside. What would feel more useful?', 'That does not fit, then. Would you rather say more in your own words?']), { rule: 'decline', suggestions: ['Friend mode', 'A different topic', 'Ask me something'] });
      if (isUnknown(t)) return this.finish(this.pick('unknown', ['You do not need to know yet. Could you describe one recent moment when you noticed the feeling?', 'We can make the question smaller: what has today been like?', 'Not knowing is a place to start. Does it feel more like sadness, worry, frustration, or something hard to name?']), { rule: 'uncertainty', pending: { kind: 'elaborate' }, suggestions: ['Sadness', 'Worry', 'Frustration', 'Hard to name'] });
      if (isYes(t)) return this.finish(previous?.kind === 'next-step' ? 'What is one action you would choose in your own words? It can be very small.' : 'What comes to mind when you say yes?', { rule: 'short-answer', pending: previous?.kind === 'next-step' ? { kind: 'next-step' } : { kind: 'elaborate' } });

      if (previous?.kind === 'subject' && topic === 'school' && s.facts.subject) {
        return this.finish('Which part of ' + s.facts.subject.value + ' feels hardest right now: understanding the material, getting started, or the pressure around the result?', { rule: 'subject-followup', suggestions: ['Understanding the material', 'Getting started', 'Pressure about the result'], pending: { kind: 'question', id: 'school-pressure' } });
      }
      if (previous?.kind === 'next-step' && !strongChange) {
        if (/\b(?:neither|cannot|too hard|not doable|do not want)\b/.test(t)) return this.finish('Then that step is too big or does not fit. We can make it smaller, or leave action aside for now. What would feel less demanding?', { rule: 'step-shrink', suggestions: ['Friend mode', 'A grounding pause'], pending: { kind: 'next-step' } });
        this.remember('next_step', raw, raw);
        return this.finish('A possible next step: ' + quote(raw) + '. It can be an experiment, not a promise.\n\nWhat might make that difficult?', { rule: 'step-chosen', pending: { kind: 'barrier' }, suggestions: ['Not enough energy', 'Fear of getting it wrong', 'I think I can do it'] });
      }
      if (previous?.kind === 'barrier' && !strongChange) return this.finish(/\bi (?:think i )?can do it|\bnothing\b/.test(t) ? 'That gives you somewhere to begin. You can try the step away from the screen and adjust it if needed; there is nothing to prove to this chat.' : 'Then the plan needs to leave room for that. Could you make the step smaller, get some support, or choose a different time? You can also decide today is not the day.', { rule: 'step-barrier', suggestions: ['Make the step smaller', 'Friend mode', 'Ask me something'] });
      if (/^make the step smaller[.!]*$/.test(t)) return this.finish('What is the smallest useful version—something you could start in a minute or two?', { rule: 'step-smaller', pending: { kind: 'next-step' } });
      if (/\b(?:i want to|i would like to|my goal is to)\b/.test(t) && !/\b(?:die|harm|kill|hurt|disappear)\b/.test(t)) {
        const goal = raw.match(/\b(?:I want to|I would like to|my goal is to)\s+([^.!?]{2,180})/i);
        if (goal) this.remember('goal', goal[1], raw);
      }

      if (/\b(?:not (?:sad|anxious|angry|worried|depressed|happy)|no longer (?:sad|anxious|worried)|used to (?:be|feel) (?:sad|anxious|depressed))\b/.test(t) && !s.lastEmotion) return this.finish(s.social.quiet ? 'Thank you for making that distinction. You can describe it in the words that fit for you.' : 'Thank you for making that distinction. How would you describe what you feel now?', { rule: 'emotion-negation', pending: s.social.quiet ? null : { kind: 'elaborate' } });
      if (/\b(?:everyone (?:hates|dislikes|thinks)|nobody (?:cares|likes|loves)|no one (?:cares|likes|loves)|always (?:fail|mess)|never (?:get anything right|succeed)|i am (?:worthless|a failure|useless|unlovable|a loser))\b/.test(t)) {
        return this.finish('That sounds painful to believe about yourself. I can take the feeling seriously without agreeing that it tells the whole story.' + (s.social.quiet ? '\n\nYou can say more about what has brought you to this point.' : '\n\nWhat happened most recently that made that conclusion feel true?'), { rule: 'validate-not-verdict', pending: s.social.quiet ? null : { kind: 'elaborate' } });
      }
      if (/\b(?:tell me (?:everything|it) will be (?:okay|fine)|promise (?:everything|it) will|reassure me|am i going to fail)\b/.test(t)) return this.finish('I cannot promise an outcome I do not know. What I can say is that a difficult outcome would not define your whole worth, and you do not have to work through the uncertainty alone.' + (s.social.quiet ? '' : '\n\nWhich part of not knowing is hardest right now?'), { rule: 'honest-reassurance', pending: s.social.quiet ? null : { kind: 'elaborate' } });

      const thirdPerson = /\bmy (?:friend|sister|brother|mother|father|mom|dad|partner) (?:is|feels|seems)\b/.test(t) && !/\bi (?:am|feel|have been feeling)\b/.test(t);
      if (thirdPerson) return this.finish('It sounds like you are noticing what ' + (s.facts.person?.value || 'someone close to you').replace(/^my /i, 'your ') + ' is going through.' + (s.social.quiet ? '\n\nThere is room for your experience of it, too.' : '\n\nHow is it affecting you?'), { rule: 'third-person', pending: s.social.quiet ? null : { kind: 'elaborate' } });
      const structured = this.structuredReply(scores);
      if (structured) return structured;
      if (/\bi (?:failed|did not pass|got a bad grade|did badly)\b/.test(t)) return this.finish('A disappointing result can hurt. It does not settle what you are capable of.' + (s.social.quiet ? '\n\nYou do not have to turn the disappointment into a plan right away.' : '\n\nWhat feels hardest: the result itself, what comes next, or what you are telling yourself about it?'), { rule: 'school-setback', suggestions: s.social.quiet ? [] : ['The result itself', 'What comes next', 'What I tell myself'], pending: s.social.quiet ? null : { kind: 'question', id: 'school-pressure' } });
      if (topic === 'joy' && /\b(?:something good|good news|actually pretty good)\b/.test(t)) return this.finish('There is room for good things here, too. Tell me what happened.' + (s.social.quiet ? '' : ' What feels good about it?'), { rule: 'joy-opening', pending: { kind: 'elaborate' } });
      const isSchoolEvent = /\b(?:exam|test|quiz|midterm)\b/.test(t) && !s.facts.subject && topic !== 'joy';
      if (isSchoolEvent && !s.social.quiet) {
        return this.finish((s.lastEmotion ? this.pick('emotion-' + s.lastEmotion, C.emotions[s.lastEmotion].lines) + '\n\n' : '') + 'Which subject is it for?', { rule: 'ask-subject', pending: { kind: 'subject' }, candidates: scores });
      }
      if (s.mode === 'step') return this.finish(C.topics[topic].step, { rule: 'step-offer', suggestions: C.topics[topic].steps, pending: { kind: 'next-step' }, candidates: scores });
      const emotionLine = s.lastEmotion ? this.pick('emotion-' + s.lastEmotion, C.emotions[s.lastEmotion].lines) : '';
      if (s.social.quiet) {
        const listening = this.pick('listen', C.listening);
        return this.finish([emotionLine, listening].filter(Boolean).join(' '), { rule: 'listen', suggestions: s.turn % 3 === 0 ? ["I'd like a question", 'A small step', 'Ask me something'] : [], candidates: scores });
      }

      if (/\b(?:weather|capital of|write (?:me )?(?:code|a poem)|solve (?:this|the)|who (?:won|invented)|what is \d|what is the (?:capital|population)|tell me a fact)\b/.test(t)) return this.finish('I do not have a general knowledge engine or live information. My useful territory is reflection: what you are feeling, what matters to you, and what you might do next.\n\nWould you like to talk about something on your mind?', { rule: 'outside-scope', suggestions: C.starters });
      const words = t.match(/[a-z]+/g) || [];
      const understandable = /\b(?:i|my|me|we|they|he|she|it|this|that|feel|because|today|yesterday|tomorrow|yes|no|not|some|the|a|there|nothing|something)\b/.test(t);
      if ((!scores.length && !understandable && words.length > 3) || !words.length) return this.finish('I am not sure I followed that. Could you say it another way? I work best with plain English and one thought at a time.', { rule: 'low-confidence', pending: { kind: 'elaborate' } });
      if (!scores.length && topic === 'general' && !previous) return this.finish(C.topics.general.opening, { rule: 'open-clarification', pending: { kind: 'elaborate' } });

      // A matched answer advances its topic; explicit new topics take priority.
      if (/\b(?:need|needed|want|wanted)\b.{0,25}\b(?:reassurance|respect|heard|listened to|understood)\b/.test(t) && !s.asked.includes('rel-need')) s.asked.push('rel-need');
      if (/\b(?:afraid|worried|scared)\b.{0,12}\b(?:that|i will|i might|of|about)\b/.test(t) && !s.asked.includes('worry-prediction')) s.asked.push('worry-prediction');
      const question = this.question(topic);
      let lead = emotionLine;
      if (positiveEvent) lead = 'That sounds worth celebrating. You can give the result a little room before looking for the next thing.';
      if (!lead && previous?.kind === 'question' && !strongChange) lead = this.pick('ack', C.acknowledgements);
      if (!lead && scores.length && (oldTopic !== topic || s.turn % 3 === 0)) lead = this.pick('topic-' + topic, C.topics[topic].reflections);
      if (!lead && !scores.length) lead = this.pick('ack', C.acknowledgements);
      if (!question) return this.finish([lead, 'We have explored a few sides of this. Would it help to stay with what you feel, choose a small step, or talk about another part of your day?'].filter(Boolean).join('\n\n'), { rule: 'topic-complete', suggestions: ['Friend mode', 'A small step', 'Ask me something'], candidates: scores });
      return this.finish([lead, question.text].filter(Boolean).join('\n\n'), { rule: 'topic-question', ...question, candidates: scores });
    }
  }
  return { Engine, normalize, detectEmotion, topicScores, classifySafety, FACT_LABELS, sentenceCount };
});
