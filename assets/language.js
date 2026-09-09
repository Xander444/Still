/* Small, transparent language tools. No model, downloads, or network calls. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.StillLanguage = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clean = (s, max = 4000) => typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  const norm = s => clean(s).toLowerCase().replace(/[’‘]/g, "'");
  const quote = s => '“' + clean(s, 180).replace(/[“”]/g, '"').replace(/[.!?]+$/, '') + '”';
  const signature = s => norm(s).replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
  function fresh() { return { version: 1, recent: [], patterns: [], lastReflection: -10 }; }
  function restore(data) {
    const s = fresh();
    if (!data || data.version !== 1) return s;
    s.recent = Array.isArray(data.recent) ? data.recent.filter(x => typeof x === 'string').slice(-100).map(x => clean(x, 700)) : [];
    s.patterns = Array.isArray(data.patterns) ? data.patterns.filter(x => typeof x === 'string').slice(-16).map(x => clean(x, 60)) : [];
    s.lastReflection = Number.isSafeInteger(data.lastReflection) ? Math.max(-10, Math.min(1000000, data.lastReflection)) : -10;
    return s;
  }
  // Split only at explicit clause boundaries. Ordinary lists stay together.
  function thoughts(raw) {
    return clean(raw).split(/(?:[.!;]+\s+|\s+(?:but|and|also|plus|however)\s+(?=(?:I\b|I'm\b|my\b|we\b|he\b|she\b|they\b)))/i)
      .map(x => x.replace(/^(?:but|also|however|and)\s+/i, '').trim()).filter(Boolean).slice(0, 6);
  }
  // One replacement pass prevents "my" -> "your" -> "my" cascades.
  // "You" is deliberately left alone: it may refer to Still or someone else.
  function perspective(raw) {
    const map = { "i'm": 'you are', "i've": 'you have', "i'll": 'you will', "i'd": 'you would', 'i am': 'you are', 'i was': 'you were', 'i have': 'you have', 'i': 'you', 'myself': 'yourself', 'my': 'your', 'mine': 'yours', 'me': 'you', 'we are': 'you are', 'we were': 'you were', 'we': 'you', 'our': 'your', 'ours': 'yours', 'us': 'you' };
    return clean(raw, 220).replace(/[’‘]/g, "'").replace(/\b(?:i'm|i've|i'll|i'd|i am|i was|i have|we are|we were|myself|mine|my|me|i|ours|our|us|we)\b/gi, word => map[word.toLowerCase()]);
  }
  function similar(a, b) {
    a = signature(a); b = signature(b);
    if (a === b) return true;
    const aa = new Set(a.split(' ')), bb = new Set(b.split(' '));
    if (Math.min(aa.size, bb.size) < 6) return false;
    const intersection = [...aa].filter(x => bb.has(x)).length;
    return intersection / new Set([...aa, ...bb]).size >= 0.86;
  }
  function repeated(s, text) { return s.recent.some(old => similar(old, text)); }
  function choose(s, family, lines) {
    const available = lines.map((text, i) => ({ text, key: family + ':' + i }));
    const choice = available.find(x => !s.patterns.includes(x.key) && !repeated(s, x.text)) || available.find(x => !repeated(s, x.text)) || available.reduce((a, b) => s.patterns.lastIndexOf(a.key) <= s.patterns.lastIndexOf(b.key) ? a : b);
    s.patterns.push(choice.key); s.patterns = s.patterns.slice(-16); return choice.text;
  }
  function reflection(s, raw, question = true) {
    const clause = thoughts(raw).find(x => /^(?:I\b|I'm\b|I've\b|my\b|we\b)/i.test(x));
    if (!clause || clause.length < 10 || clause.length > 200 || /[?]|\b(?:you|your|my name|call me|kill|suicid|overdose|hurt myself|worthless|everyone hates|always fail|nobody cares)\b/i.test(clause)) return '';
    if (question && !/^I(?:['’]m\s+(?!going\b)|\s+(?:feel|am\s+(?!going\b)|wish|want|need|hope|think|believe|wonder|miss|cannot|can't|don't|do not))\b/i.test(clause)) return '';
    const original = clause.replace(/[.!?]+$/, ''), shifted = perspective(original), t = norm(original);
    if (/\b(?:worthless|useless|a loser|a failure|stupid|broken|terrible person|not good enough|unlovable)\b/.test(t)) return '';
    const head = shifted[0].toUpperCase() + shifted.slice(1);
    if (/\b(?:we|us|our|ours)\b/i.test(original)) return question ? choose(s, 'collective', ['When you say ' + quote(original) + ', what would you like me to understand?', 'Could you say more about ' + quote(original) + '?', 'What stands out for you in ' + quote(original) + '?']) : 'You described ' + quote(original) + '.';
    if (!question) return choose(s, 'observation', [head + '.', 'You described ' + quote(original) + '.', 'The part you put into words is ' + quote(original) + '.']);
    let lines;
    if (/^i (?:feel|am|'m)|^i'm/.test(t)) lines = [head + '?', 'When you say ' + quote(original) + ', what is that like for you?', 'What stands out about feeling that way?', 'Could you say more about ' + quote(original) + '?'];
    else if (/^i (?:want|wish|need|hope)/.test(t)) lines = [head + '?', 'What would change for you if that happened?', 'When you say ' + quote(original) + ', what matters most about it?', 'What would that look like for you?'];
    else if (/^i (?:think|believe|wonder)/.test(t)) lines = [head + '?', 'What led you to that thought?', 'What comes to mind as you say ' + quote(original) + '?', 'What makes that possibility stand out?'];
    else lines = [head + '?', 'Could you say more about ' + quote(original) + '?', 'When you say ' + quote(original) + ', which part stands out?', 'What is the part of ' + quote(original) + ' you most want me to understand?'];
    return choose(s, 'reflect', lines);
  }
  function invitation(s, raw) {
    const part = thoughts(raw).at(-1) || raw;
    const contextual = clean(part).split(' ').length >= 4 && !/^(?:i (?:do not know|am not sure|have no idea)|not sure|maybe)[.! ]*$/i.test(clean(part));
    return choose(s, 'invitation', [
      ...(contextual ? [
      'Tell me a little more about ' + quote(part) + '.',
      'We can stay with ' + quote(part) + ' for a moment.'] : []),
      'There is room to add to that, even if it is not a finished thought.',
      'Go on, in whatever order makes sense to you.',
      'You can pick up whichever part matters to you next.',
      'I am following what you have put into words so far.'
    ]);
  }
  function sentences(text) { return text.match(/[^.!?]+(?:[.!?]+[”"]?|$)/g)?.map(x => x.trim()).filter(Boolean) || []; }
  function record(s, text) { s.recent.push(...sentences(text)); s.recent = s.recent.slice(-100); }
  function polish(s, raw, text, { turn, reflect = true, pause = false, quiet = false, brief = false } = {}) {
    let parts = sentences(text), replacedQuestion = false, reflected = false;
    const hasQuestion = parts.some(x => x.includes('?'));
    const repeatedQuestion = parts.some(x => x.includes('?') && repeated(s, x));
    const echo = reflect && !pause && !quiet && hasQuestion && (turn - s.lastReflection >= 2 || repeatedQuestion) ? reflection(s, raw) : '';
    if (echo && !repeated(s, echo)) {
      // Replace the whole conversational move, so we do not state and then
      // immediately ask the very same thing. The engine defers its old question.
      parts = [echo]; replacedQuestion = true; reflected = true; s.lastReflection = turn;
    } else {
      parts = parts.filter(x => x.includes('?') || !repeated(s, x));
      if (pause || quiet) { parts = parts.filter(x => !x.includes('?')); replacedQuestion = hasQuestion; }
      else if (repeatedQuestion) { parts = parts.filter(x => !x.includes('?')); replacedQuestion = true; }
      if (!parts.length) parts = [reflection(s, raw, false) || invitation(s, raw)];
      if ((pause || repeatedQuestion) && !quiet) parts.push(invitation(s, parts.some(part => part.includes(quote(raw))) ? '' : raw));
    }
    if (brief) parts = parts.slice(-2);
    const result = parts.filter((x, i, all) => !all.slice(0, i).some(y => similar(x, y))).join(' ');
    record(s, result);
    return { text: result, replacedQuestion, reflected, paused: pause || quiet };
  }
  return { fresh, restore, thoughts, perspective, reflection, invitation, similar, repeated, choose, record, polish, quote };
});
