/* Everyday conversation and explicit personal memory. No model or network.
   A callback is a question about an earlier detail, never an invented update. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.StillFriend = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clean = (v, max = 180) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  const norm = s => clean(s, 4000).toLowerCase().replace(/[’‘]/g, "'");
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const quote = s => '“' + clean(s) + '”';
  const kin = 'brother|sister|sibling|mother|father|mom|mum|dad|friend|partner|boyfriend|girlfriend|husband|wife|cousin';
  const qualifiers = '(?:(older|younger|little|big|oldest|youngest|twin|step|half)\\s+)?';
  const namePattern = "([\\p{L}][\\p{L}'’-]{1,35})";
  const invalidNames = /^(?:Happy|Sad|Angry|Fine|Called|Named|Studying|Sick|Dead|Gone|Moving|Going|Very|Really|Just|Also|Has|Had|Is|Was|The|And|But|Not|My|Your|You|They|He|She|Older|Younger|Only|Always|Never|Here|There|Actually|Annoying|Great|Cool|Nice|Doing|Feeling|Feels|Likes|Loves|Hates|Died|Passed|Plays|Works|Wants|Needs|Says|Told|Said|Went|Did|Does|Can|Cannot|Will|Tall|Short|Funny|Smart|Kind|Good|Bad|Busy|At|In|On|With|So|Such)$/i;
  const dead = /\b(?:died|dead|passed away|killed (?:himself|herself|themselves)|lost (?:him|her|them) to suicide)\b/i;
  const distant = /\b(?:do not talk|don't talk|no contact|estranged|do not speak|don't speak|broke up|ex[- ]partner|abusive)\b/i;
  const quietInput = /^(?:nothing(?: much| else)?|not much|idk|i do not know(?: what (?:else )?to say)?|i don't know(?: what (?:else )?to say)?|not sure|i have nothing (?:else )?to say|i cannot think of anything|i can't think of anything|you (?:choose|pick)|ask me something|something else|change the subject|a different topic|tell me something|i am bored|i'm bored|bored|meh|okay|ok|yeah|yep|yes|no|nope)[.!? ]*$/;
  const prompts = [
    ['day-detail', "What's one small thing that happened today—even if it seemed ordinary?"],
    ['looking-forward', "What's something you're looking forward to, even a little?"],
    ['music', 'What have you been listening to lately? Any song you keep coming back to?'],
    ['free-afternoon', 'If you had a completely free afternoon tomorrow, what would you do with it?'],
    ['interest', 'What is something you could happily talk about for ages?'],
    ['food', 'What is a food you could eat far too often without getting bored of it?'],
    ['curiosity', 'What is something you have been curious about lately?'],
    ['good-detail', 'Has anything made you laugh recently?'],
    ['project', 'Is there anything you have been making, playing, reading, or trying lately?'],
    ['place', 'Where do you go when you want a change of scenery?'],
    ['weekend', 'What would make this weekend a good one for you?'],
    ['small-opinion', 'What is a small, completely unimportant opinion you feel strongly about?']
  ];
  const topicQuestions = {
    school: ['What has school been like this week?', 'Which class has been the most interesting lately?', 'What happened with it today?'],
    work: ['What was the most eventful part of your day at work?', 'What are the people you work with like?', 'Is this a usual kind of day there?'],
    relationships: ['What happened next?', 'What are they usually like with you?', 'Have you two talked since then?'],
    family: ['What have things been like at home lately?', 'What are they like?', 'Is this something you two have talked about?'],
    selfworth: ['Was there something that happened today that brought this up?', 'What happened before you started feeling that way?'],
    loneliness: ['Who have you spent time with lately, even briefly?', 'What kind of company are you missing today?'],
    loss: ['What were they like?', 'Is there a memory of them you want to tell me about?'],
    rest: ['Has it been one of those long days, or more of a long week?', 'What has been keeping you busiest?'],
    worry: ['What is happening with it right now?', 'Is this something coming up soon?'],
    stuck: ['What are you trying to get started on?', 'What got you interested in it in the first place?'],
    joy: ['Tell me how it happened.', 'What was the best part?', 'Have you told anyone else yet?'],
    general: ['What happened next?', 'What was that like?', 'Tell me a little more about that.']
  };
  function fresh() { return { version: 1, people: [], interests: [], serial: 0, activePerson: null, lastRecall: -10, prompts: [], quiet: false, question: null, pendingName: null, lastNewPeople: [], lastChanges: [] }; }
  function validName(s) { return typeof s === 'string' && /^[\p{L}][\p{L}'’ -]{0,49}$/u.test(s) && !invalidNames.test(s); }
  function addPerson(memory, relation, name, turn, source, correction = false) {
    if (!validName(name)) return null;
    relation = clean(relation.toLowerCase(), 40);
    let p = memory.people.find(p => norm(p.name) === norm(name) && p.relation === relation);
    if (!p && correction) {
      const matches = memory.people.filter(p => p.relation === relation);
      if (matches.length === 1) p = matches[0];
    }
    if (p) { if (norm(p.name) !== norm(name)) p.note = ''; p.name = clean(name, 50); p.lastMention = turn; p.source = clean(source, 400); }
    else { p = { id: 'person-' + (++memory.serial), relation, name: clean(name, 50), status: 'ordinary', note: '', recall: true, first: turn, lastMention: turn, lastAsked: -10, source: clean(source, 400) }; memory.people.push(p); memory.people = memory.people.slice(-12); memory.lastNewPeople.push(p.id); }
    memory.activePerson = p.id; return p;
  }
  function referenced(memory, raw) {
    const t = norm(raw);
    const named = memory.people.filter(p => new RegExp('\\b' + escape(norm(p.name)) + '\\b', 'i').test(t));
    if (named.length) return named;
    const related = memory.people.filter(p => t.includes('my ' + p.relation));
    if (related.length) return related;
    if (/^(?:he|she|they|his|her|their|we|our)\b/.test(t) && memory.activePerson) return memory.people.filter(p => p.id === memory.activePerson);
    return [];
  }
  function learn(memory, raw, turn) {
    memory.lastNewPeople = []; memory.lastChanges = [];
    const input = raw.replace(/[’‘]/g, "'");
    const starts = [
      new RegExp('\\b[Mm]y\\s+' + qualifiers + '(' + kin + ")(?:'s name is| is (?:called|named)|,? (?:called|named))\\s+" + namePattern, 'gu'),
      new RegExp('\\b[Mm]y\\s+' + qualifiers + '(' + kin + ')(?: is)?\\s+([A-ZÀ-ÖØ-Þ][\\p{L}\u0027’-]{1,35})', 'gu'),
      new RegExp('\\bI have (?:an? )?' + qualifiers + '(' + kin + ') (?:called|named)\\s+' + namePattern, 'gu')
    ];
    const correction = /\b(?:actually|i meant|correction|not .+, (?:it is|it's))\b/i.test(input);
    for (const re of starts) for (const m of input.matchAll(re)) {
      const relation = (m[1] ? m[1] + ' ' : '') + m[2];
      const person = addPerson(memory, relation, m[3], turn, raw, correction);
      if (person && correction) memory.lastChanges.push(person.id);
    }
    const reverse = new RegExp('\\b' + namePattern + ' is my ' + qualifiers + '(' + kin + ')\\b', 'gu');
    for (const m of input.matchAll(reverse)) addPerson(memory, (m[2] ? m[2] + ' ' : '') + m[3], m[1], turn, raw, correction);
    const plural = input.match(/\b[Mm]y (brothers|sisters|siblings) (?:are called|are named|are) ([\p{L}][\p{L}'’-]+) and ([\p{L}][\p{L}'’-]+)/u);
    if (plural) for (const name of [plural[2], plural[3]]) addPerson(memory, plural[1].replace(/s$/, ''), name, turn, raw);
    const pronounName = input.match(/\b(?:[Hh]is|[Hh]er|[Tt]heir) name is ([A-Z][\p{L}'’-]+)/u);
    if (pronounName && memory.activePerson && correction) {
      const p = memory.people.find(p => p.id === memory.activePerson);
      if (p && validName(pronounName[1])) { p.name = pronounName[1]; p.source = clean(raw, 400); memory.lastChanges.push(p.id); }
    }
    const refs = referenced(memory, raw);
    if (refs.length === 1) memory.activePerson = refs[0].id;
    else if (refs.length > 1) memory.activePerson = null;
    for (const p of refs) {
      p.lastMention = turn;
      const sentences = raw.split(/[.!?]/).filter(x => new RegExp('\\b' + escape(p.name) + '\\b', 'i').test(x) || refs.length === 1);
      const about = sentences.join('. ');
      if (dead.test(about) && !/\b(?:not dead|not died|hasn't died|not passed away|almost died|nearly died)\b/i.test(about)) { p.status = 'deceased'; p.recall = false; }
      else if (distant.test(about)) { p.status = 'sensitive'; p.recall = false; }
      // Only explicit event/state phrases become a note. Questions do not
      // create facts about a person the program cannot observe.
      if (!/\?/.test(raw) && /\b(?:has|had|is|was|got|started|likes|loves|enjoys|plays|moved|died|passed away)\b/i.test(about) && !/\b(?:name is|is my|is called|is named)\b/i.test(about)) p.note = clean(about, 200);
    }
    const interest = raw.match(/\bI (?:really |also )?(?:enjoy|like|love)\s+([^.!?;]{2,100})/i);
    if (interest && !/\b(?:you|her|him|them|girl|boy|person|crush|my (?:brother|sister|partner|mom|dad)|hurt|harm|killing|dying|stealing|hacking)\b/i.test(interest[1])) {
      const value = clean(interest[1].split(/\s+(?:but|because)\s+/i)[0], 100);
      const existing = memory.interests.find(x => norm(x.text) === norm(value));
      if (existing) existing.lastMention = turn;
      else { memory.interests.push({ text: value, source: clean(raw, 400), lastMention: turn, lastAsked: -10 }); memory.interests = memory.interests.slice(-8); }
    }
    const dislike = raw.match(/\bI (?:do not|don't|no longer) (?:enjoy|like|love)\s+([^.!?;]+)/i);
    if (dislike) memory.interests = memory.interests.filter(x => !norm(dislike[1]).includes(norm(x.text)));
    return { newPeople: memory.lastNewPeople.map(id => memory.people.find(p => p.id === id)).filter(Boolean), refs, changed: memory.lastChanges };
  }
  function choose(memory, key, choices) {
    let i = choices.findIndex((_, i) => !memory.prompts.includes(key + ':' + i));
    if (i < 0) { memory.prompts = memory.prompts.filter(k => !k.startsWith(key + ':')); i = 0; }
    memory.prompts.push(key + ':' + i); memory.prompts = memory.prompts.slice(-50); return choices[i];
  }
  function recall(memory, turn, raw = '', force = false) {
    if (!force && turn - memory.lastRecall < 6) return null;
    const relevant = /\b(?:family|siblings?|brothers?|sisters?|home|weekend)\b/i.test(raw);
    const people = memory.people.filter(p => p.recall && p.status === 'ordinary' && turn - p.lastMention >= 4 && turn - p.lastAsked >= 10);
    const person = people.find(p => relevant && /brother|sister|sibling/.test(p.relation)) || people[0];
    if (person) {
      memory.lastRecall = turn; person.lastAsked = turn; memory.activePerson = person.id;
      const text = person.note ? 'You mentioned ' + quote(person.note) + '. How are things with ' + person.name + ' lately?' : 'You mentioned your ' + person.relation + ', ' + person.name + ', earlier. How is ' + person.name + ' doing lately?';
      memory.question = { kind: 'person', id: person.id };
      return { text, rule: 'friend-recall-person', suggestions: [] };
    }
    const interest = memory.interests.find(x => turn - x.lastMention >= 4 && turn - x.lastAsked >= 10);
    if (interest) {
      memory.lastRecall = turn; interest.lastAsked = turn; memory.question = { kind: 'interest', text: interest.text };
      return { text: 'You mentioned enjoying ' + quote(interest.text) + '. Have you had much time for that lately?', rule: 'friend-recall-interest', suggestions: [] };
    }
    return null;
  }
  function prompt(memory, turn, raw = '') {
    const callback = recall(memory, turn, raw);
    if (callback) return callback;
    const [id, question] = choose(memory, 'fresh-prompt', prompts);
    memory.question = { kind: 'casual', id };
    return { text: question, rule: 'friend-new-prompt', suggestions: [] };
  }
  function reply(memory, raw, t, { turn, topic, frame, name, learned, emotional, facts } = {}) {
    if (memory.quiet) return { text: emotional ? choose(memory, 'quiet-emotion', ['That sounds rough. Go on—I’m following.', 'You can tell me the rest in your own words.', 'That is a lot to have on your mind. You can keep going.']) : choose(memory, 'quiet', ['Go on. You do not have to make it sound tidy.', 'I’m following. Tell me the rest.', 'There is room for the part you have not said yet.']), rule: 'friend-listening', suggestions: [] };
    if (learned?.changed.length) {
      const p = memory.people.find(p => p.id === learned.changed[0]);
      return { text: 'Got it—' + p.name + '. I have corrected the name. What were you saying about ' + p.name + '?', rule: 'friend-name-correction', suggestions: [] };
    }
    if (learned?.newPeople.length) {
      const p = learned.newPeople[0];
      if (p.status !== 'ordinary') return { text: 'I’m sorry—that sounds painful. What would you like me to know about ' + p.name + '?', rule: 'friend-person-sensitive', suggestions: [] };
      memory.question = learned.newPeople.length === 1 ? { kind: 'person', id: p.id } : null;
      return { text: learned.newPeople.length > 1 ? learned.newPeople.map(p => p.name).join(' and ') + '—got it. What are they like?' : p.note && !/\bis\s+[\p{L}'’-]+[.! ]*$/u.test(p.note) ? 'What has that been like for ' + p.name + '?' : p.name + '—got it. What is ' + p.name + ' like?', rule: 'friend-person-intro', suggestions: [] };
    }
    if (/^(?:hi|hello|hey|hiya|hey there)[.! ]*$/.test(t)) {
      const callback = recall(memory, turn, raw);
      if (callback) return { ...callback, text: 'Hey' + (name ? ', ' + name : '') + '. ' + callback.text };
      return { text: choose(memory, 'hello', ['Hey' + (name ? ', ' + name : '') + '. What has your day been like?', 'Hey. Anything interesting happen today?', 'Hi' + (name ? ', ' + name : '') + '. What have you been up to?']), rule: 'friend-greeting', suggestions: [] };
    }
    if (/\b(?:how are you|how is your day|how was your day|what have you been up to)\b/.test(t)) return { text: 'I’m here and ready to chat. What has been the most interesting part of your day?', rule: 'friend-reciprocity', suggestions: [] };
    if (/\b(?:do you (?:really |actually )?care|do you have feelings|are you a real person)\b/.test(t)) return { text: 'I’m a chatbot, so I do not have feelings or a life of my own. But I can pay attention to what you tell me, remember the details you share, and take your words seriously. What would you like to talk about?', rule: 'friend-honesty', suggestions: [] };
    if (/^(?:thanks|thank you|that helped|this helped|that helps)[.! ]*$/.test(t)) return { text: 'You’re welcome. What else has been happening with you?', rule: 'friend-thanks', suggestions: [] };
    if (learned?.refs.some(p => p.status !== 'ordinary')) return { text: 'I’m sorry. What would you like to tell me about them?', rule: 'friend-person-sensitive', suggestions: [] };
    if (memory.people.length > 1 && /^(?:he|she|they)\b/.test(t) && !learned?.refs.length) return { text: 'Who do you mean?', rule: 'friend-clarify-person', suggestions: [] };
    if (memory.question?.kind === 'person' && /^(?:good|fine|okay|ok|pretty good|doing well|not great|not so good)[.! ]*$/.test(t)) {
      const p = memory.people.find(p => p.id === memory.question.id);
      if (p) { p.lastMention = turn; return { text: /not/.test(t) ? 'What’s been going on with ' + p.name + '?' : 'What has ' + p.name + ' been up to lately?', rule: 'friend-person-answer', suggestions: [] }; }
    }
    if (memory.question?.kind === 'casual' && !quietInput.test(t) && !Object.keys(frame?.fields || {}).some(k => ['event','outcome','emotion','thought'].includes(k))) {
      const id = memory.question.id; memory.question = null;
      const followups = { 'day-detail': 'What was the best part of that?', 'looking-forward': 'How did that come about?', music: 'What do you like about the sound?', 'free-afternoon': 'What makes that your pick?', interest: 'What first got you interested in it?', food: 'Do you make it yourself, or have a favorite place to get it?', curiosity: 'What sparked your curiosity?', 'good-detail': 'What was the funny part?', project: 'How did you get started?', place: 'What do you like about being there?', weekend: 'Do you have anything planned for it yet?', 'small-opinion': 'Okay, make your case. What convinced you?' };
      return { text: emotional && emotional !== 'happy' ? 'That sounds like a hard part of your day. What happened?' : followups[id] || 'What do you like about that?', rule: 'friend-prompt-answer', suggestions: [] };
    }
    if (quietInput.test(t) || /\b(?:nothing more to say|not sure what else to say|do not know what else to talk about)\b/.test(t)) return prompt(memory, turn, raw);
    if (/^(?:something good happened|good news|actually pretty good)[.! ]*$/.test(t)) return { text: 'Oh, tell me! What happened?', rule: 'friend-good-news', suggestions: [] };
    const fields = frame?.fields || {};
    if (fields.outcome?.code === 'success') return { text: 'Nice! That sounds worth celebrating. What was the best part of finding out?', rule: 'friend-success', suggestions: [] };
    if (fields.outcome?.code === 'failure') return { text: fields.effort ? 'Oof, after all that work—you ' + fields.effort.text.replace(/\bmy\b/g, 'your') + '. What happened on the day?' : 'Ah, that is a rough result to get. What happened?', rule: 'friend-setback', suggestions: [] };
    if (fields.event?.code === 'breakup') return { text: 'I’m sorry. A breakup can really throw your day around. Was this something you saw coming?', rule: 'friend-breakup', suggestions: [] };
    if (fields.event?.code === 'silence') return { text: 'Being left waiting for a reply can be frustrating. Have they been quiet for a while, or is this unusual?', rule: 'friend-silence', suggestions: [] };
    if (fields.event?.code === 'loss') return { text: 'I’m sorry. You can tell me about them—what were they like?', rule: 'friend-loss', suggestions: [] };
    if (fields.event?.code === 'event' && /exam|test|quiz/.test(fields.event.text)) return { text: facts?.subject ? 'How is ' + facts.subject.value + ' going for you lately?' : 'What subject is it for?', rule: 'friend-school', suggestions: [] };
    if (learned?.refs.length === 1 && learned.refs[0].status === 'ordinary' && memory.question?.kind === 'person') {
      const p = learned.refs[0];
      return { text: choose(memory, 'person-' + p.id, ['What have you and ' + p.name + ' been up to lately?', 'What is something that ' + p.name + ' is really into?', 'What is a typical day with ' + p.name + ' like?']), rule: 'friend-person-chat', suggestions: [] };
    }
    if (/\b(?:i (?:enjoy|like|love)|i have been (?:playing|reading|watching)|i am (?:playing|reading|watching))\b/.test(t)) return { text: 'What got you into that? Was it something you discovered yourself or through someone else?', rule: 'friend-interest', suggestions: [] };
    if (/^(?:haha|lol|lmao|hehe)[.! ]*$/.test(t)) return { text: choose(memory, 'laugh', ['Okay, now I want the story. What happened?', 'What set that off?', 'Tell me the funny part.']), rule: 'friend-lightness', suggestions: [] };
    if (/\b(?:nothing else|all sorted|sorted out|resolved|feeling better)\b/.test(t)) return prompt(memory, turn, raw);
    if (/\b(?:weekend|family|siblings|back home)\b/.test(t) && !emotional) { const callback = recall(memory, turn, raw); if (callback) return callback; }
    if (/\b(?:i am|i feel) (?:worthless|a failure|unlovable)|\beveryone hates me\b/.test(t)) return { text: 'That sounds painful. I won’t treat that harsh thought as a fact about you. What happened that brought it up?', rule: 'friend-self-criticism', suggestions: [] };
    if (/\b(?:tell me (?:everything|it) will be (?:okay|fine)|promise (?:everything|it) will|reassure me)\b/.test(t)) return { text: 'I can’t know how it will turn out, but we can talk through what’s happening. What are you waiting to find out?', rule: 'friend-honest-reassurance', suggestions: [] };
    const question = choose(memory, 'topic-' + topic, topicQuestions[topic] || topicQuestions.general);
    const prefix = emotional ? choose(memory, 'emotion-' + emotional, emotional === 'happy' ? ['That sounds like a good moment.', 'That is good to hear.'] : ['That sounds rough.', 'I can see why that would stick with you.', 'That sounds like a lot to deal with.']) : '';
    return { text: prefix ? prefix + ' ' + question : question, rule: 'friend-chat', suggestions: [] };
  }
  // Phrase intent beats incidental location words: a crush at school is not
  // automatically academic pressure. Follow-ups depend on the last question.
  function intent(memory, raw, t) {
    const denied = /\b(?:do not|did not|no longer|used to|never) (?:really )?(?:like|have a crush)|\bnot (?:a crush|romantically|into)\b/.test(t);
    const romance = /\b(?:i (?:really |think i |kind of )?(?:like|fancy|am into) (?:this |that |a |the )?(?:girl|boy|guy|woman|man|someone)|i (?:really )?like (?:her|him|them)|(?:have|got) a crush|like a crush|my crush)\b/.test(t);
    if (denied && memory.question?.kind === 'crush') { memory.question = null; return { kind: 'crush-correction', topic: 'relationships' }; }
    if (romance && !denied) return { kind: 'crush', topic: 'relationships', fresh: memory.question?.kind !== 'crush' };
    if (memory.question?.kind === 'crush') {
      if (/\b(?:different topic|something else|new topic|nothing more|nothing else|ask me something|i am bored)\b/.test(t)) { memory.question = null; return null; }
      if (/\b(?:my boss|my brother|my sister|work today|played|watching|reading)\b/.test(t) || /\b(?:exam|homework)\b/.test(t) && !['common','opener'].includes(memory.question.stage) && !/\b(?:she|he|her|him|they|them|crush)\b/.test(t)) { memory.question = null; return null; }
      return { kind: 'crush', topic: 'relationships', fresh: false };
    }
    return null;
  }
  function intentReply(memory, raw, t, intent) {
    const result = (text, stage) => { memory.question = stage ? { kind: 'crush', stage } : null; return { text, rule: 'intent-' + intent.kind, suggestions: [] }; };
    if (intent.kind === 'crush-correction') return result('Got it—I read romance into that when I shouldn’t have. What do you like about them as a person?', null);
    const stage = memory.question?.stage;
    if (/\b(?:said no|turned me down|rejected me|does not like me|not interested)\b/.test(t)) return result('Ah, that can sting. Their answer deserves space, even when it isn’t the one you hoped for. Have you had a chance to talk about it with anyone?', 'rejected');
    if (/\b(?:make (?:her|him|them) like me|keep asking|convince (?:her|him|them))\b/.test(t)) return result('You can show interest, but you can’t choose their feelings for them. If they say no, respect that. Have you two had a chance to talk normally?', 'talked');
    if (/\b(?:does (?:she|he)|do they) like me|\b(?:likes|like) me back|\bhow (?:can i|do i) (?:tell|know)\b/.test(t)) return result('It’s hard to know from hints alone. What have they actually said or done around you?', 'signals');
    if (/\b(?:ask (?:her|him|them) out|what should i (?:say|do)|how (?:do|can) i (?:talk|start)|give me advice)\b/.test(t)) return result('You could start with something you genuinely share, like a class or an interest, and see whether they join in. If you ask them to hang out, keep it easy to say yes or no. What do you two already have in common?', 'common');
    if (/\b(?:we (?:already )?talk|talk (?:all the time|every day)|we are friends)\b/.test(t)) return result('So you already have a connection. What are your conversations usually like?', 'conversations');
    if (intent.fresh) return result('Oh, you have a crush. What is it about them that you like?', 'attraction');
    if (/\b(?:like a crush|really like (?:her|him|them))\b/.test(t)) return result('Got it—a crush. Have you two talked much yet?', 'talked');
    if (stage === 'talked' && /^(?:no|nope|not really|not yet|we have not|never)[.! ]*$/.test(t)) return result('So it’s mostly from a distance so far. Do you share a class, an activity, or mutual friends?', 'common');
    if (stage === 'talked' && /^(?:yes|yeah|yep|a little|sometimes)[.! ]*$/.test(t)) return result('What do you usually end up talking about?', 'conversations');
    if (/^(?:i do not know|not sure|maybe)[.! ]*$/.test(t)) return result('Sometimes it’s hard to put your finger on it. Was there a particular moment when you noticed them?', 'moment');
    if (stage === 'attraction' || stage === 'moment') return result('What you notice about someone can say a lot about the attraction. Have you two talked much yet?', 'talked');
    if (stage === 'common') return result('That gives you something natural to talk about. What would you feel comfortable saying next time you see them?', 'opener');
    if (stage === 'opener') return result('That could be a simple way to start a conversation. Do you usually see them in class or somewhere else?', 'more');
    if (stage === 'signals') return result('That could mean a few things; I wouldn’t take it as proof either way. Is it different from how they act with other people?', 'signal-context');
    return result(choose(memory, 'crush-followup', ['What happened the last time you saw them?', 'What would you like to happen between you two?', 'What do you enjoy about being around them?']), 'more');
  }
  function command(memory, raw, t, turn = 0) {
    const result = text => ({ text, rule: 'people-memory', suggestions: [] });
    if (memory.pendingName && !/^(?:no|yes|okay|ok|thanks|stop|bye|goodbye|hello|hi|idk|unknown)[.! ]*$/.test(t) && /^[\p{L}][\p{L}'’-]{1,35}[.! ]*$/u.test(raw) && validName(raw.replace(/[.! ]+$/, ''))) {
      const p = addPerson(memory, memory.pendingName, raw.replace(/[.! ]+$/, ''), turn, raw);
      memory.pendingName = null; memory.question = { kind: 'person', id: p.id };
      return result(p.name + '—got it. What is ' + p.name + ' like?');
    }
    memory.pendingName = null;
    const refs = referenced(memory, raw);
    if (/\b(?:forget|remove|do not remember)\b/.test(t) && refs.length) { for (const p of refs) remove(memory, p.id); return result('I’ve removed those people from the personal notes. The original messages stay in the chat until you erase it.'); }
    if (/\b(?:do not ask|stop asking|do not bring up|do not mention)\b/.test(t) && refs.length) { for (const p of refs) p.recall = false; return result('Understood. I won’t bring them up on my own.'); }
    if (/\b(?:what (?:is|are|was)|what's|remember)\b/.test(t) && /\b(?:name|names|called)\b/.test(t) && !/\b(?:my name is|name is \w|names are \w)\b/.test(t)) {
      const relation = t.match(new RegExp('\\b(' + kin + ')(?:s|\\\'s)?\\b'));
      if (relation) { const people = memory.people.filter(p => p.relation.endsWith(relation[1])); if (!people.length) memory.pendingName = relation[1]; return result(people.length ? people.map(p => 'Your ' + p.relation + ' is ' + p.name + '.').join(' ') : 'You haven’t told me that name yet. What is it?'); }
    }
    return null;
  }
  function restore(data) {
    const s = fresh(); if (!data || data.version !== 1) return s;
    const number = v => Number.isSafeInteger(v) ? Math.max(-20, Math.min(v, 1000000)) : 0;
    if (Array.isArray(data.people)) for (const p of data.people.slice(-12)) {
      if (!p || !/^person-\d{1,7}$/.test(p.id) || !validName(p.name) || !new RegExp('^(?:(?:older|younger|little|big|oldest|youngest|twin|step|half) )?(?:' + kin + ')$').test(p.relation) || s.people.some(x => x.id === p.id)) continue;
      s.people.push({ id: p.id, name: clean(p.name, 50), relation: p.relation, status: ['ordinary', 'sensitive', 'deceased'].includes(p.status) ? p.status : 'sensitive', note: clean(p.note, 200), recall: p.recall === true && p.status === 'ordinary', first: number(p.first), lastMention: number(p.lastMention), lastAsked: number(p.lastAsked), source: clean(p.source, 400) });
    }
    if (Array.isArray(data.interests)) s.interests = data.interests.filter(x => x && typeof x.text === 'string').slice(-8).map(x => ({ text: clean(x.text, 100), source: clean(x.source, 400), lastMention: number(x.lastMention), lastAsked: number(x.lastAsked) }));
    s.serial = Math.max(number(data.serial), ...s.people.map(p => Number(p.id.slice(7))));
    s.activePerson = s.people.some(p => p.id === data.activePerson) ? data.activePerson : null;
    s.lastRecall = number(data.lastRecall); s.quiet = data.quiet === true;
    s.prompts = Array.isArray(data.prompts) ? data.prompts.filter(x => typeof x === 'string').slice(-50).map(x => clean(x, 90)) : [];
    if (data.question?.kind === 'person' && s.people.some(p => p.id === data.question.id)) s.question = { kind: 'person', id: data.question.id };
    if (data.question?.kind === 'crush' && ['attraction','talked','common','conversations','signals','signal-context','moment','opener','more','rejected'].includes(data.question.stage)) s.question = { kind: 'crush', stage: data.question.stage };
    if (data.question?.kind === 'casual' && prompts.some(p => p[0] === data.question.id)) s.question = { kind: 'casual', id: data.question.id };
    if (typeof data.pendingName === 'string' && kin.split('|').includes(data.pendingName)) s.pendingName = data.pendingName;
    return s;
  }
  function remove(memory, id) { memory.people = memory.people.filter(p => p.id !== id); if (memory.activePerson === id) memory.activePerson = null; if (memory.question?.id === id) memory.question = null; }
  return { fresh, learn, referenced, recall, prompt, reply, restore, remove, validName, quietInput, command, intent, intentReply };
});
