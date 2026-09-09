/* Shared, bounded conversation frames for everyday chat.
   This is a deterministic phrase scorer, typed question tracker, story memory,
   tone detector, and response composer. It makes no network requests. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./everyday.js'));
  else root.StillConversation = factory(root.StillEveryday);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';

  const clean = (value, max = 220) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  const norm = value => E.normalize(clean(value, 4000).normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\b(i'm|im)\b/g, 'i am').replace(/\b(i've|ive)\b/g, 'i have')
    .replace(/\b(don't|dont)\b/g, 'do not').replace(/\b(didn't|didnt)\b/g, 'did not')
    .replace(/\b(can't|cant)\b/g, 'cannot').replace(/\s+/g, ' ').trim());
  const quote = value => '“' + clean(value, 140).replace(/[“”]/g, '"') + '”';
  const sentence = value => /[.!?]$/.test(value) ? value : value + '.';
  const valueOf = fact => fact && typeof fact.value === 'string' ? fact.value : '';
  const toYou = value => clean(value, 160).replace(/\bmyself\b/gi, 'yourself').replace(/\bmy\b/gi, 'your').replace(/\bmine\b/gi, 'yours').replace(/\bme\b/gi, 'you');
  const short = t => t.split(/\s+/).filter(Boolean).length <= 7;
  const YES = /^(?:yes|yeah|yep|sure|kind of|sort of|a little|sometimes|we have|i have|pretty often|often)[.! ]*$/;
  const NO = /^(?:no|nope|not really|not yet|never|we have not|i have not)[.! ]*$/;
  const UNKNOWN = /^(?:i do not know|i am not sure|not sure|maybe|hard to say|no idea|i have no idea)[.! ]*$/;
  const QUIET = /^(?:nothing|nothing else|not much|i do not know what to say|i have nothing more to say|ask me something|change the subject|different topic|something else)[.! ]*$/;
  const GREETING = /^(?:hi|hello|hey|hiya|good morning|good evening|hey there)[!., ]*$/;

  // A phrase contributes more than a loose token. This prevents incidental
  // locations such as "at school" from beating "I have a crush".
  const INTENTS = {
    romance: {
      topic: 'relationships', label: 'your crush',
      patterns: [
        [/\b(?:have|got) (?:a |this )?crush\b/, 12], [/\b(?:crushing on|have feelings for|attracted to)\b/, 11],
        [/\bi (?:really |kind of |sort of )?(?:like|fancy|am into) (?:this |that |a |the )?(?:girl|boy|guy|woman|man|someone|person)\b/, 10],
        [/\bi (?:really )?(?:like|am into) (?:her|him|them)\b/, 8], [/\bmy crush\b|\blike a crush\b/, 9],
        [/\bi am (?:really )?into (?:her|him|them)\b/, 10],
        [/\bthere(?:'s| is) (?:this |a )?(?:girl|boy|guy|person|someone) i (?:really )?like\b/, 10]
      ]
    },
    school_event: {
      topic: 'school', label: 'school',
      patterns: [
        [/\b(?:have|got|taking|writing|studying for|preparing for) (?:an? |my )?(?:[a-z]+ )?(?:exam|test|quiz|midterm|final)\b/, 10],
        [/\b(?:exam|test|quiz|midterm|final) (?:tomorrow|today|on |next |this )\b/, 9],
        [/\b(?:exam|test|quiz|midterm|final|assessment) (?:is )?(?:tomorrow|today|on |next |this )\b/, 9],
        [/\b[a-z][a-z-]{2,24} (?:exam|test|quiz|midterm|assignment|assessment)\b/, 7],
        [/\b(?:homework|assignment|school project|class presentation|grade|report card)\b/, 6],
        [/\bschool (?:is|has been|was|feels)\b|\bmy class\b/, 5]
      ]
    },
    plan: {
      topic: 'general', label: 'your plan',
      patterns: [
        [/\bi (?:am going to|plan to|am planning to|intend to)\s+[^.!?]{2,}/, 8],
        [/\bi am looking forward to\s+[^.!?]{2,}/, 9],
        [/\bi (?:might|hope to|am thinking (?:of|about)) (?:go|going|visit|try|start|see)\b[^.!?]*/, 6],
        [/\b(?:this weekend|next week|tomorrow) i (?:am|will|might)\b/, 7]
      ]
    },
    hobby: {
      topic: 'joy', label: 'what you have been into',
      patterns: [
        [/\bi (?:just )?(?:started|have started|am|have been) (?:playing|reading|watching|making|building|drawing|writing|learning|practicing|practising|listening to)\b/, 9],
        [/\bi (?:have been |am )?(?:getting into|obsessed with|really into)\s+[^.!?]{2,}/, 8],
        [/\bi (?:really )?(?:like|love|enjoy)\s+[^.!?]{2,}/, 5],
        [/\bmy (?:hobby|favorite game|favourite game|favorite book|favourite book)\b/, 6]
      ]
    },
    achievement: {
      topic: 'joy', label: 'something that went well',
      patterns: [
        [/\bi (?:finally |just |actually )?(?:passed|won|finished|completed|succeeded|graduated)\b/, 11],
        [/\bi (?:got accepted|got the job|got a promotion|set a (?:new )?(?:record|pr)|made the team)\b/, 12]
      ]
    },
    setback: {
      topic: 'school', label: 'a setback',
      patterns: [
        [/\bi (?:just |still )?(?:failed|did not pass|got a bad grade|lost)\b/, 11],
        [/\bi did not (?:get|make|finish)\b/, 8], [/\b(?:it|that) went (?:badly|terribly|awful)\b/, 8]
      ]
    },
    conflict: {
      topic: 'relationships', label: 'an argument',
      patterns: [
        [/\bi (?:argued|fought|had an argument|had a fight) with\b/, 11],
        [/\bi had a disagreement with\b/, 10],
        [/\bmy (?:friend|partner|boyfriend|girlfriend|brother|sister|mom|dad|parent) (?:yelled|shouted|snapped) at me\b/, 10],
        [/\b(?:we are|we have been) (?:arguing|fighting|not speaking)\b/, 9]
      ]
    },
    relationship_event: {
      topic: 'relationships', label: 'something that happened between you',
      patterns: [
        [/\b(?:my (?:partner|boyfriend|girlfriend)|he|she|they) (?:just )?(?:broke up with|left) me\b/, 12],
        [/\b(?:my (?:friend|partner|boyfriend|girlfriend)|he|she|they) (?:ignored me|left me on read|stopped talking to me|did not (?:reply|respond|text back)|has not (?:replied|responded))\b/, 10]
      ]
    },
    social_event: {
      topic: 'relationships', label: 'time with someone',
      patterns: [
        [/\bi (?:hung out|met up|spent time|went out) with\b/, 9],
        [/\b(?:my friends and i|me and my friends|a friend and i)\b/, 7]
      ]
    },
    work_event: {
      topic: 'work', label: 'work',
      patterns: [
        [/\b(?:at work|my shift|my boss|my coworker|my colleague|work project|work deadline)\b/, 6],
        [/\bwork (?:was|is|has been|feels)\b/, 5]
      ]
    },
    personal_update: {
      topic: 'family', label: 'someone you mentioned', patterns: []
    }
  };

  Object.assign(INTENTS, Object.fromEntries(Object.values(E.cards).map(card => [card.id, { topic: card.topic, label: card.label, patterns: card.patterns }])));
  function fresh() {
    return { version: 1, stories: [], serial: 0, active: null, question: null, deferred: null, clarification: null, corrections: [], used: [], lastRecall: -10, lastIntent: null, lastTone: null, focus: null, recovery: null, lastValidation: -10 };
  }

  function negated(t, index) {
    const before = t.slice(Math.max(0, index - 40), index);
    return /\b(?:not|never|no longer|used to|do not|did not)\b(?:\s+\w+){0,4}\s*$/.test(before);
  }

  function scoreIntent(t) {
    const scores = [];
    for (const [id, def] of Object.entries(INTENTS)) {
      let score = 0, evidence = '';
      for (const [re, weight] of def.patterns) {
        re.lastIndex = 0; const match = re.exec(t);
        if (match && !negated(t, match.index)) { score += weight; if (!evidence) evidence = match[0]; }
      }
      if (id === 'romance' && /\b(?:friend|brother|sister|music|game|book|movie)\b/.test(t) && !/\b(?:crush|feelings for|attracted|girl|boy|guy|woman|man|her|him|them)\b/.test(t)) score -= 6;
      if (id === 'hobby' && /\bi (?:really )?(?:like|love|enjoy) (?:my |this |that )?(?:friend|brother|sister|mom|dad|partner|boyfriend|girlfriend|girl|boy|guy|woman|man|her|him|them)\b/.test(t)) score = 0;
      if (id === 'hobby' && /\bi am (?:really )?(?:into|obsessed with) (?:her|him|them|this girl|this boy|this guy)\b/.test(t)) score = 0;
      if (id === 'school_event' && /\bmy (?:friend|brother|sister|mom|dad|partner|boyfriend|girlfriend) (?:has|had|is taking|is writing|failed|passed)\b[^.!?]*\b(?:exam|test|quiz|assignment)\b/.test(t) && !/\bi (?:have|am|feel|failed|passed|need)\b/.test(t)) score = 0;
      if (id === 'plan' && /\bi (?:am going to|plan to) (?:die|hurt|harm|kill)\b/.test(t)) score = 0;
      if (score > 0) scores.push({ id, score, evidence, topic: def.topic, label: def.label });
    }
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    if (!best || best.score < 5) return null;
    return { ...best, confidence: best.score >= 9 ? 'high' : 'medium', alternatives: scores.slice(1, 3) };
  }

  const toneWords = {
    happy: ['happy', 'excited', 'proud', 'relieved', 'delighted', 'glad'],
    sad: ['sad', 'miserable', 'heartbroken', 'upset', 'down'],
    anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stressed'],
    angry: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated'],
    hurt: ['hurt', 'rejected', 'betrayed', 'ignored', 'unwanted'],
    tired: ['tired', 'exhausted', 'drained', 'overwhelmed', 'burned out'],
    lonely: ['lonely', 'isolated', 'left out'],
    guilty: ['guilty', 'ashamed', 'embarrassed', 'regretful']
  };
  function detectTone(raw, normalized) {
    const t = normalized || norm(raw);
    const candidates = [];
    for (const [id, words] of Object.entries(toneWords)) {
      for (const word of words) {
        const re = new RegExp('\\b' + word.replace(/ /g, '\\s+') + '\\b', 'g');
        for (const match of t.matchAll(re)) {
          if (negated(t, match.index)) continue;
          const before = t.slice(Math.max(0, match.index - 45), match.index);
          const self = /\bi (?:am|feel|felt|have been feeling)\b[^.!?;]*$/.test(before);
          const other = /\b(?:my [a-z]+|he|she|they) (?:is|feels|seems|has been)\b[^.!?;]*$/.test(before);
          const situation = /\b(?:this|that|it) (?:is|was|feels|felt|seems)\b[^.!?;]*$/.test(before);
          const standalone = new RegExp('^(?:really |very |so )?' + word.replace(/ /g, '\\s+') + '[.! ]*$').test(t);
          if (!self && !other && !situation && !standalone) continue;
          const target = self ? 'self' : other ? 'other' : 'situation';
          candidates.push({ emotion: id, evidence: match[0], target, explicit: self || other, confidence: self || other ? 'high' : 'medium', index: match.index });
        }
      }
    }
    const rank = { self: 3, other: 2, situation: 1 };
    candidates.sort((a, b) => rank[b.target] - rank[a.target] || b.index - a.index);
    const primary = candidates[0];
    const distinct = [...new Set(candidates.map(item => item.emotion))];
    let emotion = primary?.emotion || null, target = primary?.target || 'situation', explicit = primary?.explicit || false, evidence = primary?.evidence || '', confidence = primary?.confidence || 'low';
    let valence = emotion === 'happy' ? 'positive' : emotion ? 'negative' : 'neutral';
    if (distinct.includes('happy') && distinct.some(id => id !== 'happy')) valence = 'mixed';
    if (!emotion && /\bi (?:passed|won|succeeded|got accepted|got the job)\b/.test(t)) { valence = 'positive'; evidence = 'positive outcome'; confidence = 'high'; }
    if (!emotion && /\bi (?:failed|did not pass|got rejected|lost)\b/.test(t)) { valence = 'negative'; evidence = 'negative outcome'; confidence = 'high'; }
    if (/\b(?:yeah right|just great|love that for me)\b/.test(t)) { valence = 'negative'; emotion = null; evidence = 'possible sarcasm'; confidence = 'low'; explicit = false; target = 'situation'; }
    return { emotion, emotions: distinct.slice(0, 3), valence, target, explicit, confidence, evidence };
  }

  function otherSubject(raw, t, state) {
    const match = raw.match(/\b(my (?:friend|partner|boyfriend|girlfriend|brother|sister|mom|mum|dad|mother|father|coworker|colleague)(?:\s+[A-ZÀ-ÖØ-Þ][\p{L}'’-]{1,35})?|he|she|they)\s+(?:is|feels|seems|has|had|failed|passed|got|started|needs|wants|likes|loves|plays|moved)\b/iu);
    if (!match) return null;
    const found = clean(match[1], 70);
    if (/^(?:he|she|they)$/i.test(found) && state?.focus?.person) return { person: state.focus.person, pronoun: found.toLowerCase() };
    return { person: found.toLowerCase().startsWith('my ') ? found.toLowerCase() : found.toLowerCase(), pronoun: /^(?:he|she|they)$/i.test(found) ? found.toLowerCase() : null };
  }

  function extract(raw, t, intent) {
    if (Object.hasOwn(E.cards, intent)) return E.extract(raw, t, intent);
    const out = {};
    const time = t.match(/\b(?:today|tonight|tomorrow|this (?:morning|afternoon|evening|weekend|week)|next (?:week|weekend|month)|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in \d+ (?:days?|weeks?))\b/);
    if (time) out.time = time[0];
    const person = raw.match(/\bmy (friend|partner|boyfriend|girlfriend|brother|sister|mom|mum|dad|mother|father|coworker|colleague)(?:\s+([A-ZÀ-ÖØ-Þ][\p{L}'’-]{1,35}))?/iu);
    if (person) out.person = clean('my ' + person[1].toLowerCase() + (person[2] && /^[A-ZÀ-ÖØ-Þ]/u.test(person[2]) ? ' ' + person[2] : ''), 70);
    if (intent === 'romance') {
      const kind = t.match(/\b(girl|boy|guy|woman|man|someone|person|her|him|them)\b/);
      out.person = out.person || (kind ? kind[1] : 'your crush');
      if (/\b(?:at|from|in) (?:my |the )?school\b/.test(t)) out.context = 'school';
      const attraction = raw.match(/\b(?:because|since)\s+([^.!?]{2,120})/i);
      if (attraction) out.attraction = clean(attraction[1], 120);
    }
    if (intent === 'school_event' || intent === 'achievement' || intent === 'setback') {
      const type = t.match(/\b(exam|test|quiz|midterm|final|assessment|assignment|homework|presentation|project|grade)\b/);
      if (type) out.event = type[1];
      const before = t.match(/\b([a-z][a-z-]{2,24}) (?:exam|test|quiz|midterm|final|assessment|assignment|homework)\b/);
      const after = t.match(/\b(?:exam|test|quiz|midterm|final) (?:in|for|on) ([a-z][a-z -]{1,30}?)(?=\b(?:today|tomorrow|on|next|this)\b|[.!?,]|$)/);
      const blocked = /^(?:an|the|my|this|that|another|big|final|hard|school)$/;
      if (before && !blocked.test(before[1])) out.subject = before[1];
      else if (after && !blocked.test(after[1])) out.subject = clean(after[1], 35);
    }
    if (intent === 'hobby') {
      const activity = raw.match(/\b(?:playing|reading|watching|making|building|drawing|writing|learning|practicing|practising|listening to|getting into|obsessed with|really into|like|love|enjoy)\s+([^.!?;]{2,100})/i);
      if (activity) out.activity = clean(activity[1].split(/\s+(?:with|because|but|and then)\s+/i)[0], 90);
    }
    if (intent === 'plan') {
      const plan = raw.match(/\b(?:I am going to|I'm going to|I plan to|I am planning to|I'm planning to|I am looking forward to|I hope to|I might|I am thinking (?:of|about))\s+([^.!?;]{2,140})/i);
      if (plan) out.plan = clean(plan[1], 140);
    }
    if (intent === 'social_event') {
      const activity = raw.match(/\b(?:hung out|met up|spent time|went out)\s+([^.!?;]{2,120})/i);
      if (activity) out.activity = clean(activity[0], 120);
    }
    if (intent === 'conflict') {
      const cause = raw.match(/\b(?:because|over|about)\s+([^.!?;]{2,120})/i);
      if (cause) out.cause = clean(cause[1], 120);
    }
    if (intent === 'relationship_event') {
      if (/\b(?:broke up with|left) me\b/.test(t)) out.event = 'breakup';
      else if (/\b(?:ignored me|left me on read|stopped talking|did not (?:reply|respond|text back)|has not (?:replied|responded))\b/.test(t)) out.event = 'silence';
    }
    return out;
  }

  function storyTitle(intent, entities) {
    if (Object.hasOwn(E.cards, intent)) { const card = E.cards[intent], detail = entities[card.stages[0].slot]; return card.label + (detail ? ': ' + clean(detail, 80) : ''); }
    if (intent === 'romance') return entities.context === 'school' ? 'your crush at school' : 'your crush';
    if (intent === 'school_event') return [entities.subject, entities.event || 'school'].filter(Boolean).join(' ');
    if (intent === 'plan') return entities.plan || 'your plan';
    if (intent === 'hobby') return entities.activity || 'what you have been into';
    if (intent === 'conflict') return entities.person ? 'the argument with ' + entities.person : 'the argument';
    if (intent === 'relationship_event') return entities.event === 'breakup' ? 'the breakup' : entities.event === 'silence' ? 'the unanswered message' : 'what happened between you';
    if (intent === 'social_event') return entities.activity || 'time with friends';
    if (intent === 'achievement') return entities.event ? 'passing your ' + entities.event : 'something that went well';
    if (intent === 'setback') return entities.event ? 'the ' + entities.event + ' result' : 'the setback';
    if (intent === 'personal_update') return entities.person || 'someone you mentioned';
    return INTENTS[intent]?.label || 'what you mentioned';
  }
  function baseIntent(intent, entities) {
    if (['achievement', 'setback'].includes(intent) && entities.event) return 'school_event';
    return intent;
  }
  function fact(value, turn, source) { return { value: clean(value, 160), turn, source: clean(source, 300) }; }
  function mergeEntities(story, entities, turn, raw) {
    for (const [key, value] of Object.entries(entities)) if (value) story.facts[key] = fact(value, turn, raw);
    story.title = storyTitle(story.intent, Object.fromEntries(Object.entries(story.facts).map(([k, v]) => [k, v.value])));
  }
  function current(state) { return state.stories.find(story => story.id === state.active) || null; }
  function identityFor(intent, entities) {
    if (Object.hasOwn(E.cards, intent)) return entities[E.cards[intent].stages[0].slot] || '';
    const base = baseIntent(intent, entities);
    if (base === 'school_event') return entities.subject || entities.event || '';
    if (base === 'plan') return entities.plan || '';
    if (base === 'hobby') return entities.activity || '';
    if (base === 'conflict' || base === 'personal_update') return entities.person || '';
    if (base === 'social_event') return entities.person || entities.activity || '';
    return '';
  }
  function findStory(state, intent, entities) {
    const base = baseIntent(intent, entities);
    const active = current(state);
    const subject = identityFor(intent, entities);
    if (active && active.intent === base) {
      const activeValues = Object.values(active.facts).map(f => norm(f.value));
      const same = !subject || !activeValues.length || activeValues.some(value => value.includes(norm(subject)) || norm(subject).includes(value));
      if (same) return active;
    }
    return state.stories.slice().reverse().find(story => story.intent === base && (!subject || Object.values(story.facts).some(f => norm(f.value).includes(norm(subject)) || norm(subject).includes(norm(f.value))))) || null;
  }
  function upsertStory(state, intent, entities, raw, turn) {
    const base = baseIntent(intent, entities);
    let story = findStory(state, intent, entities);
    if (!story) {
      story = { id: 'story-' + (++state.serial), intent: base, topic: INTENTS[intent]?.topic || 'general', title: storyTitle(base, entities), status: 'open', first: turn, lastMention: turn, lastAsked: -10, recall: true, sensitive: false, facts: {}, turns: [], acknowledged: [] };
      state.stories.push(story); state.stories = state.stories.slice(-8);
    }
    story.lastMention = turn; story.topic = INTENTS[intent]?.topic || story.topic;
    if (Object.hasOwn(E.cards,base) && E.cards[base].sensitive) { story.sensitive = true; story.recall = false; }
    story.turns.push({ turn, text: clean(raw, 300) }); story.turns = story.turns.slice(-6);
    mergeEntities(story, entities, turn, raw);
    if (intent === 'achievement') { story.status = 'resolved'; story.facts.outcome = fact('positive', turn, raw); }
    if (intent === 'setback') { story.status = 'resolved'; story.facts.outcome = fact('negative', turn, raw); }
    state.active = story.id; state.lastIntent = intent;
    return story;
  }

  function pick(state, key, choices) {
    let index = choices.findIndex((_, i) => !state.used.includes(key + ':' + i));
    if (index < 0) { state.used = state.used.filter(id => !id.startsWith(key + ':')); index = 0; }
    state.used.push(key + ':' + index); state.used = state.used.slice(-80); return choices[index];
  }
  function acknowledge(story, key, text) {
    if (!story || story.acknowledged.includes(key) || !text) return '';
    story.acknowledged.push(key); story.acknowledged = story.acknowledged.slice(-20); return text;
  }
  function compose(parts) {
    const seen = new Set(), result = [];
    for (let part of parts.flat()) {
      part = clean(part, 500); if (!part) continue;
      const key = norm(part).replace(/[^a-z0-9 ]/g, '');
      if (!seen.has(key)) { seen.add(key); result.push(sentence(part)); }
    }
    return result.join(' ');
  }
  // These transitions let volunteered details bypass questions before they are
  // shown. Only explicit patterns below fill a slot; unknown is not a fact.
  const NEXT = {
    attraction: ['romance-contact', 'Have you two talked much yet?', ['yes', 'no', 'frequency'], 'contact'],
    contact: ['romance-conversation', 'What do you usually end up talking about?', ['description'], 'conversation'],
    conversation: ['romance-want', 'What would you like to happen between you two?', ['description'], 'goal'],
    commonGround: ['romance-opener', 'What would you feel comfortable saying next time?', ['description', 'action'], 'opener'],
    opener: ['romance-next', 'When do you think you might see them next?', ['time', 'description'], 'nextContact'],
    subject: ['school-preparation', 'How is your preparation going?', ['description', 'frequency'], 'preparation'],
    preparation: ['school-concern', 'What part of it is taking up the most thought?', ['description'], 'concern'],
    concern: ['school-help', 'What would leave you feeling a little more prepared?', ['description', 'action'], 'helpful'],
    anticipation: ['plan-company', 'Are you doing it on your own or with someone?', ['description', 'person'], 'company'],
    company: ['plan-ready', 'Is everything arranged, or is there still something to figure out?', ['description'], 'readiness'],
    origin: ['hobby-current', 'What part of it are you most into right now?', ['description'], 'favoritePart'],
    favoritePart: ['hobby-detail', 'What do you like about that part?', ['description', 'reason'], 'whyFavorite'],
    cause: ['conflict-want', 'What would you like to happen between you now?', ['description'], 'goal'],
    duration: ['relationship-usual', 'Is this unusual for them?', ['yes', 'no', 'description'], 'usual'],
    expected: ['relationship-now', 'What has the time since then been like?', ['description'], 'aftermath'],
    aftermath: ['relationship-need', 'What would be most helpful from the people around you?', ['description'], 'need'],
    bestPart: ['achievement-share', 'Have you told anyone else yet?', ['yes', 'no', 'person'], 'shared']
  };
  function harvest(story, raw, t, turn) {
    if (!story) return;
    const put = (key, value) => { if (value) story.facts[key] = fact(value, turn, raw); };
    const capture = (key, re) => { const m = raw.match(re); if (m) put(key, m[1] || m[0]); };
    if (story.intent === 'romance') {
      capture('attraction', /\b(?:because|what I like about (?:her|him|them) is)\s+([^.!?;]{2,150})/i);
      capture('contact', /\b(?:we|the two of us)\s+(?:(?:do not|don't|never)\s+)?(?:talk|chat|text|speak)(?:ed)?(?:\s+(?:every day|daily|often|sometimes|rarely|a lot|all the time|at school))?/i);
      capture('contact', /\b(?:we have never talked|we haven't talked|we have not talked)\b/i);
      capture('conversation', /\bwe (?:talk|chat|text)(?:\s+(?:every day|daily|often|sometimes|a lot|all the time))? about\s+([^.!?;]{2,120})/i);
      capture('commonGround', /\bwe (?:share|have)\s+((?:a |the same )?(?:class|activity|mutual friends)[^.!?;]{0,70})/i);
    }
    if (story.intent === 'school_event') {
      capture('preparation', /\bI (?:have |have been |already |am |keep )?(?:studied|studying|prepared|preparing|revised|revising)\b[^.!?;]{0,120}/i);
      capture('concern', /\bI(?:'m| am| feel) (?:most )?(?:worried|nervous|anxious) about\s+([^.!?;]{2,120})/i);
    }
    if (story.intent === 'plan') {
      capture('company', /\b(?:with (?:my |a )?(?:friend|brother|sister|mom|dad|partner)(?:\s+[A-Z][a-z]+)?|(?:on my own|by myself|alone))\b/i);
      capture('readiness', /\b(?:everything is (?:booked|arranged|ready)|I (?:have |already )?booked [^.!?;]{2,80})/i);
      capture('anticipation', /\b(?:most excited about|looking forward to)\s+([^.!?;]{2,120})/i);
    }
    if (story.intent === 'hobby') capture('origin', /\b([^.!?;]{0,45}(?:introduced me to it|got me into it))\b/i);
    if (story.intent === 'conflict') capture('cause', /\b(?:because|over|about)\s+([^.!?;]{2,120})/i);
    if (story.intent === 'relationship_event') capture('duration', /\b(?:for|since)\s+((?:\d+|a|an|one|two|three|last)\s+(?:hours?|days?|weeks?|night|weekend))\b/i);
    capture('goal', /\bI (?:want|hope) (?:us |to )[^.!?;]{2,120}/i);
  }
  function setQuestion(state, story, id, text, expects, slot, turn, visited = []) {
    if (story && slot && (story.facts[slot] || story.skipped?.includes(slot)) && !visited.includes(slot)) {
      let next = NEXT[slot];
      if (slot === 'contact' && /\b(?:never|not|no|haven't|don't)\b/i.test(valueOf(story.facts.contact))) next = ['romance-common', 'Do you share a class, activity, or mutual friends?', ['yes', 'no', 'description'], 'commonGround'];
      if (slot === 'goal') next = story.intent === 'romance' ? ['romance-step', 'What would feel like a comfortable next step?', ['action', 'description'], 'nextStep'] : ['conflict-next', 'Is there anything you want to say to them?', ['description', 'action'], 'next'];
      if (next) return setQuestion(state, story, ...next, turn, [...visited, slot]);
      id = 'open-detail'; text = 'Which part of this would you like to say more about?'; expects = ['description']; slot = null;
    }
    state.question = { id, text, intent: story?.intent || 'general', story: story?.id || null, subject: story?.title || null, expects: [...expects].slice(0, 5), slot, askedTurn: turn };
    if (story) story.lastAsked = turn;
    return text;
  }
  function classifyAnswer(raw, t, question) {
    if (YES.test(t)) return { kind: 'yes', value: clean(raw) };
    if (NO.test(t)) return { kind: 'no', value: clean(raw) };
    if (UNKNOWN.test(t)) return { kind: 'unknown', value: clean(raw) };
    if (/\b(?:every day|daily|often|sometimes|rarely|once|twice|all the time|not often|a lot)\b/.test(t)) return { kind: 'frequency', value: clean(raw) };
    if (/\b(?:today|tonight|tomorrow|yesterday|last |next |this weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\b(?:\d+|one|two|three|a|an|several|few) (?:hours?|days?|weeks?|months?)\b/.test(t)) return { kind: 'time', value: clean(raw) };
    if (/\b(?:could|would|might|plan|going to|ask|say|try)\b/.test(t)) return { kind: 'action', value: clean(raw) };
    if (/\bbecause\b/.test(t)) return { kind: 'reason', value: clean(raw) };
    return { kind: question.expects.includes('description') ? 'description' : 'detail', value: clean(raw) };
  }
  function fitsQuestion(raw, t, question, tone) {
    const answer = classifyAnswer(raw, t, question);
    if (answer.kind === 'unknown') return true;
    if (['yes','no'].includes(answer.kind)) return question.expects.includes(answer.kind);
    if (question.slot === 'subject') return /^(?:(?:it is|it's|its|the subject is) )?[a-z][a-z -]{1,35}[.!]*$/.test(t) && !/\b(?:i|my|we|he|she|they|not|feel|am|worried|sad|angry)\b/.test(t);
    if (question.slot === 'duration' || question.slot === 'nextContact') return answer.kind === 'time';
    if (question.slot === 'contact') return answer.kind === 'frequency' || /\b(?:we (?:talk|chat|text|speak)|talked|spoken|never|not yet)\b/.test(t);
    if (tone.target === 'self' && tone.explicit && !['impact','concern','feelingAboutNext','feelingContext','bestPart','aftermath','update'].includes(question.slot)) return false;
    if (question.slot === 'conversation' && /\bi (?:want|hope|plan|am going)\b/.test(t)) return false;
    return true;
  }
  function storeAnswer(story, question, answer, turn, raw) {
    if (!story || !question.slot || answer.kind === 'unknown' || story.facts[question.slot]?.turn === turn || ['yes','no'].includes(answer.kind) && !question.expects.includes(answer.kind)) return;
    story.facts[question.slot] = fact(answer.value, turn, raw);
    story.lastMention = turn;
  }
  function replyObject(state, story, intent, tone, parts, rule, question = null) {
    state.lastTone = tone; state.lastIntent = intent;
    return { text: compose(parts), rule: 'conversation-' + rule, suggestions: [], topic: story?.topic || INTENTS[intent]?.topic || 'general', intent, tone, story: story?.id || null, question };
  }

  function initialReply(state, story, intent, entities, tone, turn) {
    if (Object.hasOwn(E.cards, intent)) return everydayReply(state, story, '', '', tone, turn);
    let reaction = '', detail = '', question = '';
    if (intent === 'romance') {
      reaction = pick(state, 'romance-open', ['There is someone you have feelings for', 'Okay, you mean a crush', 'There is someone you like romantically']);
      detail = acknowledge(story, 'context', entities.context === 'school' ? 'You know them from school' : '');
      question = setQuestion(state, story, 'romance-attraction', 'What is it about them that you like?', ['description', 'reason'], 'attraction', turn);
    } else if (intent === 'school_event') {
      const label = [entities.subject, entities.event || 'school thing'].filter(Boolean).join(' ');
      reaction = tone.target === 'self' && tone.emotion ? toneReaction(state, tone) : 'You have ' + (/^[aeiou]/.test(label) ? 'an ' : 'a ') + label + (entities.time ? ' ' + entities.time : ' coming up');
      if (!entities.subject && entities.event) question = setQuestion(state, story, 'school-subject', 'What subject is it for?', ['description'], 'subject', turn);
      else question = setQuestion(state, story, 'school-preparation', 'How is your preparation going?', ['description', 'frequency'], 'preparation', turn);
    } else if (intent === 'plan') {
      reaction = tone.valence === 'positive' ? toneReaction(state, tone) : 'That gives you something ahead to think about';
      detail = acknowledge(story, 'plan', entities.plan ? 'The plan is ' + quote(entities.plan) : '');
      question = setQuestion(state, story, 'plan-interest', 'What are you most looking forward to about it?', ['description', 'reason'], 'anticipation', turn);
    } else if (intent === 'hobby') {
      reaction = pick(state, 'hobby-open', ['Nice', 'That sounds worth talking about', 'Okay, I want to hear about that']);
      detail = acknowledge(story, 'activity', entities.activity ? 'You have been into ' + entities.activity : '');
      question = setQuestion(state, story, 'hobby-origin', 'What got you into it?', ['description', 'reason', 'person'], 'origin', turn);
    } else if (intent === 'achievement') {
      reaction = pick(state, 'achievement-open', ['Nice—that is worth celebrating', 'That is good news', 'You got the result you were hoping for']);
      detail = entities.event ? 'You passed your ' + entities.event : '';
      question = setQuestion(state, story, 'achievement-best', 'What was the best part of finding out?', ['description'], 'bestPart', turn);
    } else if (intent === 'setback') {
      reaction = 'That is a disappointing result to get';
      detail = entities.effort ? 'You ' + toYou(entities.effort) + ', so the result does not erase the work you put in' : tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : '';
      question = setQuestion(state, story, 'setback-event', 'What happened?', ['description', 'reason'], 'explanation', turn);
    } else if (intent === 'conflict') {
      reaction = tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : 'An argument can leave a lot hanging in the air';
      detail = entities.person ? 'This was with ' + entities.person.replace(/^my /, 'your ') : '';
      question = entities.cause ? setQuestion(state, story, 'conflict-want', 'What would you like to happen between you now?', ['description', 'action'], 'goal', turn) : setQuestion(state, story, 'conflict-cause', 'What started it?', ['description', 'reason'], 'cause', turn);
    } else if (intent === 'relationship_event') {
      if (entities.event === 'breakup') {
        reaction = tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : 'A breakup is a lot of change at once';
        question = setQuestion(state, story, 'relationship-expected', 'Was this something you saw coming?', ['yes', 'no', 'description'], 'expected', turn);
      } else {
        reaction = tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : 'Being left waiting without an answer can be difficult';
        question = setQuestion(state, story, 'relationship-duration', 'How long have they been quiet?', ['time', 'description'], 'duration', turn);
      }
    } else if (intent === 'social_event') {
      reaction = tone.valence === 'negative' ? toneReaction(state, tone) : 'Sounds like you spent some time together';
      detail = acknowledge(story, 'activity', entities.activity || '');
      question = setQuestion(state, story, 'social-best', tone.valence === 'negative' ? 'What happened while you were together?' : 'What did you end up doing?', ['description'], 'details', turn);
    } else if (intent === 'work_event') {
      reaction = tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : 'Work has been part of what is on your mind';
      question = setQuestion(state, story, 'work-detail', 'What happened there today?', ['description'], 'details', turn);
    }
    return replyObject(state, story, intent, tone, [reaction, detail, question], 'intent', state.question);
  }

  function toneReaction(state, tone) {
    if (!tone || tone.target === 'other') return '';
    if (tone.valence === 'mixed') return 'It sounds like there are mixed feelings in this';
    if (!tone.emotion && tone.valence === 'neutral') return '';
    if (tone.confidence === 'low') return 'I may be missing the tone, but this sounds like it matters to you';
    const lines = {
      happy: ['That sounds exciting', 'That sounds like a good moment', 'I can see why you are pleased about that'],
      sad: ['That sounds painful', 'That sounds like a rough thing to carry', 'I can see why that would bring you down'],
      anxious: ['That uncertainty sounds stressful', 'I can see why you are worried', 'That sounds unsettling'],
      angry: ['I can see why that frustrated you', 'That sounds aggravating', 'There is clearly some frustration in this'],
      hurt: ['That sounds hurtful', 'I can see why that stung', 'That sounds hard to be on the receiving end of'],
      tired: ['That sounds draining', 'You sound worn out by it', 'That is a lot to carry when your energy is low'],
      lonely: ['That sounds lonely', 'Missing that connection can hurt', 'I can see why the distance feels heavy'],
      guilty: ['That sounds difficult to sit with', 'I can see why you are thinking hard about your part in it']
    };
    return tone.emotion ? pick(state, 'tone-' + tone.emotion, lines[tone.emotion]) : tone.valence === 'positive' ? 'That sounds like good news' : tone.valence === 'negative' ? 'That sounds difficult' : '';
  }

  function answerReply(state, question, answer, raw, t, tone, turn) {
    const story = state.stories.find(item => item.id === question.story) || current(state);
    if (!story) { state.question = null; return null; }
    if (Object.hasOwn(E.cards, story.intent) && question.id.startsWith('everyday-')) return everydayReply(state, story, raw, t, tone, turn, question, answer);
    harvest(story, raw, t, turn);
    if (!fitsQuestion(raw, t, question, tone) && !['yes','no'].includes(answer.kind)) {
      if (tone.target === 'self' && tone.explicit) {
        story.facts.feeling = fact(tone.evidence, turn, raw); state.question = null; state.deferred = null;
        const next = setQuestion(state, story, 'feeling-detail', 'What is behind that feeling for you?', ['description'], 'feelingContext', turn);
        return replyObject(state, story, story.intent, tone, [toneReaction(state, tone), next], 'self-tone', state.question);
      }
      if (story.facts.goal?.turn === turn) {
        const next = setQuestion(state, story, 'romance-step', 'What would feel like a comfortable next step?', ['action','description'], 'nextStep', turn);
        return replyObject(state, story, story.intent, tone, ['You have said what you are hoping for', next], 'answer', state.question);
      }
      return replyObject(state, story, story.intent, tone, ['I have not got that detail yet', question.text || 'Could you put that another way?'], 'answer-clarification', question);
    }
    if (['yes', 'no'].includes(answer.kind) && !question.expects.includes(answer.kind)) {
      state.question = question;
      return replyObject(state, story, story.intent, tone, ['I am not sure which part that answers', question.text || 'Could you put that another way?'], 'answer-clarification', question);
    }
    storeAnswer(story, question, answer, turn, raw);
    story.turns.push({ turn, text: clean(raw, 300) }); story.turns = story.turns.slice(-6); story.lastMention = turn;
    state.active = story.id; state.question = null;
    let reaction = tone.target === 'self' && tone.explicit ? toneReaction(state, tone) : '', detail = '', next = '';
    const ask = (id, text, expects, slot) => { next = setQuestion(state, story, id, text, expects, slot, turn); };
    switch (question.id) {
      case 'romance-attraction':
        reaction = answer.kind === 'unknown' ? 'Sometimes it is hard to put your finger on attraction' : 'That gives me a better picture of what you see in them';
        ask('romance-contact', 'Have you two talked much yet?', ['yes', 'no', 'frequency'], 'contact'); break;
      case 'romance-contact':
        if (answer.kind === 'no') { reaction = 'So it is mostly from a distance so far'; ask('romance-common', 'Do you share a class, activity, or mutual friends?', ['yes', 'no', 'description'], 'commonGround'); }
        else if (answer.kind === 'unknown') { reaction = 'It sounds like you have only had a little contact'; ask('romance-context', 'Where do you usually see them?', ['description', 'place'], 'context'); }
        else { reaction = 'So you already have some contact'; ask('romance-conversation', 'What do you usually end up talking about?', ['description'], 'conversation'); }
        break;
      case 'romance-common':
        if (answer.kind === 'no') { reaction = 'You do not have an obvious shared setting yet'; ask('romance-context', 'Where do you tend to see them?', ['description', 'place'], 'context'); }
        else { reaction = 'That gives you something natural to talk about'; ask('romance-opener', 'What would you feel comfortable saying next time?', ['action', 'description'], 'opener'); }
        break;
      case 'romance-opener': reaction = 'That could be a simple, natural way to start'; ask('romance-next', 'When do you think you might see them next?', ['time', 'description'], 'nextContact'); break;
      case 'romance-conversation': reaction = 'You already have something to build on'; ask('romance-want', 'What would you like to happen between you two?', ['description'], 'goal'); break;
      case 'romance-signals': reaction = 'That could mean several things, so I would not treat it as proof either way'; ask('romance-signal-context', 'Is it different from how they act with other people?', ['yes', 'no', 'description'], 'signalContext'); break;
      case 'romance-signal-context': reaction = 'That is useful context, though it still cannot tell you their feelings for certain'; ask('romance-contact', 'Have you two talked much yet?', ['yes', 'no', 'frequency'], 'contact'); break;
      case 'romance-next': reaction = 'That gives you a real moment to work with'; ask('romance-feeling', 'How do you feel about talking to them then?', ['description'], 'feelingAboutNext'); break;
      case 'romance-want': reaction = 'That makes what you are hoping for clearer'; ask('romance-step', 'What would feel like a comfortable next step?', ['action', 'description'], 'nextStep'); break;
      case 'school-subject':
        if (answer.kind === 'unknown' || /^(?:yes|no)$/.test(answer.kind)) { reaction = 'I have not learned the subject yet'; ask('school-subject', 'What subject is it for?', ['description'], 'subject'); break; }
        story.facts.subject = fact(answer.value.replace(/[.!]+$/, ''), turn, raw); mergeEntities(story, {}, turn, raw);
        reaction = clean(answer.value.replace(/[.!]+$/, ''), 35) + '—got it'; ask('school-preparation', 'How is your preparation going?', ['description', 'frequency'], 'preparation'); break;
      case 'school-preparation': reaction = answer.kind === 'unknown' ? 'It may be too early to tell' : 'That helps me understand where you are with it'; ask('school-concern', 'What part of it is taking up the most thought?', ['description', 'reason'], 'concern'); break;
      case 'school-concern': reaction = toneReaction(state, tone) || 'That makes the main concern clearer'; ask('school-help', 'What would leave you feeling a little more prepared?', ['action', 'description'], 'helpful'); break;
      case 'plan-interest': reaction = answer.kind === 'unknown' ? 'You do not have to know what the best part will be yet' : 'That makes the plan feel more specific'; ask('plan-company', 'Are you doing it on your own or with someone?', ['description', 'person'], 'company'); break;
      case 'plan-company': reaction = 'That helps me picture the plan'; ask('plan-ready', 'Is everything arranged, or is there still something to figure out?', ['description', 'choice'], 'readiness'); break;
      case 'hobby-origin': reaction = answer.kind === 'unknown' ? 'Sometimes an interest just catches on' : 'That is a good origin story'; ask('hobby-current', 'What part of it are you most into right now?', ['description'], 'favoritePart'); break;
      case 'hobby-current': reaction = 'That sounds like the part that keeps you coming back'; ask('hobby-detail', 'What do you like about that part?', ['description', 'reason'], 'whyFavorite'); break;
      case 'achievement-best': reaction = toneReaction(state, tone) || 'That sounds satisfying'; ask('achievement-share', 'Have you told anyone else yet?', ['yes', 'no', 'person'], 'shared'); break;
      case 'achievement-share': reaction = answer.kind === 'no' ? 'You get to decide who to share it with' : 'It is nice to have someone else in the moment'; ask('achievement-reaction', answer.kind === 'no' ? 'Who would you most enjoy telling?' : 'How did they react?', ['description', 'person'], 'reaction'); break;
      case 'setback-event': reaction = toneReaction(state, tone) || 'That gives me more context'; ask('setback-next', 'What happens next with it?', ['description', 'action'], 'next'); break;
      case 'setback-next': reaction = 'That makes the situation less vague'; ask('setback-control', 'Is there anything you can change before then?', ['yes', 'no', 'action'], 'control'); break;
      case 'conflict-cause': reaction = toneReaction(state, tone) || 'That helps explain how the argument started'; ask('conflict-want', 'What would you like to happen between you now?', ['description', 'action'], 'goal'); break;
      case 'conflict-want': reaction = answer.kind === 'unknown' ? 'You may need more time before you know' : 'That is a clearer direction'; ask('conflict-next', 'Is there anything you want to say to them?', ['yes', 'no', 'action', 'description'], 'next'); break;
      case 'conflict-next': reaction = answer.kind === 'no' ? 'You do not have to force a conversation before you are ready' : 'That gives you somewhere to start'; ask('conflict-response', 'What response would you hope for from them?', ['description'], 'hopedResponse'); break;
      case 'relationship-expected': reaction = answer.kind === 'no' ? 'Being surprised by it can make the change harder to take in' : answer.kind === 'yes' ? 'Knowing it might happen does not make the change meaningless' : 'That gives me more of the lead-up'; ask('relationship-now', 'What has the time since then been like?', ['description'], 'aftermath'); break;
      case 'relationship-duration': reaction = 'That helps put the silence in context'; ask('relationship-usual', 'Is this unusual for them?', ['yes', 'no', 'description'], 'usual'); break;
      case 'relationship-now': reaction = toneReaction(state, tone) || 'That helps me understand where things are now'; ask('relationship-need', 'What would be most helpful from the people around you?', ['description'], 'need'); break;
      case 'social-best': reaction = toneReaction(state, tone) || 'That gives me a better picture of the day'; ask('social-feeling', 'What was the best part for you?', ['description'], 'bestPart'); break;
      case 'social-feeling': reaction = 'That sounds like the part worth remembering'; ask('social-again', 'Would you want to do something like that again soon?', ['yes', 'no', 'description'], 'again'); break;
      case 'work-detail': reaction = toneReaction(state, tone) || 'That helps me follow what happened'; ask('work-next', 'Is that finished for today, or still hanging over you?', ['description', 'choice'], 'status'); break;
      case 'work-next': reaction = answer.kind === 'no' ? 'So there is still some of it waiting for you' : 'At least that part has a boundary around it'; ask('work-need', 'What would make the next part easier?', ['action', 'description'], 'helpful'); break;
      case 'other-situation': reaction = tone.target === 'self' ? toneReaction(state, tone) : 'That explains more of what is going on with them'; ask('other-update', 'How have they been handling it?', ['description'], 'coping'); break;
      case 'other-update': reaction = tone.target === 'self' ? toneReaction(state, tone) : 'That helps me understand their side of it'; ask('other-impact', 'How has this been affecting you?', ['description'], 'impact'); break;
      case 'other-impact': reaction = toneReaction(state, tone) || 'Your part of this matters too'; ask('other-next', 'What would you like to do for them, if anything?', ['action', 'description'], 'next'); break;
      case 'story-update': reaction = answer.kind === 'unknown' ? 'No clear update yet' : 'Thanks—that brings the story up to date'; ask('story-next', 'What do you think happens next?', ['description', 'action'], 'next'); break;
      default:
        reaction = toneReaction(state, tone) || (answer.kind === 'unknown' ? 'That is okay—you do not have to know yet' : 'That gives me a clearer picture');
        next = pick(state, 'typed-fallback', ['What happened next?', 'What stands out most about it now?', 'What would you like to happen from here?']);
        state.question = { id: 'detail-followup', text: next, intent: story.intent, story: story.id, subject: story.title, expects: ['description'], slot: 'update', askedTurn: turn };
    }
    return replyObject(state, story, story.intent, tone, [reaction, detail, next], 'answer', state.question);
  }

  function resolveSignal(state, raw, t, turn) {
    const story = current(state); if (!story) return null;
    let outcome = null;
    if (/^(?:it|that|everything|the .+) (?:went|turned out) (?:well|great|fine|okay)|^(?:it|that) worked out\b/.test(t)) outcome = 'positive';
    else if (/^(?:it|that|everything|the .+) (?:went|turned out) (?:badly|terribly|awful)|^(?:it|that) did not work out\b/.test(t)) outcome = 'negative';
    else if (/\b(?:it is|that's|that is) (?:resolved|sorted|over|finished|done)\b/.test(t)) outcome = 'resolved';
    if (!outcome) return null;
    story.status = 'resolved'; story.lastMention = turn; story.facts.outcome = fact(outcome, turn, raw); state.question = null;
    const reaction = outcome === 'positive' ? 'I’m glad that part went well' : outcome === 'negative' ? 'I’m sorry it turned out that way' : 'Got it—that part is settled now';
    return replyObject(state, story, story.intent, detectTone(raw, t), [reaction, 'What else has been happening with you?'], 'story-resolved');
  }

  function findReturn(state, t) {
    const request = t.match(/\b(?:back to|return to|revisit|pick up)\s+(.+)/); if (!request) return null;
    const hint = request[1].replace(/[.!?]+$/, '');
    const scored = state.stories.map(story => ({ story, score: norm(story.title).includes(hint) || hint.includes(norm(story.title)) ? 10 : Object.values(story.facts).filter(f => norm(f.value).includes(hint) || hint.includes(norm(f.value))).length * 3 + (hint.includes(story.intent.replace('_', ' ')) ? 4 : 0) })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    return scored[0]?.story || null;
  }
  function command(state, raw, t, turn) {
    const story = findReturn(state, t);
    if (story) {
      state.active = story.id; story.status = 'open';
      const q = setQuestion(state, story, 'story-update', 'What has changed with it since you last mentioned it?', ['description', 'outcome'], 'update', turn);
      return replyObject(state, story, story.intent, detectTone(raw, t), ['Earlier, you were talking about ' + story.title, q], 'story-return', state.question);
    }
    if (/\bwhat (?:were we|have we been) talking about|\bwhat stories do you remember\b/.test(t)) {
      const open = state.stories.filter(s => s.status === 'open').slice(-4);
      return { text: open.length ? 'The unfinished things I have are: ' + open.map(s => s.title).join(', ') + '. Which one do you want to pick up?' : 'I do not have an unfinished story recorded right now. What has been happening?', rule: 'conversation-story-list', suggestions: [], topic: 'general', intent: 'story-list', tone: detectTone(raw, t), story: null, question: null };
    }
    return null;
  }

  function recall(state, turn, raw = '') {
    if (turn - state.lastRecall < 7) return null;
    const candidates = state.stories.filter(story => story.recall && !story.sensitive && story.status === 'open' && turn - story.lastMention >= 5 && turn - story.lastAsked >= 10);
    const relevant = candidates.find(story => norm(raw).split(' ').some(word => word.length > 3 && norm(story.title).includes(word))) || candidates[0];
    if (!relevant) return null;
    state.active = relevant.id; state.lastRecall = turn;
    const prompts = {
      romance: 'You mentioned your crush earlier. How have things been there?',
      school_event: 'You mentioned ' + relevant.title + ' earlier. What has changed with it?',
      plan: 'You mentioned ' + quote(relevant.title) + ' earlier. Is that still the plan?',
      hobby: 'Have you done any more with ' + relevant.title + ' since you mentioned it?',
      conflict: 'Has anything changed with ' + relevant.title + ' since you mentioned it?',
      relationship_event: 'Has anything changed with ' + relevant.title + ' since you mentioned it?',
      social_event: 'You mentioned ' + relevant.title + ' earlier. Has anything else happened there?',
      work_event: 'How have things developed with ' + relevant.title + '?'
    };
    const text = prompts[relevant.intent] || 'You mentioned ' + relevant.title + ' earlier. What has changed with it?';
    setQuestion(state, relevant, 'story-update', text, ['description', 'outcome'], 'update', turn);
    return replyObject(state, relevant, relevant.intent, { emotion: null, valence: 'neutral', target: 'situation', explicit: false, confidence: 'low', evidence: '' }, [text], 'story-recall', state.question);
  }

  function everydayReply(state, story, raw, t, tone, turn, previous = null, answer = null) {
    const card = E.cards[story.intent];
    let reaction = '', slots = E.extract(raw, t, card.id);
    if (previous) {
      story.turns.push({ turn, text: clean(raw, 300) }); story.turns = story.turns.slice(-6); story.lastMention = turn;
      if (answer?.kind === 'unknown' || /^(?:skip|ask about another part|something else about this)[.!]*$/.test(t)) {
        story.skipped = [...new Set([...(story.skipped || []), previous.slot])].filter(Boolean).slice(-30);
        reaction = pick(state, 'everyday-uncertain', ['It is okay not to have an answer to that part.', 'We can approach it from another angle.', 'You do not need a neat answer to keep talking.', 'That part can stay uncertain for now.']);
      } else if (previous.slot) {
        const anotherAnswer = (slots.origin && previous.slot !== 'origin') || (slots.wish && previous.slot !== 'wish') || (slots.goal && !['goal','next','intention'].includes(previous.slot)) || (slots.company && previous.slot !== 'company' && /^(?:with |by myself|on my own)/.test(t));
        const misplacedEmotion = tone.explicit && tone.target === 'self' && !['feeling','impact','experience','reaction','mood','effect'].includes(previous.slot);
        if (!anotherAnswer && !misplacedEmotion && !Object.hasOwn(slots,previous.slot) && !['yes','no'].includes(answer?.kind)) slots[previous.slot] = clean(raw, 160);
        else if (['yes','no'].includes(answer?.kind)) {
          reaction = answer.kind === 'no' ? 'We can leave that possibility aside.' : 'I am not sure which part you mean yes to.';
          if (answer.kind === 'no') story.skipped = [...new Set([...(story.skipped || []), previous.slot])].slice(-30);
        }
        if (misplacedEmotion) slots.feeling = tone.evidence;
        if (!reaction && tone.explicit && tone.target === 'self') reaction = toneReaction(state, tone);
        if (!reaction && /\b(?:because|since)\b/.test(t)) reaction = pick(state, 'everyday-reason', ['That is the part behind it for you.', 'There is a reason that detail matters to you.', 'That gives some context to your reaction.']);
        if (!reaction && slots.origin) { const reflected = toYou(slots.origin); reaction = reflected[0].toUpperCase() + reflected.slice(1); }
        if (!reaction && raw) reaction = pick(state, 'everyday-detail', ['You mentioned ' + quote(raw) + '.', 'The detail that stands out in what you said is ' + quote(raw) + '.', 'Let us stay with ' + quote(raw) + ' for a moment.']);
      }
      mergeEntities(story, slots, turn, raw);
    } else reaction = tone.explicit && tone.target === 'self' ? toneReaction(state, tone) : pick(state, 'everyday-open-' + card.id, card.openings);
    if (!previous && card.id === 'money' && /\bsaving (?:up )?for\b/.test(story.turns.at(-1)?.text || '')) reaction = 'You have something you want to save for.';
    if (reaction.includes('?')) reaction = 'Let us talk about ' + card.label + '.';
    if (card.sensitive) { story.sensitive = true; story.recall = false; }
    const next = card.stages.find(s => !story.facts[s.slot] && !story.skipped?.includes(s.slot));
    let question;
    if (next) {
      const q = pick(state, 'everyday-q-' + card.id + '-' + next.slot, next.questions);
      question = setQuestion(state, story, 'everyday-' + card.id.replace(/_/g, '-') + '-' + next.slot, q, ['description','reason'], next.slot, turn);
    } else {
      const q = pick(state, 'everyday-deeper-' + card.id, [
        'Has anything changed in how you see ' + card.label + ' as we have talked?',
        'What part of ' + card.label + ' have I not asked about yet?',
        'What is the detail about ' + card.label + ' you most want me to understand?',
        'Is there another side of ' + card.label + ' you want to bring in?'
      ]);
      question = setQuestion(state, story, 'everyday-open', q, ['description'], null, turn);
    }
    return { ...replyObject(state, story, story.intent, tone, [reaction, question], previous ? 'everyday-answer' : 'everyday-open', state.question), suggestions: answer?.kind === 'unknown' ? ['Ask about another part', 'Let me explain it differently'] : [] };
  }
  function practical(state, raw, t, turn) {
    const story = current(state), card = story && E.cards[story.intent];
    if (!card) return null;
    state.deferred = null; state.question = null;
    const question = setQuestion(state, story, 'everyday-next', 'Which part of that could fit your situation?', ['description'], 'next', turn);
    return replyObject(state, story, story.intent, detectTone(raw, t), [card.practical, question], 'practical', state.question);
  }
  function supportive(state, raw, t, turn, quiet = false) {
    let story = current(state);
    const healthUncertainty = story?.intent === 'health_worry' && /^what if\b/.test(t);
    const kind = E.validationKind(t); if (!kind && !healthUncertainty) return null;
    if (healthUncertainty) {
      const q = quiet ? '' : setQuestion(state, story, 'validation-detail', 'What have you been told so far, and what is still unknown?', ['description'], null, turn);
      state.deferred = null;
      return { ...replyObject(state, story, story.intent, detectTone(raw,t), ['Wanting an answer is understandable. I cannot tell from chat whether that possibility is the cause or what the result will be', q], 'validation', state.question), validating: 'uncertainty' };
    }
    const match = scoreIntent(t);
    if (match && match.score >= 8 && !/^(?:am i|is it|what if|maybe)\b/.test(t)) { story = upsertStory(state, match.id, extract(raw,t,match.id),raw,turn); harvest(story,raw,t,turn); }
    const line = pick(state, 'validation-' + kind, E.validations[kind]);
    let evidence = '';
    const preparation = story?.facts.preparation || story?.facts.effort;
    if (kind === 'ability' && preparation) evidence = 'You described ' + quote(preparation.value) + '; the uncertainty does not erase that effort.';
    const questions = {
      disclosure: ['What is the part you have been wanting someone to hear?', 'What feels hardest to explain?'],
      feelings: ['What happened before you started doubting your reaction?', 'Is the doubt about the feeling itself or what you might do next?'],
      ability: ['Which part are you least sure you can handle?', 'What would make the next attempt feel more manageable?']
    };
    state.lastValidation = turn; state.deferred = null;
    const questionText = kind === 'feelings' && match && match.score >= 8 ? 'Which part of what happened has you doubting your reaction?' : pick(state, 'validation-q-' + kind, questions[kind]);
    const q = quiet ? '' : setQuestion(state, story, 'validation-detail', questionText, ['description','reason'], null, turn);
    if (quiet) state.question = null;
    return { ...replyObject(state, story, story?.intent || null, detectTone(raw, t), [line, evidence, q], 'validation', state.question), validating: kind };
  }
  function redirect(state, raw, t, turn, information = false) {
    const story = current(state), detail = clean(raw, 140).replace(/[.!?]+$/, '');
    const failures = (state.recovery?.turn >= turn - 2 ? state.recovery.failures : 0) + 1;
    state.recovery = { kind: information ? 'information' : 'unclear', turn, failures: Math.min(5, failures), anchor: detail };
    state.question = null; state.deferred = null;
    let line, question, suggestions = [];
    if (information) {
      line = pick(state, 'redirect-information', ['I do not have a reliable answer to that here.', 'I cannot verify that answer from this offline chat.', 'I would be guessing if I gave you a factual answer to that.']);
      const anchor = Object.values(E.cards).find(c => c.anchors.some(word => new RegExp('\\b' + word + '\\b').test(t)));
      question = anchor ? 'What part of ' + anchor.label + ' got you interested in that question?' : 'What are you hoping to understand or do with that information?';
    } else if (failures >= 2) {
      line = pick(state, 'recovery-repeat', ['I am still missing the connection, and I do not want to keep making you rephrase the same thing.', 'That wording is outside the patterns I can follow well.', 'I have not understood this well enough to give a useful reply yet.']);
      question = pick(state, 'recovery-next', ['Could you give one concrete example, or pick a starting point below?', 'Is there a simpler starting point we could use?', 'What is the one part you most want to get across?']);
      suggestions = ['My day', 'Friends', 'Music', 'Games'];
    } else {
      line = detail.length > 8 ? 'I picked up ' + quote(detail) + ', but I am not sure what it means in this situation.' : 'I am not sure what you mean by ' + quote(detail) + '.';
      question = story ? 'How does that connect with ' + story.title + '?' : 'What happened, or what part would you like me to understand?';
    }
    setQuestion(state, story, 'recovery-detail', question, ['description'], null, turn);
    return { ...replyObject(state, story, story?.intent || null, detectTone(raw, t), [line, question], 'redirect', state.question), suggestions, limitation: information ? 'information' : 'meaning' };
  }
  function selectTopic(state, raw, t, turn) {
    const explicit = /^(?:let us |let's |can we )?(?:talk|chat) about\s+(.+?)[.!?]*$/.exec(t);
    const value = (explicit?.[1] || t).replace(/[.!?]+$/, '');
    if (!explicit && state.question && !['recovery-detail','validation-detail'].includes(state.question.id)) return null;
    const aliases = { 'my day':'daily_life', 'family':'family_life', 'friends':'belonging', 'music':'music', 'games':'games', 'movies':'screen_stories', 'books':'reading', 'food':'food', 'sports':'sports', 'pets':'pets', 'travel':'travel', 'the news':'news', 'my future':'career' };
    const id = Object.hasOwn(aliases, value) ? aliases[value] : null;
    if (!id) return null;
    state.recovery = null; state.question = null;
    const story = upsertStory(state, id, {}, raw, turn);
    return everydayReply(state, story, '', '', detectTone(raw), turn);
  }
  function defer(state, kind, question, turn) {
    if (question && !['reflection', 'open-detail', 'repair-detail'].includes(question.id)) state.deferred = { ...question };
    const story = current(state);
    state.question = { id: kind, text: '', intent: story?.intent || 'general', story: story?.id || null, subject: story?.title || null, expects: ['description', 'yes', 'no', 'reason'], slot: null, askedTurn: turn };
  }
  function correct(state, raw, t, turn) {
    const words = Object.values(toneWords).flat().join('|');
    const denied = t.match(new RegExp('\\bnot (?:really )?(' + words + ')\\b'))?.[1];
    if (!denied || /\b(?:he|she|they|my \w+) (?:is|feels|seems)\b/.test(t)) return null;
    const remainder = t.replace(new RegExp('\\bnot (?:really )?' + denied + '\\b'), '');
    const replacement = remainder.match(new RegExp('(?:^|\\bi (?:am|feel)|\\bi meant|\\bbut|[,;])\\s*(?:actually |just |really )?(' + words + ')\\b'))?.[1];
    // Negation alone is handled by the existing repair flow.
    if (!replacement) return null;
    const tone = detectTone('I am ' + replacement), story = current(state);
    if (story) story.facts.feeling = fact(replacement, turn, raw);
    state.corrections.push({ story: story?.id || null, field: 'feeling', value: replacement, rejected: denied, turn }); state.corrections = state.corrections.slice(-16);
    state.lastTone = tone; state.question = null; state.deferred = null;
    return { ...replyObject(state, story, story?.intent || null, tone, ['Thanks for correcting that: ' + replacement + ', not ' + denied, 'I will use your wording for this part of the conversation'], 'correction'), correction: { field: 'emotion', value: replacement, rejected: denied } };
  }
  function ambiguousLike(raw, t) {
    if (/\b(?:crush|romantic|attracted|feelings for|as a friend|like a friend|fancy)\b/.test(t)) return null;
    const m = t.match(/\bi (?:really |kind of |sort of )?like\s+((?:(?:this |that |a |the )?(?:girl|boy|guy|woman|man|someone|person)|her|him|them)\b[^.!?,;]{0,70})/) || raw.match(/\b[Ii] (?:really |kind of |sort of )?like\s+([A-Z][a-z]{1,30})\b/);
    return m ? clean(m[1], 90) : null;
  }
  function clarificationReply(state, raw, t, turn) {
    const c = state.clarification; if (!c) return null;
    if (turn - c.turn > 3) { state.clarification = null; return null; }
    if (c.kind === 'romance') {
      const romantic = /\b(?:crush|romantic|attracted|feelings for)\b/.test(t) && !/\b(?:not|no)\b/.test(t);
      const friendly = /\b(?:friend|platonic)\b/.test(t) || /\bnot (?:a crush|romantic)/.test(t);
      const uncertain = UNKNOWN.test(t) || /^(?:i am |i'm )?not sure[.!]*$/.test(t);
      if (!romantic && !friendly && !uncertain) {
        if (scoreIntent(t)) { state.clarification = null; return null; }
        return { text: 'I have not got the distinction yet. Is this a crush, friendship, or are you still figuring it out?', rule: 'conversation-clarification', suggestions: ['A crush', 'As a friend', "I'm not sure"] };
      }
      state.clarification = null;
      if (romantic) {
        const entities = extract(c.raw, norm(c.raw), 'romance');
        const story = upsertStory(state, 'romance', entities, c.raw, turn); harvest(story, c.raw, norm(c.raw), turn);
        story.facts.relationshipType = fact('romantic', turn, raw);
        return initialReply(state, story, 'romance', entities, detectTone(c.raw), turn);
      }
      const story = upsertStory(state, 'personal_update', { person: c.person, relationshipType: friendly ? 'friendship' : 'uncertain' }, c.raw, turn);
      story.topic = 'relationships';
      story.title = friendly ? 'your friendship with ' + c.person : 'your feelings about ' + c.person;
      const q = setQuestion(state, story, 'friendship-detail', friendly ? 'What do you enjoy about spending time with them?' : 'What is it like when you are around them?', ['description'], 'connection', turn);
      return replyObject(state, story, 'personal_update', detectTone(raw), [friendly ? 'You mean liking them as a friend' : 'You do not have to settle on a label', q], 'clarified', state.question);
    }
    if (c.kind === 'sarcasm') {
      if (!/\b(?:sincer|sarcas|literal|joking)\w*\b/.test(t)) { state.clarification = null; return null; }
      state.clarification = null;
      return replyObject(state, current(state), null, detectTone(raw), [/\b(?:sarcas|joking)/.test(t) ? 'You meant that sarcastically' : 'You meant it sincerely', 'What happened?'], 'clarified');
    }
    return null;
  }
  function handle(state, raw, normalized, options = {}) {
    const t = normalized || norm(raw), turn = options.turn || 0;
    const topicChoice = selectTopic(state, raw, t, turn); if (topicChoice) return topicChoice;
    if (E.requestKind(t) === 'information') return redirect(state, raw, t, turn, true);
    if (E.requestKind(t) === 'advice') { const help = practical(state, raw, t, turn); if (help) return help; }
    const clarified = clarificationReply(state, raw, t, turn); if (clarified) return clarified;
    const validation = supportive(state, raw, t, turn); if (validation) return validation;
    if (['recovery-detail','validation-detail'].includes(state.question?.id)) {
      const oldQuestion = state.question; state.question = null;
      if (oldQuestion.id === 'recovery-detail' && !scoreIntent(t) && !detectTone(raw,t).explicit) {
        const related = E.relatedTopic(t);
        if (related) { const story = upsertStory(state,related,E.extract(raw,t,related),raw,turn); state.recovery = null; return everydayReply(state,story,'','',detectTone(raw,t),turn); }
        return redirect(state, raw, t, turn);
      }
      if (oldQuestion.id === 'validation-detail' && (!scoreIntent(t) || scoreIntent(t).score < 8) && !detectTone(raw,t).explicit) {
        const story = current(state);
        if (story && Object.hasOwn(E.cards, story.intent)) return everydayReply(state, story, raw, t, detectTone(raw,t), turn, { id:'everyday-validation',slot:'context' }, classifyAnswer(raw,t,{expects:['description']}));
        return replyObject(state, story, story?.intent || null, detectTone(raw,t), ['You are trying to explain ' + quote(raw), 'What feels most important for me to understand about that?'], 'heard');
      }
    }
    const clauses = clean(raw, 4000).split(/(?:[.!;]+\s+|\s+(?:but|and|also|however)\s+(?=(?:I\b|I'm\b|my\b|we\b|he\b|she\b|they\b)))/i).map(x => x.replace(/^(?:but|also|however|and)\s+/i, '').trim()).filter(x => x.length > 7).slice(0, 6);
    const scored = clauses.map((text, index) => { const tone = detectTone(text); const match = scoreIntent(norm(text)); return { text, index, match, tone, priority: (/\b(?:most|mainly|right now|what bothers me|need help)\b/i.test(text) ? 20 : 0) + (tone.target === 'self' && tone.valence === 'negative' ? 12 : 0) + (match && ['conflict','setback','relationship_event'].includes(match.id) ? 8 : 0) + (match ? 3 : 0) }; });
    const distinct = new Set(scored.map(c => c.match?.id).filter(Boolean));
    const multi = clauses.length > 1 && (distinct.size > 1 || scored.some(c => c.tone.explicit && !c.match) && distinct.size > 0);
    if (!multi) return handleOne(state, raw, t, options);
    scored.sort((a, b) => b.priority - a.priority || a.index - b.index);
    const main = scored[0], others = scored.filter(x => x !== main);
    // Keep separately stated events as separate records; do not infer that
    // one caused another simply because they share a message.
    for (const item of others) if (item.match) { const story = upsertStory(state, item.match.id, extract(item.text, norm(item.text), item.match.id), item.text, turn); harvest(story, item.text, norm(item.text), turn); }
    state.question = null;
    const result = handleOne(state, main.text, norm(main.text), { ...options, noReflection: true });
    if (!result) return handleOne(state, raw, t, options);
    const acknowledgement = others.slice(0, 2).map(x => 'You also mentioned ' + quote(x.text)).join('. ') + '.';
    return { ...result, text: acknowledgement + ' ' + result.text, multi: true, thoughts: scored.map(x => ({ text: x.text, primary: x === main })) };
  }
  function handleOne(state, raw, normalized, { turn = 0, effort = '' } = {}) {
    const t = normalized || norm(raw), tone = detectTone(raw, t);
    if (/\b(?:died|passed away|estranged|abusive|no contact)\b/.test(t)) {
      const active = current(state);
      if (active) { active.sensitive = true; active.recall = false; state.question = null; }
      return null;
    }
    const direct = command(state, raw, t, turn); if (direct) return direct;
    const resolved = resolveSignal(state, raw, t, turn); if (resolved) return resolved;
    if ((QUIET.test(t) || GREETING.test(t)) && state.stories.length) { const remembered = recall(state, turn, raw); if (remembered) return remembered; }
    const activeStory = current(state);
    if (activeStory && tone.target === 'self' && tone.explicit && tone.emotion) activeStory.facts.feeling = fact(tone.evidence, turn, raw);
    const ambiguous = ambiguousLike(raw, t);
    const established = activeStory?.facts.relationshipType && (!ambiguous || /^(?:her|him|them)$/.test(ambiguous) || norm(valueOf(activeStory.facts.person)) === norm(ambiguous));
    if (ambiguous && !established && activeStory?.intent !== 'romance') {
      state.clarification = { kind: 'romance', raw: clean(raw, 500), person: ambiguous, turn }; state.question = null;
      return { text: 'When you say you like ' + ambiguous + ', do you mean a crush, liking them as a friend, or something you are still figuring out?', rule: 'conversation-clarification', suggestions: ['A crush', 'As a friend', "I'm not sure"], topic: 'relationships', tone };
    }
    if (activeStory?.intent === 'romance' && /\b(?:i do not|i don't|not) (?:really )?(?:like|fancy|have feelings for|feel attracted to).{0,25}\b(?:her|him|them|romantically)\b|\bnot (?:a crush|romantically into)\b/.test(t)) {
      activeStory.intent = 'personal_update'; activeStory.title = 'your connection with them'; activeStory.facts.relationshipType = fact(/\bfriend/.test(t) ? 'friendship' : 'not romantic', turn, raw); state.question = null; state.deferred = null;
      return replyObject(state, activeStory, 'personal_update', tone, ['Got it—I read romance into that when I should not have', 'How would you describe what you feel instead?'], 'intent-correction');
    }
    if (activeStory?.intent === 'romance' && /\b(?:does (?:she|he)|do they) (?:like|fancy) me|\b(?:likes|like) me back|\bhow (?:can i|do i) (?:tell|know)\b/.test(t)) {
      const questionText = setQuestion(state, activeStory, 'romance-signals', 'What have they actually said or done around you?', ['description'], 'signals', turn);
      return replyObject(state, activeStory, 'romance', tone, ['It is hard to know their feelings from hints alone', questionText], 'romance-signals', state.question);
    }
    let match = scoreIntent(t);
    if (established && valueOf(activeStory.facts.relationshipType) !== 'romantic' && !/\b(?:crush|romantic|attracted|feelings for)\b/.test(t) && match?.id === 'romance') match = null;
    const question = state.question;
    const newOther = otherSubject(raw, t, state);
    const changedOther = newOther && !newOther.pronoun && !norm(activeStory?.title || '').includes(norm(newOther.person).replace(/^my /, ''));
    if (question && ['reflection','open-detail','repair-detail'].includes(question.id) && (!match || match.id === activeStory?.intent) && !changedOther && !QUIET.test(t) && !GREETING.test(t)) {
      harvest(activeStory, raw, t, turn);
      state.question = null;
      if (question.id === 'reflection' && NO.test(t)) {
        state.deferred = null;
        setQuestion(state, activeStory, 'repair-detail', 'What would you change about how I put that?', ['description'], null, turn);
        return replyObject(state, activeStory, activeStory?.intent || null, tone, [state.question.text], 'reflection-repair', state.question);
      }
      const deferred = state.deferred; state.deferred = null;
      if (deferred) {
        if (!YES.test(t) && !NO.test(t) && fitsQuestion(raw, t, deferred, tone) && activeStory) return answerReply(state, deferred, classifyAnswer(raw, t, deferred), raw, t, tone, turn);
        if (tone.target === 'self' && tone.explicit && activeStory) return answerReply(state, deferred, classifyAnswer(raw, t, deferred), raw, t, tone, turn);
        if (activeStory?.facts.goal?.turn === turn && deferred.slot === 'conversation') return answerReply(state, deferred, classifyAnswer(raw, t, deferred), raw, t, tone, turn);
        const q = setQuestion(state, activeStory, deferred.id, deferred.text, deferred.expects, deferred.slot, turn);
        return replyObject(state, activeStory, activeStory?.intent || null, tone, [q], 'continue', state.question);
      }
      if (question.id === 'repair-detail') return replyObject(state, activeStory, activeStory?.intent || null, tone, ['You meant ' + quote(raw), 'Tell me more in your own words'], 'reflection-corrected');
      return replyObject(state, activeStory, activeStory?.intent || null, tone, ['Could you say a little more about that?'], 'continue');
    }
    if (question) {
      const matchedEntities = match ? extract(raw, t, match.id) : {};
      const mentionedOther = otherSubject(raw, t, state);
      const questionStory = state.stories.find(item => item.id === question.story);
      const explicitOtherChange = mentionedOther && !mentionedOther.pronoun && question.intent !== 'personal_update' && !norm(questionStory?.title || '').includes(norm(mentionedOther.person).replace(/^my /, ''));
      const explicitNewStory = match && match.id === question.intent && /\b(?:another|also|separately|different|new plan|speaking of)\b/.test(t) && match.score >= 8;
      const interrupt = explicitOtherChange || explicitNewStory || match && match.id !== question.intent && baseIntent(match.id, matchedEntities) !== question.intent && match.score >= 8;
      const correction = match && baseIntent(match.id, matchedEntities) === question.intent && /\b(?:actually|i meant|correction|rather)\b/.test(t);
      if (correction) {
        const story = state.stories.find(item => item.id === question.story) || current(state);
        if (story) { mergeEntities(story, matchedEntities, turn, raw); state.question = null; return initialReply(state, story, match.id, matchedEntities, tone, turn); }
      }
      if (!interrupt && !changedOther && !QUIET.test(t) && !GREETING.test(t) && !/\b(?:do you .*care|have feelings|reassure me|tell me everything will|everyone hates me|i am worthless)\b/.test(t)) {
        const answer = classifyAnswer(raw, t, question);
        const reply = answerReply(state, question, answer, raw, t, tone, turn);
        if (reply) return reply;
      } else if (interrupt) state.question = null;
    }
    if (!match && tone.explicit) {
      if (tone.target === 'other') {
        const subjectMatch = t.match(/\b(my (?:friend|partner|boyfriend|girlfriend|brother|sister|mom|mum|dad|mother|father|coworker|colleague)|he|she|they) (?:is|feels|seems|has been)\b/);
        const person = subjectMatch?.[1] || 'they'; state.focus = { person, turn };
        const story = upsertStory(state, 'personal_update', { person }, raw, turn);
        const q = setQuestion(state, story, 'other-situation', 'What has been going on with ' + (person.startsWith('my ') ? person.replace(/^my /, 'your ') : 'them') + '?', ['description'], 'situation', turn);
        return replyObject(state, story, 'personal_update', tone, ['It sounds like ' + (person.startsWith('my ') ? person.replace(/^my /, 'your ') : person) + ' is ' + tone.evidence, q], 'other-tone', state.question);
      }
      const story = activeStory || (state.focus ? findStory(state, 'personal_update', { person: state.focus.person }) : null);
      const subject = state.focus?.person && /\b(?:him|her|them)\b/.test(t) ? state.focus.person.replace(/^my /, 'your ') : '';
      const q = story ? setQuestion(state, story, 'other-impact', subject ? 'What is happening with ' + subject + ' right now?' : 'What happened that brought this up?', ['description'], 'impact', turn) : null;
      return replyObject(state, story, story?.intent || 'personal_update', tone, [toneReaction(state, tone), q || 'What happened that brought this up?'], 'self-tone', state.question);
    }
    if (!match) {
      const mentioned = otherSubject(raw, t, state);
      if (mentioned) {
        const person = mentioned.person; state.focus = { person, turn };
        const story = upsertStory(state, 'personal_update', { person }, raw, turn);
        const q = setQuestion(state, story, 'other-update', 'How are they taking it?', ['description'], 'coping', turn);
        return replyObject(state, story, 'personal_update', tone, ['You are talking about ' + (person.startsWith('my ') ? person.replace(/^my /, 'your ') : 'them'), q], 'other-update', state.question);
      }
    }
    if (!match && tone.evidence === 'possible sarcasm') { state.clarification = { kind: 'sarcasm', raw: clean(raw, 500), person: '', turn }; state.question = null; return { text: 'I may be reading the tone wrong—did you mean that sincerely or sarcastically?', rule: 'conversation-tone-clarification', suggestions: ['Sincerely', 'Sarcastically'], topic: current(state)?.topic || 'general', intent: null, tone, story: current(state)?.id || null, question: null }; }
    if (!match) return null;
    state.recovery = null;
    const entities = extract(raw, t, match.id); if (effort) entities.effort = clean(effort, 140);
    const story = upsertStory(state, match.id, entities, raw, turn);
    harvest(story, raw, t, turn);
    return initialReply(state, story, match.id, entities, tone, turn);
  }

  function stories(state) {
    return state.stories.map(story => ({ id: story.id, title: story.title, intent: story.intent, topic: story.topic, status: story.status, lastMention: story.lastMention, recall: story.recall, sensitive: story.sensitive, details: Object.entries(story.facts).map(([key, item]) => ({ key, value: item.value })) }));
  }
  function resolveStory(state, id) { const story = state.stories.find(s => s.id === id); if (story) { story.status = 'resolved'; if (state.active === id) state.active = null; if (state.question?.story === id) state.question = null; return true; } return false; }
  function forgetStory(state, id) { const before = state.stories.length; state.stories = state.stories.filter(s => s.id !== id); if (state.active === id) state.active = null; if (state.question?.story === id) state.question = null; return state.stories.length < before; }

  function restore(data) {
    const state = fresh(); if (!data || data.version !== 1 || typeof data !== 'object') return state;
    const number = value => Number.isSafeInteger(value) ? Math.max(-20, Math.min(1000000, value)) : 0;
    const validIntent = value => Object.hasOwn(INTENTS, value);
    if (Array.isArray(data.stories)) for (const input of data.stories.slice(-8)) {
      if (!input || !/^story-\d{1,7}$/.test(input.id) || !validIntent(input.intent) || state.stories.some(s => s.id === input.id)) continue;
      const story = { id: input.id, intent: input.intent, topic: ['general','school','work','relationships','joy'].includes(input.topic) ? input.topic : INTENTS[input.intent].topic, title: clean(input.title, 160) || INTENTS[input.intent].label, status: ['open','resolved'].includes(input.status) ? input.status : 'open', first: number(input.first), lastMention: number(input.lastMention), lastAsked: number(input.lastAsked), recall: input.recall !== false, sensitive: input.sensitive === true, facts: {}, turns: [], acknowledged: [] };
      if (input.facts && typeof input.facts === 'object') for (const [key, item] of Object.entries(input.facts).slice(0, 40)) if (/^[a-zA-Z]{1,24}$/.test(key) && !['constructor','prototype','__proto__'].includes(key) && item && typeof item.value === 'string') story.facts[key] = fact(item.value, number(item.turn), item.source);
      story.skipped = Array.isArray(input.skipped) ? input.skipped.filter(x => typeof x === 'string' && /^[a-zA-Z]{1,24}$/.test(x)).slice(-30) : [];
      if (Object.hasOwn(E.cards,input.intent) && E.cards[input.intent].sensitive) { story.sensitive = true; story.recall = false; }
      if (Array.isArray(input.turns)) story.turns = input.turns.slice(-6).filter(x => x && typeof x.text === 'string').map(x => ({ turn: number(x.turn), text: clean(x.text, 300) }));
      if (Array.isArray(input.acknowledged)) story.acknowledged = input.acknowledged.filter(x => typeof x === 'string').slice(-20).map(x => clean(x, 50));
      state.stories.push(story);
    }
    state.serial = Math.max(number(data.serial), ...state.stories.map(s => Number(s.id.slice(6))), 0);
    state.active = state.stories.some(s => s.id === data.active) ? data.active : null;
    state.used = Array.isArray(data.used) ? data.used.filter(x => typeof x === 'string').slice(-80).map(x => clean(x, 80)) : [];
    state.lastRecall = number(data.lastRecall);
    const restoreQuestion = q => {
      if (!q || typeof q !== 'object' || !/^[-a-z]{1,45}$/.test(q.id) || !Array.isArray(q.expects)) return null;
      const story = state.stories.find(s => s.id === q.story);
      if (!story && !['reflection','open-detail','repair-detail','recovery-detail','validation-detail'].includes(q.id)) return null;
      return { id: q.id, text: clean(q.text, 300), intent: validIntent(q.intent) ? q.intent : story?.intent || 'general', story: story?.id || null, subject: clean(q.subject, 160) || null, expects: q.expects.filter(x => ['description','yes','no','frequency','time','action','reason','person','place','choice','outcome'].includes(x)).slice(0, 5), slot: /^[a-zA-Z]{1,24}$/.test(q.slot) && !['constructor','prototype','__proto__'].includes(q.slot) ? q.slot : null, askedTurn: number(q.askedTurn) };
    };
    state.question = restoreQuestion(data.question); state.deferred = restoreQuestion(data.deferred);
    if (data.clarification && ['romance','sarcasm'].includes(data.clarification.kind)) state.clarification = { kind: data.clarification.kind, raw: clean(data.clarification.raw, 500), person: clean(data.clarification.person, 90), turn: number(data.clarification.turn) };
    state.corrections = Array.isArray(data.corrections) ? data.corrections.filter(c => c && c.field === 'feeling' && Object.values(toneWords).flat().includes(c.value)).slice(-16).map(c => ({ story: state.stories.some(s => s.id === c.story) ? c.story : null, field: 'feeling', value: c.value, rejected: clean(c.rejected, 40), turn: number(c.turn) })) : [];
    state.lastIntent = validIntent(data.lastIntent) ? data.lastIntent : null;
    if (data.recovery && ['information','unclear'].includes(data.recovery.kind)) state.recovery = { kind: data.recovery.kind, turn: number(data.recovery.turn), failures: Math.max(0,Math.min(5,number(data.recovery.failures))), anchor: clean(data.recovery.anchor,140) };
    state.lastValidation = number(data.lastValidation);
    if (data.focus && typeof data.focus.person === 'string') state.focus = { person: clean(data.focus.person, 70), turn: number(data.focus.turn) };
    state.lastTone = data.lastTone && typeof data.lastTone === 'object' ? { emotion: Object.hasOwn(toneWords, data.lastTone.emotion) ? data.lastTone.emotion : null, valence: ['positive','negative','neutral'].includes(data.lastTone.valence) ? data.lastTone.valence : 'neutral', target: ['self','other','situation'].includes(data.lastTone.target) ? data.lastTone.target : 'situation', explicit: data.lastTone.explicit === true, confidence: ['high','medium','low'].includes(data.lastTone.confidence) ? data.lastTone.confidence : 'low', evidence: clean(data.lastTone.evidence, 80) } : null;
    return state;
  }

  return { INTENTS, fresh, scoreIntent, detectTone, extract, handle, recall, command, stories, resolveStory, forgetStory, restore, compose, classifyAnswer, defer, correct, harvest, ambiguousLike, supportive, practical, redirect };
});
