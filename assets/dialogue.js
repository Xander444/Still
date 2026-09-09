/* Structured, bounded conversation memory. Every stored detail has a source.
   Interpretations stay separate from explicit statements and can be rejected. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./content.js'));
  else root.StillDialogue = factory(root.StillContent);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  const cap = (value, n = 240) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const quote = s => '“' + cap(s, 170).replace(/[“”]/g, '"') + '”';
  const toYou = s => s.replace(/\bmyself\b/gi, 'yourself').replace(/\bmy\b/gi, 'your').replace(/\bmine\b/gi, 'yours').replace(/\bme\b/gi, 'you');
  const own = (o, k) => o && Object.hasOwn(o, k);
  const ROLES = ['event', 'explanation', 'answer', 'correction', 'request', 'feeling', 'reflection'];
  const FIELDS = ['event', 'person', 'emotion', 'effort', 'expectation', 'outcome', 'cause', 'need', 'goal', 'thought', 'concern', 'meaning', 'control', 'support', 'obstacle', 'pattern', 'kind', 'memory', 'wish', 'boundary', 'fair', 'firstStep', 'credit', 'trigger', 'impact'];
  const ACTIONS = ['effort', 'help', 'boundary', 'rest', 'repair', 'care'];
  const QUESTION_FIELDS = {
    'school-pressure': ['concern'], 'school-meaning': ['meaning'], 'school-control': ['control'], 'school-support': ['support'], 'school-fair': ['fair'], 'school-perspective': ['fair'],
    'work-load': ['concern'], 'work-expectations': ['expectation'], 'work-boundary': ['boundary'], 'work-support': ['support'], 'work-enough': ['fair'],
    'rel-hurt': ['impact'], 'rel-need': ['need'], 'rel-known': ['thought'], 'rel-say': ['wish'], 'rel-change': ['goal'], 'rel-pattern': ['pattern'],
    'family-understand': ['wish'], 'family-expect': ['expectation'], 'family-safe': ['pattern'], 'family-role': ['kind'], 'family-need': ['need'],
    'self-trigger': ['trigger', 'event'], 'self-voice': ['expectation'], 'self-specific': ['event'], 'self-fair': ['fair'], 'self-friend': ['fair'],
    'lonely-kind': ['kind'], 'lonely-moment': ['trigger'], 'lonely-miss': ['need'], 'lonely-person': ['support'], 'lonely-ease': ['obstacle'],
    'loss-now': ['concern'], 'loss-memory': ['memory'], 'loss-understand': ['wish'], 'loss-day': ['impact'], 'loss-company': ['support'],
    'rest-load': ['kind'], 'rest-demand': ['cause'], 'rest-less': ['control'], 'rest-need': ['need'], 'rest-help': ['support'],
    'worry-prediction': ['concern'], 'worry-known': ['event'], 'worry-control': ['control'], 'worry-help': ['support'], 'worry-cost': ['impact'],
    'stuck-obstacle': ['obstacle'], 'stuck-cost': ['concern'], 'stuck-want': ['goal'], 'stuck-small': ['firstStep'], 'stuck-information': ['need'],
    'joy-meaning': ['meaning'], 'joy-credit': ['credit', 'effort'], 'joy-share': ['support'], 'joy-remember': ['memory'], 'joy-next': ['firstStep'],
    'general-now': ['concern'], 'general-need': ['goal'], 'general-understand': ['wish'], 'general-moment': ['trigger', 'event'], 'general-space': ['thought'], 'general-next': ['firstStep']
  };
  function fresh() {
    return { version: 2, preferences: { questions: 'balanced', brevity: 'normal', exercises: true, encouragement: true }, frames: [], threads: [], active: null, serial: 0, substantive: 0, questionStreak: 0, lastKindTurn: -10, kindCount: 0, kindUsed: [], lastLoopTurn: -10, lastReturnOffer: -10, lastSummaryTurn: -10, hypothesis: null, lastMove: null, pendingRepair: null, pendingThread: null };
  }
  function current(d) { return d.threads.find(t => t.id === d.active) || null; }
  function evidence(text, turn, code = '') { return { text: cap(text), turn, code: cap(code, 35), source: 'explicit' }; }
  const unusable = t => /^(?:yes|yeah|no|nope|okay|ok|maybe|i do not know|not sure|i am not sure|thanks|thank you|wrap up|just listen)[.! ]*$/.test(t);
  function analyze(raw, t, { turn = 0, emotion = null, previous = null } = {}) {
    const f = { turn, input: cap(raw, 600), intent: 'reflection', roles: [], fields: {}, actions: [], entities: [], uncertain: [], newDetails: [], loop: false };
    const add = (key, text, code) => { if (cap(text)) f.fields[key] = evidence(text, turn, code); };
    const entities = [...raw.matchAll(/\bmy (?:friend|sister|brother|mother|father|mom|mum|dad|partner|boyfriend|girlfriend|husband|wife|teacher|boss|coworker)\b/gi)];
    f.entities = [...new Set(entities.map(m => {
      const name = raw.slice(m.index + m[0].length).match(/^\s+([A-Z][a-z]{1,30})\b/);
      const suffix = name && !/^(?:Is|Was|Has|Had|Said|And|But|Did|Does|Just|Told|Feels|Ignored)$/.test(name[1]) ? ' ' + name[1] : '';
      return cap(m[0].replace(/^My /, 'my ') + suffix, 70);
    }))].slice(0, 4);
    if (f.entities.length === 1) add('person', f.entities[0]);
    const personal = !/\b(?:he|she|they|my (?:friend|brother|sister|mom|dad)) (?:said|says|told me)\b.{0,20}["“]/i.test(raw);
    const hypothetical = /\b(?:if i|imagine i|suppose i|what if i)\b/.test(t);
    const clause = text => cap(text.split(/\b(?:but|even though|although|because|yet|and then)\b|[.!?;]/i)[0]);
    if (emotion) {
      const words = [...t.matchAll(/\bi (?:am|feel|am feeling)\s+(?:really |very |actually )?(sad|angry|frustrated|disappointed|hurt|lonely|anxious|worried|scared|relieved|happy|guilty|overwhelmed|numb|embarrassed)\b/g)];
      add('emotion', words.at(-1)?.[1] || emotion, emotion);
    }
    const changedFeeling = t.match(/\bi (?:feel|am feeling)\s+((?:a little |a bit |slightly |much )?(?:better|worse|calmer|lighter|more settled|more confused))\b/);
    if (changedFeeling && personal) add('emotion', changedFeeling[1], 'change');
    const effort = t.match(/\bi (?:have |had |really |finally )*(studied|worked|practiced|practised|prepared|revised|tried)\b([^.!?;]{0,150})/);
    if (effort && personal && !hypothetical) {
      const detail = clause(effort[1] + effort[2]).replace(/\s+and (?:i )?(?:failed|passed|won|lost|still).*$/, '');
      add('effort', detail, 'effort'); f.actions.push({ type: 'effort', text: detail, turn });
    }
    const expectation = t.match(/\bi (?:had |have )?(?:expected|hoped|was hoping|thought i would)\s+([^.!?;]{2,150})/);
    if (expectation && personal) add('expectation', clause(expectation[1]));
    const familyExpectation = t.match(/\bmy (?:parents|mom|dad|mother|father|family|teacher|boss) (?:expect|expects|want|wants)\s+([^.!?;]{2,150})/);
    if (familyExpectation) add('expectation', clause(familyExpectation[0]), 'external');
    const need = t.match(/\bi (?:just |really |only )*(?:need|needed|want|wanted)\s+((?:some |a little |to be |them to |her to |him to )?(?:reassurance|respect|heard|understood|listened to|listen|hear me|understand|space|time|support|company|a break|rest|connection|help)[^.!?;]{0,90})/);
    if (need && personal) add('need', clause(need[1]));
    const cause = t.match(/\bbecause\s+([^.!?;]{3,180})/);
    if (cause) add('cause', clause(cause[1]));
    const thought = t.match(/\bi (?:think|keep thinking|believe|am telling myself)\s+([^.!?;]{3,150})/);
    if (thought && personal) add('thought', clause(thought[1]));
    if (!thought && /\b(?:everyone hates me|nobody likes me|no one cares|i am worthless|i am a failure)\b/.test(t)) add('thought', clause(t), 'claim');
    const concern = t.match(/\bi (?:am |feel )?(?:worried|afraid|scared|nervous) (?:about |that |of )?([^.!?;]{2,150})/);
    if (concern && personal) add('concern', clause(concern[1]));
    const meaning = t.match(/\b(?:it (?:would )?means? |afraid (?:that )?)(?:i am |i will be |i would be )?((?:not (?:good enough|capable)|a failure|letting .{1,50} down|disappointing .{1,50}|losing .{1,50})[^.!?;]{0,60})/);
    if (meaning) add('meaning', clause(meaning[1]));
    if (/\b(?:let(?:ting)? (?:my )?(?:parents|mom|dad|family|teacher|everyone) down|disappoint(?:ing)? (?:my )?(?:parents|mom|dad|family))\b/.test(t)) add('meaning', clause(t));
    const goal = t.match(/\bi (?:want to|would like to|hope to)\s+([^.!?;]{2,150})/);
    if (goal && !/\b(?:die|hurt|harm|kill|disappear)\b/.test(t)) add('goal', clause(goal[1]));
    const eventPatterns = [
      ['failure', /\bi (?:still |just |also )*(?:failed|did not pass|got a bad grade|did badly)\b[^.!?;]{0,100}/],
      ['success', /\bi (?:finally |just |actually )*(?:passed|won|succeeded|got (?:the job|accepted|a promotion))\b[^.!?;]{0,100}/],
      ['breakup', /\b(?:my (?:partner|boyfriend|girlfriend)|he|she|they) (?:just )?(?:broke up with|left) me\b[^.!?;]{0,90}/],
      ['silence', /\b(?:my (?:friend|sister|brother|partner|boyfriend|girlfriend)|he|she|they) (?:still |just )?(?:ignored me|did not (?:reply|respond|text back)|has not (?:replied|responded)|left me on read)\b[^.!?;]{0,90}/],
      ['conflict', /\b(?:i (?:argued|had an argument|fought) with|my (?:friend|partner|sister|brother|mom|dad) (?:yelled|shouted) at me)\b[^.!?;]{0,110}/],
      ['loss', /\bmy (?:grandma|grandpa|grandmother|grandfather|mom|dad|mother|father|friend|dog|cat|sister|brother) (?:just )?(?:died|passed away)\b[^.!?;]{0,80}/],
      ['event', /\bi (?:have|had) (?:an? |my )?(?:\w+ )?(?:exam|test|quiz|interview|deadline|appointment)\b[^.!?;]{0,90}/],
      ['workload', /\bi have (?:too much (?:work|homework)|too many (?:assignments|deadlines|tasks))\b[^.!?;]{0,90}/]
    ];
    for (const [code, re] of eventPatterns) {
      const match = t.match(re);
      if (match && !hypothetical) { add('event', clause(match[0]), code); if (['failure', 'success'].includes(code)) add('outcome', clause(match[0]), code); break; }
    }
    if (f.fields.effort && !f.fields.outcome && /\b(?:and|but) (?:i )?(?:still )?failed\b/.test(t)) add('outcome', 'failed', 'failure');
    if (/\b(?:this (?:keeps|always) happening|happens (?:all the time|every week|a lot)|a pattern)\b/.test(t)) add('pattern', clause(t), 'repeated');
    const impact = t.match(/\b(?:what hurt(?:s)? (?:most )?(?:is|was)|the hardest part (?:is|was))\s+([^.!?;]{3,150})/);
    if (impact) add('impact', clause(impact[1]));
    const support = t.match(/\b(?:i can (?:talk to|ask|call)|(?:my|a) .{0,25} (?:helps|supports) me)\b[^.!?;]{0,90}/);
    if (support) add('support', clause(support[0]));
    const offeredSupport = t.match(/\b(?:he|she|they) (?:said|told me) (?:he|she|they) (?:would|could|will) help\b[^.!?;]{0,80}/);
    if (offeredSupport) add('support', clause(offeredSupport[0]), 'reported');
    const actionPatterns = [
      ['help', /\bi (?:finally |actually |just )?(?:asked (?:my )?(?:teacher|friend|mom|dad|partner|someone) for help|reached out (?:to|for)|called (?:my |a )?(?:friend|family member|counsellor|counselor))\b[^.!?;]{0,80}/],
      ['boundary', /\bi (?:finally |actually |just )?(?:set a boundary|said no|told .{1,35} i needed space)\b[^.!?;]{0,80}/],
      ['rest', /\bi (?:finally |actually |just )?(?:took a break|let myself rest|went for a walk|put my work aside)\b[^.!?;]{0,80}/],
      ['repair', /\bi (?:finally |actually |just )?(?:apologi[sz]ed to|owned up to|admitted i was wrong)\b[^.!?;]{0,80}/],
      ['care', /\bi (?:finally |actually |just )?(?:checked on (?:my |a )?friend|helped (?:my |a )?(?:friend|brother|sister))\b[^.!?;]{0,80}/]
    ];
    const harmful = /\b(?:hurt(?:ing)?|harm(?:ing)?|revenge|cheat(?:ing)?|hack(?:ing)?|stalk(?:ing)?|steal(?:ing)?|kill(?:ing)?|punish(?:ing)?|forc(?:e|ing)|starv(?:e|ing))\b/.test(t);
    if (personal && !hypothetical && !harmful && !/\b(?:not|never|pretended|lied)\b/.test(t)) {
      for (const [type, re] of actionPatterns) { const match = t.match(re); if (match) f.actions.push({ type, text: clause(match[0]).replace(/^i /, ''), turn }); }
    }
    if (harmful || /\b(?:not|never|pretended|lied)\b/.test(t)) f.actions = [];
    if (harmful) delete f.fields.effort;
    if (f.fields.event || f.actions.length) f.roles.push('event');
    if (cause || /\b(?:even though|although|that is why|the reason)\b/.test(t)) f.roles.push('explanation');
    if (f.fields.emotion) f.roles.push('feeling');
    if (/^(?:no[, ]|actually\b|i meant\b|sorry,? i meant\b)|\b(?:you misunderstood|not what i meant|you got .{0,20} wrong)\b/.test(t)) f.roles.unshift('correction');
    if (/\b(?:can you|could you|please|i prefer|i would rather|i want you to)\b/.test(t) || /\?$/.test(raw)) f.roles.unshift('request');
    if (previous && !unusable(t) && !f.roles.includes('request') && !f.roles.includes('correction')) f.roles.push('answer');
    f.intent = f.roles.includes('correction') ? 'correction' : f.roles.includes('request') ? 'request' : f.roles.includes('explanation') ? 'explanation' : f.roles.includes('event') ? 'event' : f.roles.includes('answer') ? 'answer' : f.roles.includes('feeling') ? 'feeling' : 'reflection';
    if (!f.roles.length) f.roles.push('reflection');
    f.uncertain = ['event', 'emotion', 'expectation', 'need'].filter(k => !f.fields[k]);
    return f;
  }
  function keyOf(frame, topic) {
    const slotKeys = Object.entries(frame.fields).filter(([k]) => ['event', 'outcome', 'concern', 'thought', 'cause'].includes(k)).map(([k, v]) => k + ':' + (v.code || v.text.toLowerCase().replace(/\b(?:still|again|really|just|very|about|my|i|am|the|a)\b/g, '').replace(/\s+/g, ' ').trim()));
    return slotKeys.length ? topic + '/' + slotKeys.sort().join('|') : '';
  }
  function absorb(d, frame, topic, previous, changed = false) {
    let thread = current(d);
    const person = frame.fields.person?.text || '';
    const newActor = thread && person && thread.person && person.toLowerCase() !== thread.person.toLowerCase() && frame.fields.event && frame.intent !== 'correction';
    const concrete = Object.keys(frame.fields).length || frame.actions.length;
    if ((!thread || topic !== thread.topic || newActor) && concrete && !unusable(frame.input.toLowerCase())) {
      if (thread && thread.status === 'open') thread.status = 'parked';
      thread = d.threads.find(x => x.topic === topic && x.status !== 'resolved' && (!person || !x.person || x.person.toLowerCase() === person.toLowerCase()));
      if (!thread) {
        thread = { id: 'thread-' + (++d.serial), topic, person, status: 'open', started: frame.turn, last: frame.turn, fields: {}, asked: [], answered: [], reflections: [], loops: 0, fingerprints: [], lastSummary: 0, rejected: [] };
        d.threads.push(thread); d.threads = d.threads.slice(-6);
      }
      thread.status = 'open'; d.active = thread.id;
    }
    if (!thread || !concrete && unusable(frame.input.toLowerCase())) return thread;
    if (person) thread.person = person;
    frame.thread = thread.id;
    for (const [k, field] of Object.entries(frame.fields)) {
      if (thread.fields[k]?.text !== field.text) frame.newDetails.push(k);
      thread.fields[k] = field;
    }
    if (previous?.kind === 'question' && !changed && !frame.roles.includes('request') && !frame.roles.includes('correction') && !unusable(frame.input.toLowerCase()) && (!Object.keys(frame.fields).length || (QUESTION_FIELDS[previous.id] || []).some(key => frame.fields[key]))) {
      const target = QUESTION_FIELDS[previous.id]?.[0];
      if (target && !frame.fields[target]) { const answer = evidence(frame.input, frame.turn, 'answer'); thread.fields[target] = answer; frame.fields[target] = answer; frame.newDetails.push(target); }
      if (!thread.answered.includes(previous.id)) thread.answered.push(previous.id);
    }
    const fingerprint = keyOf(frame, topic);
    if (frame.actions.length || frame.newDetails.some(k => !['emotion', 'concern', 'thought'].includes(k))) thread.loops = 0;
    // Repetition is compared only within one thread. Explicitly new facts,
    // causes, actions, or changed circumstances reset the loop count.
    if (fingerprint) {
      const seen = thread.fingerprints.includes(fingerprint);
      const newInformation = frame.newDetails.some(k => !['emotion', 'concern', 'thought'].includes(k)) || frame.actions.length;
      thread.loops = seen && !newInformation ? thread.loops + 1 : 0;
      thread.fingerprints.push(fingerprint); thread.fingerprints = thread.fingerprints.slice(-8);
      frame.loop = thread.loops >= 2;
    }
    thread.last = frame.turn;
    d.frames.push(frame); d.frames = d.frames.slice(-24);
    if (concrete && !unusable(frame.input.toLowerCase())) d.substantive++;
    return thread;
  }
  function answered(thread, id) { return Boolean(thread && (thread.answered.includes(id) || (QUESTION_FIELDS[id] || []).some(k => own(thread.fields, k)))); }
  function describe(thread) {
    if (!thread) return '';
    const field = thread.fields.event || thread.fields.concern || thread.fields.need || thread.fields.emotion;
    return field ? field.text : C.topics[thread.topic].label;
  }
  function summary(thread) {
    const fields = thread?.fields || {};
    const parts = [];
    for (const [key, label] of [['event', 'What happened'], ['effort', 'What you put into it'], ['expectation', 'What you expected'], ['emotion', 'How you described feeling'], ['need', 'What you needed']]) if (fields[key]) parts.push(label + ': ' + quote(fields[key].text) + '.');
    return parts.slice(0, 4).join('\n');
  }
  function reflection(d, frame, turn) {
    const thread = current(d); if (!thread) return null;
    const f = thread.fields;
    const recent = key => f[key] && turn - f[key].turn <= 4;
    const proposed = [];
    if (f.effort && f.outcome?.code === 'failure' && recent('effort') && recent('outcome') && (frame.fields.effort || frame.fields.outcome)) proposed.push({
      id: 'effort-failure:' + f.effort.text + ':' + f.outcome.text,
      text: 'You ' + toYou(f.effort.text) + ', and you still describe the result as ' + quote(f.outcome.text) + '. That is a difficult gap between effort and outcome.',
      question: 'Is the disappointment mostly about the result, or about not knowing what you could have done differently?',
      evidence: [f.effort, f.outcome], kind: 'effort-outcome'
    });
    if (f.expectation && f.outcome && recent('expectation') && recent('outcome') && (frame.fields.expectation || frame.fields.outcome)) proposed.push({
      id: 'expectation-outcome:' + f.expectation.text + ':' + f.outcome.text,
      text: 'You described your expectation as ' + quote(f.expectation.text) + ', and the outcome as ' + quote(f.outcome.text) + '. Those are two different parts of what happened.',
      question: 'Which part of that gap matters most to you?', evidence: [f.expectation, f.outcome], kind: 'expectation-outcome'
    });
    if (f.need && f.event && recent('need') && recent('event') && (frame.fields.need || frame.fields.event) && /reassurance|hear|understand|listen|respect/.test(f.need.text) && ['silence', 'conflict', 'breakup'].includes(f.event.code)) proposed.push({
      id: 'need-event:' + f.need.text + ':' + f.event.text,
      text: 'You said you needed ' + quote(f.need.text) + '. Alongside ' + quote(f.event.text) + ', I wonder whether feeling unheard is part of the hurt.',
      question: 'Does “unheard” fit, or would you describe it differently?', hypothesis: 'unheard', evidence: [f.need, f.event], kind: 'tentative-interpretation'
    });
    if (frame.fields.cause) proposed.push({ id: 'cause:' + frame.fields.cause.text, text: 'You connected this to ' + quote(frame.fields.cause.text) + '. That gives some context for why it matters to you.', evidence: [frame.fields.cause], kind: 'explanation' });
    if (frame.fields.expectation) proposed.push({ id: 'expectation:' + f.expectation.text, text: 'The expectation you named was ' + quote(f.expectation.text) + '. We can look at how that shaped the experience.', evidence: [f.expectation], kind: 'expectation' });
    if (frame.fields.need) proposed.push({ id: 'need:' + f.need.text, text: 'You have named something specific you needed: ' + quote(f.need.text) + '.', evidence: [f.need], kind: 'need' });
    if (frame.fields.effort) proposed.push({ id: 'effort:' + f.effort.text, text: 'You ' + toYou(f.effort.text) + '. That is part of the picture, alongside how things turned out.', evidence: [f.effort], kind: 'effort' });
    if (frame.fields.emotion?.code === 'change') proposed.push({ id: 'feeling-change:' + f.emotion.text, text: 'You are noticing that you feel ' + quote(f.emotion.text) + '. We can acknowledge that without needing it to be a permanent change.', evidence: [f.emotion], kind: 'feeling-update' });
    if (frame.fields.impact) proposed.push({ id: 'impact:' + f.impact.text, text: 'The part you singled out was ' + quote(f.impact.text) + '. We can stay with that.', evidence: [f.impact], kind: 'impact' });
    for (const [key, label] of [['concern', 'The concern you named'], ['meaning', 'What this seems to mean to you'], ['control', 'The part you see as within your control'], ['support', 'The support you described'], ['obstacle', 'The obstacle you named'], ['wish', 'What you wish were understood'], ['fair', 'The fairer description you offered']]) {
      if (frame.fields[key]?.code === 'answer') proposed.push({ id: 'answer-' + key + ':' + frame.fields[key].text, text: label + ' is ' + quote(frame.fields[key].text) + '.', evidence: [frame.fields[key]], kind: 'answer-reflection' });
    }
    if (frame.fields.event && ['silence', 'conflict', 'breakup', 'workload'].includes(f.event?.code)) proposed.push({ id: 'event:' + f.event.text, text: 'You described ' + quote(f.event.text) + '. That is the situation we can work from; the reasons behind it may still be unclear.', evidence: [f.event], kind: 'event' });
    for (const action of frame.actions.filter(a => a.type !== 'effort')) proposed.push({ id: 'action:' + action.type + ':' + action.text, text: 'You said you ' + toYou(action.text) + '.', question: 'What was that experience like for you?', evidence: [evidence(action.text, action.turn, action.type)], kind: 'action-reflection' });
    const result = proposed.find(p => !thread.reflections.includes(p.id) && !(p.hypothesis && thread.rejected.includes(p.hypothesis)));
    if (result) { thread.reflections.push(result.id); thread.reflections = thread.reflections.slice(-30); }
    return result || null;
  }
  function kindWords(d, frame, turn, mode) {
    if (!d.preferences.encouragement || d.substantive < 4 || turn - d.lastKindTurn < 6 || !frame || frame.loop) return null;
    const thread = current(d);
    const candidates = d.frames.filter(f => f.thread === thread?.id && turn - f.turn <= 3).flatMap(f => f.actions).reverse();
    const action = candidates.find(a => !d.kindUsed.includes(a.type + ':' + a.text));
    if (!action) return null;
    const lines = {
      effort: 'You said you ' + toYou(action.text) + '. Whatever the outcome, it is fair to count the effort you actually put in.',
      help: 'You said you ' + toYou(action.text) + '. You made room for some support with what you are carrying.',
      boundary: 'You said you ' + toYou(action.text) + '. Making a need clear can be a constructive step, even when the response is uncertain.',
      rest: 'You said you ' + toYou(action.text) + '. Giving yourself some room to rest is a reasonable way to respond to having limits.',
      repair: 'You said you ' + toYou(action.text) + '. Owning your part can matter, even though the other person gets to decide how they respond.',
      care: 'You said you ' + toYou(action.text) + '. That is a concrete act of consideration.'
    };
    d.lastKindTurn = turn; d.kindCount++; d.kindUsed.push(action.type + ':' + action.text); d.kindUsed = d.kindUsed.slice(-20);
    return { text: lines[action.type], evidence: action };
  }
  function restore(data) {
    const d = fresh(); if (!data || data.version !== 2) return d;
    const p = data.preferences || {};
    if (['balanced', 'direct', 'few'].includes(p.questions)) d.preferences.questions = p.questions;
    if (['normal', 'brief'].includes(p.brevity)) d.preferences.brevity = p.brevity;
    for (const key of ['exercises', 'encouragement']) if (typeof p[key] === 'boolean') d.preferences[key] = p[key];
    const number = n => Number.isSafeInteger(n) ? Math.max(-10, Math.min(1000000, n)) : 0;
    const field = v => v && typeof v.text === 'string' && v.source === 'explicit' ? evidence(v.text, number(v.turn), v.code) : null;
    const strings = (a, n, max = 120) => Array.isArray(a) ? a.filter(x => typeof x === 'string').slice(-n).map(x => cap(x, max)) : [];
    if (Array.isArray(data.threads)) for (const t of data.threads.slice(-6)) {
      if (!t || !/^thread-\d{1,7}$/.test(t.id) || !own(C.topics, t.topic) || d.threads.some(x => x.id === t.id)) continue;
      const x = { id: t.id, topic: t.topic, person: cap(t.person, 70), status: ['open', 'parked', 'resolved'].includes(t.status) ? t.status : 'parked', started: number(t.started), last: number(t.last), fields: {}, asked: strings(t.asked, 100).filter(k => own(QUESTION_FIELDS, k)), answered: strings(t.answered, 100).filter(k => own(QUESTION_FIELDS, k)), reflections: strings(t.reflections, 30, 600), loops: Math.min(8, number(t.loops)), fingerprints: strings(t.fingerprints, 8, 1200), lastSummary: number(t.lastSummary), rejected: strings(t.rejected, 12) };
      for (const key of FIELDS) { const value = own(t.fields, key) && field(t.fields[key]); if (value) x.fields[key] = value; }
      d.threads.push(x);
    }
    d.active = d.threads.some(t => t.id === data.active) ? data.active : null;
    d.serial = Math.max(number(data.serial), ...d.threads.map(t => Number(t.id.slice(7))));
    for (const key of ['substantive', 'questionStreak', 'lastKindTurn', 'kindCount', 'lastLoopTurn', 'lastReturnOffer', 'lastSummaryTurn']) d[key] = number(data[key]);
    d.kindUsed = strings(data.kindUsed, 20, 400);
    // Rebuild bounded evidence and known action types. The only supported
    // tentative interpretation and repair fields are validated below.
    if (Array.isArray(data.frames)) for (const f of data.frames.slice(-24)) {
      if (!f || !d.threads.some(t => t.id === f.thread)) continue;
      const x = { turn: number(f.turn), input: cap(f.input, 600), thread: f.thread, intent: ROLES.includes(f.intent) ? f.intent : 'reflection', roles: strings(f.roles, 7).filter(r => ROLES.includes(r)), fields: {}, actions: [], entities: strings(f.entities, 4, 70), uncertain: strings(f.uncertain, 10).filter(k => FIELDS.includes(k)), newDetails: [], loop: false };
      for (const key of FIELDS) { const value = own(f.fields, key) && field(f.fields[key]); if (value) x.fields[key] = value; }
      if (Array.isArray(f.actions)) x.actions = f.actions.filter(a => a && ACTIONS.includes(a.type) && typeof a.text === 'string').slice(0, 5).map(a => ({ type: a.type, text: cap(a.text), turn: number(a.turn) }));
      d.frames.push(x);
    }
    if (data.hypothesis?.value === 'unheard' && d.threads.some(t => t.id === data.hypothesis.thread && t.fields.need && t.fields.event && !t.rejected.includes('unheard'))) d.hypothesis = { value: 'unheard', thread: data.hypothesis.thread, turn: number(data.hypothesis.turn) };
    if (data.pendingRepair && [null, 'emotion', 'person', 'event'].includes(data.pendingRepair.field)) d.pendingRepair = { field: data.pendingRepair.field };
    if (d.threads.some(t => t.id === data.pendingThread)) d.pendingThread = data.pendingThread;
    if (data.lastMove && own(C.topics, data.lastMove.topic)) d.lastMove = { rule: cap(data.lastMove.rule, 80), text: cap(data.lastMove.text, 1000), topic: data.lastMove.topic, emotion: cap(data.lastMove.emotion, 40) || null, fields: Array.isArray(data.lastMove.fields) ? data.lastMove.fields.map(field).filter(Boolean).slice(0, 3) : [], kind: cap(data.lastMove.kind, 50) };
    return d;
  }
  return { fresh, current, analyze, absorb, answered, describe, summary, reflection, kindWords, restore, cap, quote, QUESTION_FIELDS, FIELDS };
});
