(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const CHAT_KEY = 'still.chat.v1';
  const PREF_KEY = 'still.preferences.v1';
  const engine = new Still.Engine();
  let remember = false, debug = false, storageAvailable = true, toastTimer = null, confirmAction = null;
  let preference = { theme: 'light', debug: false };
  try {
    const savedPreferences = JSON.parse(localStorage.getItem(PREF_KEY) || 'null');
    if (savedPreferences && ['light', 'dark'].includes(savedPreferences.theme)) preference.theme = savedPreferences.theme;
    else preference.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    debug = savedPreferences?.debug === true;
    const savedText = localStorage.getItem(CHAT_KEY);
    if (savedText && savedText.length < 4000000) {
      const saved = JSON.parse(savedText);
      if (saved?.consent === true && engine.restore(saved.state)) remember = true;
    }
  } catch (_) { storageAvailable = false; }

  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3800);
  }
  function status() {
    $('save-status').textContent = remember ? 'Saved only in this browser' : 'Not saved after you close this page';
    $('remember-toggle').checked = remember;
    if (!storageAvailable) {
      $('storage-notice').hidden = false;
      $('storage-notice').textContent = 'Browser storage is unavailable or full. This conversation will keep working, but changes are not being saved. Keep this page open or download the chat if you want a copy.';
      $('save-status').textContent = 'Changes are not being saved';
    } else $('storage-notice').hidden = true;
  }
  function save() {
    if (remember) {
      try { localStorage.setItem(CHAT_KEY, JSON.stringify({ consent: true, state: engine.snapshot() })); storageAvailable = true; }
      catch (_) { storageAvailable = false; }
    }
    status();
  }
  function savePreferences() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ theme: preference.theme, debug })); } catch (_) { /* Appearance works for this page without storage. */ }
  }
  function theme() {
    document.documentElement.dataset.theme = preference.theme;
    $('theme-button').setAttribute('aria-label', 'Switch to ' + (preference.theme === 'light' ? 'dark' : 'light') + ' mode');
  }
  function syncContext() {
    const s = engine.state;
    document.querySelectorAll('input[name="mode"]').forEach(input => { input.checked = input.value === s.mode; });
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === s.mode)));
    const active = engine.threads().find(t => t.active);
    const story = engine.stories().find(item => item.id === s.conversation.active);
    $('thread-text').textContent = story ? 'Talking about ' + story.title + '.' : active ? active.description : s.facts.goal ? 'You want to ' + s.facts.goal.value.replace(/[.!]+$/, '') + '.' : s.topic === 'general' ? 'We can start anywhere.' : StillContent.topics[s.topic].label + '.';
    $('session-heading').textContent = s.mode === 'friend' ? 'What’s happening in your world?' : s.mode === 'step' ? 'Something within reach.' : 'One thought at a time.';
  }
  function openDialog(id) { const dialog = $(id); if (!dialog.open) dialog.showModal(); }
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); }
  function support() { openDialog('support-dialog'); }
  function scrollBottom() { $('conversation-scroll').scrollTop = $('conversation-scroll').scrollHeight; }
  function addMessage(message) {
    const article = document.createElement('article');
    article.className = 'message ' + message.role + (message.support ? ' is-support' : '');
    article.setAttribute('aria-label', message.role === 'bot' ? 'Still' : 'You');
    if (message.role === 'bot') { const avatar = document.createElement('span'); avatar.className = 'message-avatar'; avatar.textContent = 's'; avatar.setAttribute('aria-hidden', 'true'); article.append(avatar); }
    const content = document.createElement('div'); content.className = 'message-content';
    const label = document.createElement('p'); label.className = 'message-label'; label.textContent = message.role === 'bot' ? 'Still' : 'You';
    const text = document.createElement('p'); text.className = 'message-text'; text.textContent = message.text;
    content.append(label, text);
    if (message.support) {
      const bar = document.createElement('div'); bar.className = 'reply-tools';
      const button = document.createElement('button'); button.className = 'secondary-button'; button.textContent = 'Open urgent support'; button.addEventListener('click', support); bar.append(button); content.append(bar);
    }
    if (message.role === 'bot' && message.id) {
      const feedback = document.createElement('details'); feedback.className = 'reply-feedback';
      const summary = document.createElement('summary'); summary.textContent = message.reported ? 'Flagged: ' + message.reported.toLowerCase() : 'That didn’t fit';
      const choices = document.createElement('div'); choices.className = 'feedback-choices';
      for (const reason of ['Wrong topic', 'Wrong assumption', 'Already answered']) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button'; button.textContent = reason;
        button.addEventListener('click', () => {
          const reply = engine.reportFeedback(message.id, reason);
          summary.textContent = 'Flagged: ' + reason.toLowerCase(); feedback.open = false; save(); renderFeedbackCount();
          if (reply) showReply(reply); else toast('Example saved on this device.');
          $('message').focus();
        }); choices.append(button);
      }
      feedback.append(summary, choices); content.append(feedback);
    }
    if (debug && message.trace) {
      const details = document.createElement('details'); details.className = 'debug';
      const summary = document.createElement('summary'); summary.textContent = 'Why this reply?';
      const pre = document.createElement('pre'); pre.textContent = JSON.stringify(message.trace, null, 2); details.append(summary, pre); content.append(details);
    }
    article.append(content); $('conversation').append(article);
    // Keep the visible transcript and stored transcript under the same bound.
    while ($('conversation').children.length > 160) $('conversation').firstElementChild.remove();
  }
  function suggestions(items = []) {
    $('suggestions').replaceChildren();
    for (const item of items) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'suggestion'; button.textContent = item;
      button.addEventListener('click', () => {
        // Keep an unfinished draft: clicking a chip never silently overwrites it.
        if ($('message').value.trim()) { toast('Send or clear your draft before using a suggestion.'); $('message').focus(); return; }
        send(item);
      });
      $('suggestions').append(button);
    }
  }
  function render() {
    $('conversation').replaceChildren();
    for (const message of engine.state.history) addMessage(message);
    const last = engine.state.history.at(-1);
    suggestions(last?.role === 'bot' ? last.suggestions : []);
    syncContext(); scrollBottom();
  }
  function showReply(reply) { if (!reply || reply.ignored) return; addMessage(reply); suggestions(reply.suggestions); syncContext(); save(); scrollBottom(); }
  function resizeComposer() {
    $('message').style.height = 'auto';
    $('message').style.height = Math.min($('message').scrollHeight, 150) + 'px';
    const length = $('message').value.length;
    $('character-count').hidden = length < 3500;
    $('character-count').textContent = length + ' / 4000';
    $('send-button').disabled = !$('message').value.trim();
  }
  function send(raw) {
    const value = String(raw || '').trim(); if (!value) return;
    const reply = engine.respond(value);
    if (reply.ignored) return;
    addMessage({ role: 'user', text: value.slice(0, 4000) });
    $('message').value = ''; resizeComposer(); showReply(reply);
    // Keep keyboard input ready; suggestions do not steal focus on touch screens.
    if (window.matchMedia('(pointer: fine)').matches) $('message').focus();
  }
  function renderNotes() {
    $('memory-list').replaceChildren();
    const notes = engine.notes();
    if (!notes.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No notes yet. Facts you explicitly share may appear here.'; $('memory-list').append(p); return; }
    for (const note of notes) {
      const row = document.createElement('div'); row.className = 'memory-row';
      const field = document.createElement('div'); field.className = 'memory-field';
      const label = document.createElement('label'); label.textContent = note.label; label.htmlFor = 'note-' + note.key;
      const input = document.createElement('input'); input.id = label.htmlFor; input.value = note.value; input.maxLength = note.key === 'name' ? 60 : 220;
      field.append(label, input);
      const edit = document.createElement('button'); edit.textContent = 'Save'; edit.setAttribute('aria-label', 'Save ' + note.label.toLowerCase());
      edit.addEventListener('click', () => { engine.editFact(note.key, input.value); save(); syncContext(); renderNotes(); toast('Note updated.'); });
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); edit.click(); } });
      const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.setAttribute('aria-label', 'Remove ' + note.label.toLowerCase());
      remove.addEventListener('click', () => { engine.forget(note.key); save(); syncContext(); renderNotes(); toast('Note removed.'); });
      row.append(field, edit, remove); $('memory-list').append(row);
    }
  }
  function renderThreads() {
    $('threads-list').replaceChildren();
    const threads = engine.threads();
    if (!threads.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No situations recorded yet.'; $('threads-list').append(p); return; }
    const labels = { event: 'What happened', person: 'Who was involved', emotion: 'Feeling you named', effort: 'Effort', expectation: 'Expectation', outcome: 'Outcome', cause: 'Explanation', need: 'What you needed', goal: 'Goal', thought: 'Thought you described', concern: 'Concern', meaning: 'Meaning', control: 'Within your control', support: 'Support', obstacle: 'Obstacle', pattern: 'Pattern', kind: 'How you described it', memory: 'Memory', wish: 'What you wished for', boundary: 'Boundary', fair: 'A fairer view', firstStep: 'Possible step', credit: 'What you gave yourself credit for', trigger: 'What brought it up', impact: 'What affected you' };
    for (const thread of threads) {
      const row = document.createElement('article'); row.className = 'thread-note';
      const title = document.createElement('h4'); title.textContent = thread.label;
      const state = document.createElement('span'); state.className = 'thread-state'; state.textContent = thread.status === 'resolved' ? 'Resolved' : thread.active ? 'Current' : 'Set aside';
      const description = document.createElement('p'); description.textContent = thread.description;
      const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Details used in replies'; details.append(summary);
      for (const item of thread.details) { const p = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = (labels[item.key] || item.key) + ': '; p.append(strong, document.createTextNode(item.text)); details.append(p); }
      const buttons = document.createElement('div'); buttons.className = 'thread-buttons';
      const back = document.createElement('button'); back.className = 'secondary-button'; back.textContent = 'Return to this'; back.addEventListener('click', () => { closeDialogs(); showReply(engine.openThread(thread.id)); });
      const resolve = document.createElement('button'); resolve.className = 'text-button'; resolve.textContent = 'Mark resolved'; resolve.disabled = thread.status === 'resolved'; resolve.addEventListener('click', () => { engine.resolveThread(thread.id); save(); syncContext(); renderThreads(); });
      const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Remove thread'; remove.addEventListener('click', () => { engine.forgetThread(thread.id); save(); syncContext(); renderThreads(); toast('Thread details removed. Original messages remain in the chat.'); });
      buttons.append(back, resolve, remove); row.append(title, state, description, details, buttons); $('threads-list').append(row);
    }
  }
  function renderStories() {
    const list = $('stories-list'); list.replaceChildren(); const stories = engine.stories();
    if (!stories.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No ongoing stories recorded yet.'; list.append(p); return; }
    const labels = { subject: 'Subject', event: 'Event', time: 'When', person: 'Person', context: 'Where you know them', attraction: 'What you like', plan: 'Plan', activity: 'Activity', cause: 'What started it', preparation: 'Preparation', concern: 'Main concern', next: 'What happens next', goal: 'What you want', outcome: 'Outcome', company: 'With whom', favoritePart: 'Favorite part', opener: 'Possible opener', update: 'Latest update' };
    for (const story of stories) {
      const row = document.createElement('article'); row.className = 'thread-note';
      const title = document.createElement('h4'); title.textContent = story.title;
      const state = document.createElement('span'); state.className = 'thread-state'; state.textContent = story.status === 'resolved' ? 'Resolved' : story.id === engine.state.conversation.active ? 'Current' : 'Open';
      const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Details used in conversation'; details.append(summary);
      const visible = story.details.filter(item => !['effort'].includes(item.key)).slice(-10);
      if (!visible.length) { const p = document.createElement('p'); p.textContent = 'No extra details recorded yet.'; details.append(p); }
      for (const item of visible) { const p = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = (labels[item.key] || item.key) + ': '; p.append(strong, document.createTextNode(item.value)); details.append(p); }
      const recall = document.createElement('label'); recall.className = 'switch-row'; const recallInput = document.createElement('input'); recallInput.type = 'checkbox'; recallInput.checked = story.recall; recallInput.disabled = story.status === 'resolved' || story.sensitive; recall.append(document.createTextNode(story.sensitive ? 'Automatic check-ins off for this sensitive topic' : 'Bring this up naturally later'), recallInput);
      recallInput.addEventListener('change', () => { const record = engine.state.conversation.stories.find(item => item.id === story.id); if (record) record.recall = recallInput.checked; save(); });
      const buttons = document.createElement('div'); buttons.className = 'thread-buttons';
      const back = document.createElement('button'); back.className = 'secondary-button'; back.textContent = 'Return to this'; back.addEventListener('click', () => { closeDialogs(); send('Back to ' + story.title); });
      const resolve = document.createElement('button'); resolve.className = 'text-button'; resolve.textContent = 'Mark resolved'; resolve.disabled = story.status === 'resolved'; resolve.addEventListener('click', () => { engine.resolveStory(story.id); save(); syncContext(); renderStories(); });
      const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Remove story'; remove.addEventListener('click', () => { engine.forgetStory(story.id); save(); syncContext(); renderStories(); toast('Story details removed. Original messages remain in the chat.'); });
      buttons.append(back, resolve, remove); row.append(title, state, details, recall, buttons); list.append(row);
    }
  }
  function renderPeople() {
    const list = $('people-list'); list.replaceChildren();
    for (const p of engine.people()) {
      const row = document.createElement('article'); row.className = 'thread-note';
      const label = document.createElement('label'); label.textContent = 'Your ' + p.relation; label.htmlFor = p.id;
      const input = document.createElement('input'); input.id = p.id; input.value = p.name; input.maxLength = 50;
      const saveName = document.createElement('button'); saveName.textContent = 'Save name'; saveName.className = 'secondary-button';
      saveName.addEventListener('click', () => { if (!engine.editPerson(p.id, input.value)) { toast('Enter a name using letters, spaces, apostrophes, or hyphens.'); return; } save(); renderPeople(); toast('Name updated.'); });
      const toggle = document.createElement('label'); toggle.className = 'switch-row';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = p.recall; check.disabled = p.status !== 'ordinary';
      toggle.append(document.createTextNode(p.status === 'ordinary' ? 'Bring up naturally later' : 'Automatic check-ins off for this sensitive topic'), check);
      check.addEventListener('change', () => { engine.state.social.people.find(x => x.id === p.id).recall = check.checked; save(); });
      const note = document.createElement('p'); note.className = 'muted'; note.textContent = p.note;
      const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Remove person';
      remove.addEventListener('click', () => { engine.forgetPerson(p.id); save(); renderPeople(); });
      row.append(label, input, saveName, note, toggle, remove); list.append(row);
    }
    for (const interest of engine.state.social.interests) {
      const row = document.createElement('div'); row.className = 'memory-row'; const text = document.createElement('span'); text.textContent = interest.text;
      const remove = document.createElement('button'); remove.textContent = 'Remove interest'; remove.addEventListener('click', () => { engine.state.social.interests = engine.state.social.interests.filter(x => x !== interest); engine.forget('interest'); save(); renderPeople(); });
      row.append(text, remove); list.append(row);
    }
    if (!list.children.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No people or interests remembered yet.'; list.append(p); }
  }
  function settings() {
    renderNotes(); renderThreads(); renderPeople(); renderStories(); $('debug-toggle').checked = debug;
    const p = engine.state.dialogue.preferences;
    $('questions-select').value = p.questions; $('brief-toggle').checked = p.brevity === 'brief'; $('exercises-toggle').checked = p.exercises; $('kindness-toggle').checked = p.encouragement;
    renderFeedbackCount(); status(); openDialog('settings-dialog');
  }
  function renderFeedbackCount() {
    const count = engine.state.feedback.length;
    $('feedback-count').textContent = count ? count + ' flagged example' + (count === 1 ? '' : 's') + ' on this device.' : 'No replies flagged yet.';
    $('feedback-export').disabled = count === 0; $('feedback-clear').disabled = count === 0;
  }
  function exportFeedback() {
    const blob = new Blob([JSON.stringify(engine.feedbackExport(), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'still-flagged-examples.json';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function confirm(title, text, label, action) {
    $('confirm-heading').textContent = title; $('confirm-text').textContent = text; $('confirm-action').textContent = label; confirmAction = action;
    closeDialogs(); openDialog('confirm-dialog');
  }
  function removeStoredChat() {
    try { localStorage.removeItem(CHAT_KEY); storageAvailable = true; return true; }
    catch (_) { storageAvailable = false; status(); toast('Could not remove browser data. Clear this site’s data in your browser settings.'); return false; }
  }
  function newChat() {
    confirm('Start a new conversation?', 'The current messages and topic will be cleared. Your conversation notes will stay available; you can remove them in settings.', 'Start fresh', () => {
      engine.reset(true); engine.welcome(); $('message').value = ''; render(); resizeComposer(); save();
    });
  }
  function erase() {
    confirm('Erase chat and notes?', 'This clears the messages, notes, and topic, and turns off saving. It cannot erase copies you already downloaded.', 'Erase everything', () => {
      removeStoredChat(); remember = false; engine.reset(false); engine.welcome(); $('message').value = ''; render(); resizeComposer(); status();
    });
  }
  function exportChat() {
    const lines = ['STILL — CONVERSATION', 'Exported ' + new Date().toLocaleString(), '', 'Still is a rule-based reflection chatbot, not a therapist.', 'This file contains your conversation. Share it only if you choose to.', ''];
    for (const m of engine.state.history) lines.push((m.role === 'bot' ? 'STILL' : 'YOU') + '\n' + m.text, '');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'still-conversation-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $('chat-form').addEventListener('submit', event => { event.preventDefault(); send($('message').value); });
  $('message').addEventListener('input', resizeComposer);
  $('message').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && window.matchMedia('(pointer: fine)').matches) { event.preventDefault(); send($('message').value); } });
  document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => { engine.setMode(input.value); syncContext(); suggestions([]); save(); }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { engine.setMode(button.dataset.mode); syncContext(); suggestions([]); save(); }));
  $('theme-button').addEventListener('click', () => { preference.theme = preference.theme === 'light' ? 'dark' : 'light'; theme(); savePreferences(); });
  for (const id of ['privacy-button', 'memory-button', 'mobile-more']) $(id).addEventListener('click', settings);
  $('support-button').addEventListener('click', support);
  $('new-button').addEventListener('click', newChat);
  $('clear-button').addEventListener('click', erase);
  $('export-button').addEventListener('click', exportChat);
  $('feedback-export').addEventListener('click', exportFeedback);
  $('feedback-clear').addEventListener('click', () => { engine.state.feedback = []; engine.state.feedbackPending = null; for (const m of engine.state.history) delete m.reported; save(); renderFeedbackCount(); render(); toast('Flagged examples cleared.'); });
  for (const id of ['ground-button', 'mobile-ground']) $(id).addEventListener('click', () => { closeDialogs(); showReply(engine.grounding()); });
  for (const id of ['wrap-button', 'mobile-wrap']) $(id).addEventListener('click', () => { closeDialogs(); showReply(engine.wrap()); });
  $('confirm-action').addEventListener('click', () => { const action = confirmAction; confirmAction = null; closeDialogs(); if (action) action(); });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('remember-toggle').addEventListener('change', () => {
    if ($('remember-toggle').checked) { remember = true; save(); }
    else { if (removeStoredChat()) remember = false; status(); }
  });
  $('debug-toggle').addEventListener('change', () => { debug = $('debug-toggle').checked; savePreferences(); render(); });
  $('questions-select').addEventListener('change', () => { engine.setPreference('questions', $('questions-select').value); save(); });
  $('brief-toggle').addEventListener('change', () => { engine.setPreference('brevity', $('brief-toggle').checked ? 'brief' : 'normal'); save(); });
  $('exercises-toggle').addEventListener('change', () => { engine.setPreference('exercises', $('exercises-toggle').checked); if (!$('exercises-toggle').checked) suggestions([]); save(); });
  $('kindness-toggle').addEventListener('change', () => { engine.setPreference('encouragement', $('kindness-toggle').checked); save(); });
  // Concurrent tabs cannot silently overwrite one another's chat or resurrect
  // a chat another tab erased. Explicitly enable saving again to choose a tab.
  window.addEventListener('storage', event => {
    if (event.key !== CHAT_KEY && event.key !== null) return;
    if (event.newValue === null) {
      remember = false; engine.reset(false); engine.welcome(); $('message').value = ''; render(); resizeComposer(); status(); renderNotes(); renderThreads(); renderStories(); toast('Chat data was cleared in another tab.');
    } else if (remember) {
      remember = false; status(); toast('Another tab saved a conversation. Saving is paused here to avoid overwriting it.');
    }
  });
  engine.welcome(); theme(); render(); status(); resizeComposer();
})();
