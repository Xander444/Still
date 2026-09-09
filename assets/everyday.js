/* Original conversation material, organized using broad everyday topic research.
   See CONVERSATIONS.md for sources, coverage, and limits. Nothing is downloaded. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.StillEveryday = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const cards = {};
  const clean = (s, max = 180) => typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
  const quote = s => '“' + clean(s, 150).replace(/[“”]/g, '"').replace(/[.!?]+$/, '') + '”';
  function add(id, topic, label, patterns, openings, stages, practical, anchors, sensitive = false) {
    cards[id] = { id, topic, label, patterns: patterns.map(re => [re, 10]), openings, stages: stages.map(([slot, ...questions]) => ({ slot, questions })), practical, anchors, sensitive };
  }

  add('daily_life', 'general', 'your day',
    [/\b(?:my day|my morning|my afternoon|my evening|today) (?:was|has been|is|went)\b/, /\b(?:same old routine|busy day|ordinary day|nothing special happened)\b/],
    ['We can start with the ordinary parts of the day.', 'There does not need to be a big event to talk about your day.', 'Tell me the version of today that you noticed.'],
    [['moment', 'What moment from today is easiest to picture?', 'What happened around the middle of your day?'], ['company', 'Were you mostly around people or doing your own thing?', 'Who did you spend time around today?'], ['highlight', 'Was there a small part you enjoyed?', 'What made the day a little better, if anything?'], ['drain', 'What used up most of your energy?', 'Was anything more tiring than you expected?'], ['different', 'What would you change about a day like this?', 'What would make tomorrow feel a little different?'], ['next', 'What is still ahead of you today?', 'What are you doing after this?']],
    'Pick one part of tomorrow you can shape: something to do, someone to speak to, or a little time left unplanned.', ['day', 'routine', 'morning', 'evening']);

  add('family_life', 'family', 'family life',
    [/\bmy (?:parents|family) (?:keep|always|never|want|expect|think|say|make|treat|do not|does not|are)\b/, /\b(?:family dinner|family gathering|family drama|living with my parents|strict parents|chores at home)\b/],
    ['There can be several different expectations under one roof.', 'What happens at home can follow you through the day.', 'Let us stay with what family life is like for you.'],
    [['situation', 'What has been happening at home?', 'What is the particular thing your family has been doing?'], ['pattern', 'Is this a familiar pattern or something new?', 'Has it been this way for a while?'], ['impact', 'Which part affects your day the most?', 'What is your side of it like?'], ['wish', 'What do you wish they understood about you?', 'What would you want them to hear without interrupting?'], ['exceptions', 'Is there anyone at home you find easier to talk to?', 'Are there moments when things feel easier between you?'], ['next', 'What would a small improvement at home look like?', 'What is one thing you would like to be different next time?']],
    'You could put one specific situation and one request into a short sentence: “When this happens, I feel __. Could we try __?” Only use it if talking feels safe.', ['family', 'parents', 'home', 'chores']);

  add('belonging', 'loneliness', 'feeling included',
    [/\b(?:left me out|did not invite me|was not invited|was left out|do not fit in|do not belong|third wheel|everyone has friends except me)\b/, /\b(?:making friends|make new friends|friend group|friendship feels one.sided)\b/],
    ['Wanting to feel included is understandable.', 'The small signals in a group can matter a lot.', 'We can talk about the connection you are missing without assuming what everyone else thinks.'],
    [['situation', 'Was there a particular moment that made you feel outside the group?', 'What has been happening with these people?'], ['pattern', 'Does this happen often, or was this one occasion?', 'Is it the whole group or mainly one person?'], ['connection', 'Who do you feel most at ease with, even a little?', 'Is there someone you find easier to talk to one on one?'], ['wish', 'What kind of friendship are you hoping for?', 'What would feeling included look like to you?'], ['effort', 'Have you had a chance to reach out to anyone?', 'What have you tried so far, if anything?'], ['next', 'What would be a comfortable way to connect with someone?', 'Is there a shared activity that could make talking easier?']],
    'A small, specific invitation can be easier than trying to join a whole group: ask one person about a shared activity or a short plan. Their answer gives information; it is not a measure of your worth.', ['friends', 'group', 'included', 'belong']);

  add('dating', 'relationships', 'dating and connection',
    [/\b(?:first date|going on a date|went on a date|dating app|asked me out|asked (?:her|him|them) out|seeing someone|long.distance relationship)\b/, /\b(?:my relationship|our relationship) (?:is|feels|has been)\b/],
    ['Dating can bring a lot of little things to read into.', 'We can start with what actually happened between you.', 'Tell me about the connection from your side.'],
    [['situation', 'What has happened between you recently?', 'What is the part of dating you want to talk about?'], ['experience', 'How do you feel when you are actually together?', 'Do you feel able to be yourself around them?'], ['signals', 'What have they said about what they want?', 'Have you talked openly about what each of you is looking for?'], ['wish', 'What would you like this to become?', 'What feels important to you in this connection?'], ['pace', 'How does the pace feel to you?', 'Is there anything you would prefer to take more slowly?'], ['next', 'What would you like your next conversation with them to be about?', 'What would make the next time you meet feel comfortable?']],
    'You can ask about one thing directly instead of trying to decode every hint. Keep room for their answer and for your own boundaries.', ['date', 'dating', 'relationship', 'connection']);

  add('workload', 'work', 'your workload',
    [/\b(?:too much work|work keeps piling up|workload|working overtime|burned out at work|burnt out at work|cannot switch off after work|back.to.back meetings)\b/],
    ['It sounds like work is taking up a lot of room.', 'A pile of demands can be hard to separate into individual things.', 'Let us look at what is being asked of you.'],
    [['load', 'What is taking up the most time at work?', 'Which demand feels biggest right now?'], ['deadline', 'Is there one urgent deadline or several competing ones?', 'What actually needs to happen first?'], ['control', 'Which parts can you influence?', 'Is anything negotiable about the timing or scope?'], ['support', 'Who knows how much you have on your plate?', 'Is there someone you could ask to help prioritize?'], ['rest', 'What happens when the workday is supposed to end?', 'Do you get any time that feels separate from work?'], ['next', 'What could be made smaller for today?', 'What would a manageable stopping point look like?']],
    'Write down the competing demands, then ask which one takes priority. If the workload cannot fit, making the trade-off visible can be more useful than silently trying to do everything.', ['work', 'workload', 'deadline', 'meetings']);

  add('career', 'work', 'work and future direction',
    [/\b(?:career|job hunt|job search|applying for jobs|job application|job interview|switch jobs|quit my job|what to study|college application|university application|choose a major|after graduation)\b/, /\bi (?:do not know|am not sure) what to study\b/],
    ['You do not have to have your whole future settled to talk about the next part.', 'That is a decision with several moving pieces.', 'We can separate what interests you from what other people expect.'],
    [['direction', 'What options are you considering?', 'What sort of work or study has caught your interest?'], ['interest', 'What appeals to you about that direction?', 'Which part would you actually enjoy doing?'], ['constraint', 'What makes the choice difficult?', 'What practical limits do you have to work around?'], ['values', 'What matters most to you in a next step?', 'Would you care more about the work itself, the people, or the setting?'], ['evidence', 'Have you had a chance to try a small version of it?', 'Who could give you a realistic picture of that path?'], ['next', 'What is the next decision you actually need to make?', 'What could you find out before committing?']],
    'Compare a few options using your own criteria, then choose one small way to learn more: a sample project, a conversation, or a visit. Exploring does not commit you to a whole career.', ['career', 'job', 'future', 'college', 'university']);

  add('procrastination', 'stuck', 'getting started',
    [/\b(?:procrastinat\w*|keep putting (?:it|things) off|cannot get started|cannot make myself start|no motivation|lost my motivation|avoiding my homework|avoiding the task)\b/],
    ['Finding it hard to start is different from not caring about the task.', 'Sometimes the start is the part that needs to be made smaller.', 'Let us find where getting started catches.'],
    [['task', 'What are you trying to start?', 'What is the thing you keep putting off?'], ['block', 'What tends to happen right before you put it off?', 'Does it feel unclear, too big, boring, or risky to get wrong?'], ['first', 'What is the first visible action involved?', 'What would count as a very small start?'], ['conditions', 'When is it a little easier to focus?', 'Is there anything around you making starting harder?'], ['support', 'Would company, a timer, or clearer instructions help most?', 'What has helped you begin something similar before?'], ['next', 'What would be enough for one short attempt?', 'How could you make the first attempt deliberately easy?']],
    'Choose an action small enough to do in a few minutes: open the file, write a rough first sentence, or lay out what you need. Treat that as a start, with permission to reassess afterward.', ['start', 'task', 'motivation', 'procrastination']);

  add('decision', 'stuck', 'a decision',
    [/\b(?:cannot decide|cannot choose|torn between|choosing between|stuck between|not sure which|hard decision|big decision|regret my decision)\b/],
    ['Being torn can mean that more than one thing matters to you.', 'We can compare the options without forcing an answer immediately.', 'You can be uncertain and still work out what matters in the choice.'],
    [['options', 'What are the options?', 'What are you choosing between?'], ['appeal', 'What draws you toward each one?', 'What would each option give you?'], ['cost', 'What would be difficult about each choice?', 'What are you most afraid of giving up?'], ['values', 'Which consideration matters most to you?', 'What do you want this decision to protect?'], ['reversible', 'Could you try one option without fully committing?', 'How easy would it be to change your mind later?'], ['next', 'What missing information would help you choose?', 'What is the smallest decision you could make first?']],
    'Write one benefit, one cost, and one unknown for each option. Then look at the unknown you can actually investigate instead of trying to predict every outcome.', ['choice', 'decision', 'options', 'decide']);

  add('confidence', 'selfworth', 'confidence and comparison',
    [/\b(?:comparing myself|compare myself|everyone is better than me|not good enough|imposter syndrome|impostor syndrome|lack confidence|lost my confidence|doubt myself|feel ugly|hate how i look)\b/],
    ['A comparison can feel convincing without telling the whole story about you.', 'You do not have to earn the right to be taken seriously.', 'We can look at the doubt without treating it as a verdict.'],
    [['trigger', 'What brought this comparison up?', 'Was there a moment when the doubt got louder?'], ['standard', 'What standard are you measuring yourself against?', 'Who or what are you comparing yourself with?'], ['evidence', 'What are you noticing about yourself, and what might be missing from that picture?', 'Is there anything the harsh version of the story leaves out?'], ['wish', 'What would you like to feel more comfortable doing?', 'Where is the lack of confidence getting in your way?'], ['exceptions', 'Are there situations where you feel more like yourself?', 'Who makes it easier to stop performing or comparing?'], ['next', 'What could you try without needing to feel completely confident first?', 'What would a fairer expectation of yourself look like today?']],
    'Try describing one specific difficulty without turning it into a label for your whole self. “I am learning this” or “that moment went badly” leaves more room than a permanent verdict.', ['confidence', 'comparison', 'appearance', 'doubt'], true);

  add('boundaries', 'relationships', 'boundaries and saying no',
    [/\b(?:cannot say no|hard to say no|feel guilty saying no|people.pleas\w*|set a boundary|setting boundaries|need some space|keep agreeing to things)\b/],
    ['Wanting a limit does not automatically mean you care less about someone.', 'It can be uncomfortable to name a limit, even when you need one.', 'Let us get specific about what you do and do not have room for.'],
    [['request', 'What is being asked of you?', 'Where are you feeling pushed past your limit?'], ['limit', 'What would you prefer to say yes to, if anything?', 'What is the limit you want to set?'], ['fear', 'What do you worry will happen if you say it?', 'Is it their reaction or your own guilt that makes it harder?'], ['history', 'How have they responded to limits before?', 'Have you tried saying something about this already?'], ['wording', 'What could a short, clear version sound like?', 'How would you put the limit in your own words?'], ['next', 'What would help you hold to that limit?', 'Is there a time or setting where it would be easier to say?']],
    'A boundary can be brief: say what you can or cannot do, without promising more than you mean. If someone reacts in a threatening way, prioritize safety and support over arguing the wording.', ['boundary', 'limit', 'space', 'saying no']);

  add('change', 'general', 'a change in your life',
    [/\b(?:moving (?:house|away|out|to)|moved to a new|starting (?:a new school|a new job|college|university)|big change|everything is changing|homesick|miss my old)\b/],
    ['A change can bring things to look forward to and things to miss at the same time.', 'There may be more than one feeling in this transition.', 'Tell me about the part that is changing for you.'],
    [['change', 'What is changing in your day-to-day life?', 'What is the biggest difference from before?'], ['miss', 'What do you miss, or expect to miss?', 'What would you most like to keep from the old situation?'], ['hope', 'Is there anything you are looking forward to?', 'What could be good about the new situation?'], ['uncertainty', 'Which unfamiliar part feels biggest?', 'What have you not had a chance to get used to yet?'], ['anchor', 'What still feels familiar?', 'Is there a person or routine that could help you feel settled?'], ['next', 'What would make the next few days a little easier?', 'What is one small part of the new place you could make your own?']],
    'Keep one familiar routine while you learn the new situation. You do not have to feel settled immediately for the transition to be moving forward.', ['change', 'moving', 'new', 'homesick']);

  add('sleep', 'rest', 'sleep and energy',
    [/\b(?:cannot sleep|trouble sleeping|slept badly|sleep schedule|stayed up late|waking up at night|cannot get out of bed|always tired|low energy)\b/],
    ['A rough night can change how the whole day feels.', 'Let us talk about what your nights and days have been like.', 'Being short on energy can make ordinary things feel like more work.'],
    [['pattern', 'Is the difficulty falling asleep, staying asleep, or feeling rested?', 'What part of sleep has been difficult?'], ['timing', 'Has this been a recent change or a longer pattern?', 'When did you start noticing it?'], ['thoughts', 'What tends to be on your mind at night?', 'Is anything keeping you alert when you want to rest?'], ['day', 'How is it affecting your day?', 'Which part of the day feels hardest on low energy?'], ['helped', 'Has anything made the evenings feel calmer?', 'What has been different on the easier nights?'], ['next', 'Would it help to talk through tonight or what has been on your mind?', 'What could you take off your plate while your energy is low?']],
    'You could make room to describe the pattern and what has changed around it. If it keeps affecting your daily life, a health professional can help assess it; I cannot work out a medical cause from chat.', ['sleep', 'night', 'energy', 'tired'], true);

  add('health_worry', 'worry', 'a health concern',
    [/\b(?:worried about my health|waiting for (?:medical |blood )?test results|doctor.s appointment|medical appointment|health anxiety|scared about (?:a symptom|my symptoms|the diagnosis))\b/],
    ['Waiting or not knowing about your health can be unsettling.', 'We can talk about the worry while keeping medical conclusions separate.', 'I can listen to what is on your mind about this.'],
    [['concern', 'What is the uncertainty you are sitting with?', 'What part of this has you most concerned?'], ['known', 'What have you actually been told so far?', 'What is known, and what are you still waiting to find out?'], ['question', 'What would you like to ask the clinician?', 'Is there a question you worry you might forget to ask?'], ['impact', 'How is the waiting affecting your day?', 'When does the worry tend to feel loudest?'], ['support', 'Does anyone close to you know you are worried?', 'Who could keep you company with this?'], ['next', 'Would writing down the questions make the next appointment easier?', 'What would help you get through the waiting part today?']],
    'Keep a short note of what you want the clinician to know and the questions you want answered. I cannot diagnose symptoms or tell you that a result will be fine.', ['health', 'appointment', 'results', 'doctor'], true);

  add('money', 'worry', 'money plans and pressures',
    [/\b(?:money is tight|worried about money|cannot afford|bills piling up|rent is due|saving (?:up )?for|spending too much|credit card debt|in debt|budgeting)\b/],
    ['Money pressure can take up a lot of mental space.', 'We can talk about the pressure without judging you for having it.', 'Let us separate the immediate concern from everything else around it.'],
    [['pressure', 'What is the most immediate money concern?', 'Is there a particular expense on your mind?'], ['timing', 'Is there a deadline involved?', 'What needs attention soonest?'], ['known', 'Do you know the amount involved, or is that still unclear?', 'Which parts have you already worked out?'], ['control', 'Is there anything flexible about the timing or expense?', 'What part do you have some control over?'], ['support', 'Is there someone trustworthy who could help you look at the practical details?', 'Have you been carrying the worry on your own?'], ['next', 'What is one question you could get answered first?', 'Would sorting the immediate priorities help you see the next step?']],
    'You could list what is due, when it is due, and what information is missing. I can help organize the questions, but I cannot assess financial products or give tailored financial advice.', ['money', 'bills', 'budget', 'saving'], true);

  add('technology', 'general', 'a technology frustration',
    [/\b(?:my (?:phone|computer|laptop|printer|tablet|wifi|wi.fi) (?:is|keeps|will not|won.t|does not|doesn't)|app keeps crashing|code (?:is not|isn't) working|coding bug|lost my files)\b/],
    ['It is frustrating when the tool becomes the obstacle.', 'We can pin down what is going wrong before jumping between fixes.', 'Tell me what you were trying to do when it happened.'],
    [['goal', 'What were you trying to get it to do?', 'What would working normally look like here?'], ['observed', 'What happens instead?', 'Is there a specific error message or visible behavior?'], ['change', 'Did anything change before this started?', 'Was it working earlier?'], ['tried', 'What have you tried already?', 'Did any attempt change the behavior, even briefly?'], ['scope', 'Does it happen every time or only in one situation?', 'Is the problem limited to one app or device?'], ['next', 'What is the clearest detail you could use in a help request?', 'Which part would you like to narrow down first?']],
    'A useful help request has four parts: what you expected, what happened, the exact error, and what you tried. I cannot inspect your device or run your code, but we can make the problem clearer.', ['device', 'computer', 'phone', 'code', 'error']);

  add('social_media', 'selfworth', 'life online',
    [/\b(?:doomscroll\w*|social media|instagram|tiktok|too much scrolling|checking my likes|left on seen|online drama)\b/, /\bsocial media (?:makes|is making|leaves) me\b/],
    ['There can be a lot going on behind a few seconds of scrolling.', 'Online interactions can spill into the rest of the day.', 'Tell me about what is happening online for you.'],
    [['experience', 'What has been happening on your feed or in messages?', 'What part of being online do you want to talk about?'], ['effect', 'How do you tend to feel afterward?', 'Does it leave you more connected, more wound up, or something else?'], ['pull', 'What keeps drawing you back?', 'Is it particular people, entertainment, or checking for an update?'], ['good', 'What do you actually enjoy about it?', 'What would you want to keep from your time online?'], ['limit', 'Is there a part you would like less of?', 'What would a more comfortable balance look like?'], ['next', 'What is a small change you would be willing to try?', 'When would you most like to have your attention back?']],
    'You could change one part of the experience, such as muting a stressful account or choosing when to check messages, while keeping the connections you value.', ['online', 'feed', 'scrolling', 'messages']);

  add('games', 'joy', 'games you play',
    [/\b(?:video games?|gaming|minecraft|roblox|fortnite|stardew|valorant|chess match|dungeons and dragons|d&d campaign)\b/],
    ['What is happening in your game world?', 'There is usually a story behind a gaming session.', 'Tell me about the part of the game that has your attention.'],
    [['game', 'What are you playing lately?', 'Which game do you want to talk about?'], ['goal', 'What are you working toward in it?', 'Are you exploring, building, competing, or following a story?'], ['moment', 'What happened in your last session?', 'Was there a moment that stood out?'], ['company', 'Do you play with people or mostly on your own?', 'Who do you usually play with?'], ['appeal', 'What makes this game work for you?', 'Is there a mechanic, world, or challenge you especially like?'], ['next', 'What do you want to try next time you play?', 'What would make the next session a good one?']],
    'If a challenge is frustrating, you could isolate one small thing to practice or try a different approach for a session. I cannot check the current game rules or server state.', ['game', 'gaming', 'play', 'minecraft', 'roblox']);

  add('music', 'joy', 'music',
    [/\b(?:listening to (?:music|a song|an album)|favorite song|favourite song|playlist|new album|playing (?:guitar|piano|drums|ocarina)|learning (?:guitar|piano)|writing a song)\b/],
    ['Music gives us something specific to talk about.', 'Tell me what you have been listening to or playing.', 'A song can stick for all sorts of reasons.'],
    [['music', 'What song, artist, or instrument has your attention?', 'What have you had on repeat lately?'], ['appeal', 'What draws you in: the sound, words, rhythm, or something else?', 'What is the part you find yourself listening for?'], ['mood', 'What sort of mood does it fit for you?', 'When do you most want to listen to it?'], ['memory', 'Does it connect with a memory or place?', 'Do you remember when you first found it?'], ['discovery', 'How do you usually find music you like?', 'Did someone introduce you to it?'], ['next', 'What would fit beside it in a playlist?', 'What would you like to hear or learn next?']],
    'Try describing what you like about one track in plain words: pace, texture, mood, or a particular moment. That can help you decide what to look for or practice next.', ['music', 'song', 'album', 'instrument']);

  add('screen_stories', 'joy', 'films and shows',
    [/\b(?:watching (?:a |the |this )?(?:movie|film|show|series|anime)|favorite (?:movie|film|show)|favourite (?:movie|film|show)|season finale|plot twist|just watched)\b/],
    ['Tell me what you watched and what stayed with you.', 'There can be as much to say about a disappointing story as a great one.', 'What did you make of it?'],
    [['title', 'Which film or show was it?', 'What were you watching?'], ['reaction', 'What was your first reaction when it ended?', 'Did it land the way you hoped?'], ['character', 'Was there a character you kept thinking about?', 'Whose choices interested you most?'], ['moment', 'What scene or detail stands out?', 'Was there a moment that changed how you saw the story?'], ['meaning', 'What do you think the story was getting at?', 'Did you agree with the way it handled its main idea?'], ['next', 'What kind of thing would you want to watch afterward?', 'Would you want to discuss it with someone who saw it differently?']],
    'You could choose one scene and explain what it made you think or feel. I may not know the work, so your description can be our shared starting point.', ['film', 'movie', 'show', 'story']);

  add('reading', 'joy', 'books and reading',
    [/\b(?:reading (?:a |the |this )?book|favorite book|favourite book|book club|novel i am reading|just finished reading|cannot get into this book)\b/, /\bfinished reading\b/],
    ['What have you been reading?', 'Tell me about the part of the book that has stayed with you.', 'We can talk about your reading experience even if I do not know the book.'],
    [['title', 'Which book is it?', 'What are you reading at the moment?'], ['experience', 'How are you finding it so far?', 'Is it pulling you along or taking effort to get into?'], ['detail', 'What character, idea, or passage caught your attention?', 'What is one detail you would tell someone about?'], ['connection', 'Does anything in it connect with your own experience?', 'Has it changed how you think about anything?'], ['taste', 'What do you usually look for in a book?', 'Is this similar to what you normally read?'], ['next', 'What are you curious to find out as you keep reading?', 'What would you want your next book to have in common with this one?']],
    'You could put a favorite passage or one idea into your own words, then say why it stayed with you. That is enough to start a discussion without needing a perfect interpretation.', ['book', 'reading', 'novel', 'chapter']);

  add('food', 'joy', 'food and cooking',
    [/\b(?:cooking|baking|made dinner|making dinner|made a cake|trying a recipe|favorite food|favourite food|what to cook|what to eat|went to a restaurant)\b/],
    ['Food can be practical, creative, or just a good part of the day.', 'Tell me what is happening in the kitchen or on the menu.', 'What is the food story today?'],
    [['dish', 'What did you make, eat, or want to try?', 'What dish are you thinking about?'], ['appeal', 'What do you like about it?', 'Is it the flavor, the texture, or something familiar?'], ['experience', 'How did it turn out, or how do you hope it will?', 'Was there a part that surprised you?'], ['company', 'Is this something you make for yourself or share?', 'Who would enjoy it with you?'], ['variation', 'Would you change anything next time?', 'What would you like to experiment with?'], ['next', 'What else have you wanted to try making?', 'Would you make it again or try something different?']],
    'For an ordinary cooking experiment, change one flavor or texture at a time and note what you liked. I cannot verify food safety or identify an unknown ingredient from a description.', ['food', 'cook', 'bake', 'dish', 'recipe']);

  add('exercise', 'general', 'movement and exercise',
    [/\b(?:went for a run|started running|my workout|at the gym|getting back into exercise|training for a race|went swimming|went cycling|fitness goal)\b/],
    ['Tell me what movement has been like for you lately.', 'There can be a lot to a workout beyond the numbers.', 'We can talk about what you enjoy and what you are working toward.'],
    [['activity', 'What kind of activity are you doing?', 'What have you been trying lately?'], ['experience', 'How did the last session feel?', 'What was satisfying or frustrating about it?'], ['goal', 'What would you like to get out of it?', 'Is the goal enjoyment, consistency, performance, or something else?'], ['routine', 'How does it fit into the rest of your week?', 'What makes it easier or harder to make time for it?'], ['company', 'Do you like doing it alone or with someone?', 'Does having company change the experience?'], ['next', 'What would make the next session feel worthwhile?', 'What is a realistic next step from where you are now?']],
    'Choose a goal that fits your current situation and can be adjusted. I can help you describe it, but I cannot assess an injury or prescribe a training plan.', ['exercise', 'run', 'workout', 'swimming'], true);

  add('sports', 'joy', 'sports and teams',
    [/\b(?:my team|our team|hockey game|football game|basketball game|soccer match|baseball game|the playoffs|watching sports|sports practice)\b/],
    ['Tell me about the game from your point of view.', 'There is usually a moment in a game people keep coming back to.', 'What has been happening with your team?'],
    [['sport', 'Which sport or team are we talking about?', 'Are you playing, watching, or both?'], ['moment', 'What happened in the game or practice?', 'What was the moment that stood out?'], ['reaction', 'What did you make of the performance?', 'What was exciting or frustrating about it?'], ['role', 'Who or what made the biggest difference?', 'Was there a particular play or decision you noticed?'], ['connection', 'How did you get into following or playing this?', 'Who do you usually share it with?'], ['next', 'What are you looking forward to next?', 'What would you like to see go differently next time?']],
    'You can break down one moment: what happened, what options were available, and what you would try differently. I do not have live scores or current rosters.', ['sport', 'team', 'match', 'practice']);

  add('pets', 'joy', 'your pet',
    [/\bmy (?:dog|cat|puppy|kitten|pet|rabbit|hamster|parrot)\b/, /\b(?:adopting a pet|getting a puppy|getting a kitten)\b/],
    ['Tell me about your pet.', 'Animals can give a day its own little storyline.', 'What has your pet been up to?'],
    [['pet', 'What kind of pet do you have, and what is their name?', 'Who is the animal we are talking about?'], ['personality', 'What are they like?', 'What is a very typical thing for them to do?'], ['moment', 'Did they do something memorable recently?', 'What happened with them today?'], ['routine', 'What is your usual routine together?', 'What part of having them around do you most enjoy?'], ['bond', 'How did they come into your life?', 'Have they changed much since you first knew them?'], ['next', 'What is something you would like to do with them?', 'Is there a favorite little ritual you have together?']],
    'You could describe the behavior, when it happens, and what changed around it. For illness, pain, or a sudden change, a veterinarian is the right person to assess it; I cannot do that here.', ['pet', 'dog', 'cat', 'animal']);

  add('outdoors', 'joy', 'time outside',
    [/\b(?:went hiking|went fishing|went camping|went for a walk|my garden|planting|gardening|walk in the park|beautiful weather|rainy day|snowing outside|at the lake|at the beach)\b/],
    ['What was it like being out there?', 'Tell me about what you noticed outside.', 'A place can change the feel of a whole day.'],
    [['place', 'Where were you, or where would you like to go?', 'What sort of place are you talking about?'], ['detail', 'What did you notice first?', 'Was there a sound, sight, or small detail that stayed with you?'], ['activity', 'What did you do while you were there?', 'Were you working on something or just spending time outside?'], ['company', 'Were you with anyone?', 'Do you prefer that kind of outing alone or with company?'], ['connection', 'Is it a familiar place for you?', 'What keeps bringing you back, if you have been before?'], ['next', 'What would you like to see or try there next?', 'Is there another place nearby you are curious about?']],
    'You could choose a small thing to notice or document on the next outing. I cannot identify plants, judge water safety, or check local conditions from this conversation.', ['outside', 'lake', 'garden', 'hiking', 'weather']);

  add('travel', 'general', 'a trip',
    [/\b(?:planning a trip|going on vacation|going on holiday|traveling to|travelling to|visited (?:a |another )?city|my vacation|my holiday|flight got cancelled|missed my flight)\b/],
    ['Tell me about the trip you have in mind or just took.', 'A trip can be about the place, the people, or getting out of routine.', 'What is the part of the trip you want to talk about?'],
    [['place', 'Where are you going, or where did you go?', 'Which place are you thinking about?'], ['purpose', 'What draws you to that place?', 'What would you most want from the trip?'], ['company', 'Are you going alone or with others?', 'Who would share the trip with you?'], ['pace', 'Do you want a full schedule or room to wander?', 'What sort of pace would make the trip enjoyable?'], ['uncertainty', 'Is there anything you are still trying to figure out?', 'What part of planning is taking the most thought?'], ['next', 'What would you like to decide first?', 'What would make the trip feel successful to you?']],
    'Choose the main experience you want, your practical limits, and what still needs checking. I cannot look up current prices, transport, entry rules, or availability.', ['trip', 'travel', 'vacation', 'holiday']);

  add('creativity', 'joy', 'something you are making',
    [/\b(?:working on (?:a poem|a story|a drawing|a painting)|writing (?:a poem|a story|a novel)|creative block|writer.s block|drawing lately|my art|my painting|making something)\b/],
    ['Tell me about what you are making.', 'An unfinished idea is enough to talk about.', 'We can stay with the part of the project that interests you.'],
    [['project', 'What are you making?', 'What is the idea or scene you started with?'], ['intention', 'What do you want it to feel like?', 'What is the part you most want to get across?'], ['working', 'What do you like about it so far?', 'Which part feels closest to what you imagined?'], ['stuck', 'Where are you getting stuck?', 'What has been hardest to decide or express?'], ['possibility', 'What is one different version you could try?', 'Is there a small experiment that might help you choose?'], ['next', 'What part would you like to work on next?', 'What would count as enough progress for today?']],
    'Try one small alternate version without deleting the original. Changing one line, shape, or choice can make the possibilities easier to compare.', ['project', 'art', 'story', 'poem', 'drawing']);

  add('learning', 'school', 'learning something',
    [/\b(?:learning a language|learning french|learning spanish|learning to code|trying to understand|do not understand (?:this|the lesson)|cannot understand (?:this|the lesson)|studying (?:a language|programming)|learning something new)\b/],
    ['You can be partway through understanding something and still be making progress.', 'Let us locate the part that is clear and the part that is not.', 'Tell me what you are trying to learn.'],
    [['subject', 'What are you learning?', 'What topic or skill are you working on?'], ['known', 'What part makes sense so far?', 'What could you explain in your own words already?'], ['gap', 'Where do you start losing the thread?', 'Is it a term, a step, or why it works?'], ['attempt', 'What have you tried to make sense of it?', 'Was there an example that helped even a little?'], ['style', 'Would an example, a diagram, or practice be most useful?', 'How do you usually like to approach something new?'], ['next', 'What is one small question you could get answered next?', 'What would show you that this part is starting to click?']],
    'Try explaining the part you understand, then mark the exact point where you get stuck. I can help organize that question, but I may not be able to teach an unfamiliar technical topic accurately.', ['learn', 'lesson', 'skill', 'understand']);

  add('nostalgia', 'general', 'a memory',
    [/\b(?:remember when i|when i was a kid|my childhood|feeling nostalgic|miss the old days|reminds me of when|a memory of)\b/],
    ['A memory can bring back more than the event itself.', 'Tell me what you are remembering.', 'There may be a particular detail that makes that memory feel close.'],
    [['memory', 'What is the memory?', 'What moment came back to you?'], ['detail', 'What can you picture most clearly?', 'Is there a sound, place, or small detail you remember?'], ['people', 'Who was there with you?', 'Is there someone you associate with that time?'], ['feeling', 'What is it like remembering it now?', 'Does it feel comforting, bittersweet, or something else?'], ['meaning', 'What do you miss or value about that time?', 'Why do you think that particular memory stayed?'], ['present', 'Is there a piece of that experience you would like more of now?', 'Does remembering it make you want to do or say anything?']],
    'You could write down a few concrete details before trying to explain what the memory means. A place, a voice, or an ordinary moment can be enough.', ['memory', 'childhood', 'remember', 'nostalgic']);

  add('boredom', 'general', 'boredom and a change of pace',
    [/\b(?:i am bored|nothing to do|every day feels the same|need something fun|stuck in a rut|bored out of my mind)\b/],
    ['We can find something with a little more texture than another identical hour.', 'Boredom can be about wanting stimulation, company, or a change of scene.', 'Let us find the kind of change you are in the mood for.'],
    [['kind', 'Are you more in the mood to make something, move around, or talk?', 'Would you rather do something quiet, active, or social?'], ['energy', 'Do you have much energy to spend on it?', 'Are you restless or more low-energy bored?'], ['interest', 'What has held your attention recently, even briefly?', 'What used to be fun before it became routine?'], ['setting', 'Are you staying in or able to go somewhere?', 'What do you have nearby that you could use?'], ['company', 'Would you enjoy some company or time on your own?', 'Is there anyone you would like to include?'], ['next', 'What is the smallest version you could try now?', 'Which possibility sounds least like a chore?']],
    'Try a tiny change of medium or setting: make a quick sketch, put on an unfamiliar song, or message someone with a specific question. Choose what fits your energy.', ['bored', 'boredom', 'something fun', 'routine']);

  add('news', 'general', 'the news on your mind',
    [/\b(?:the news|current events|politics|the election|news headline|read an article|saw a headline|climate change)\b/],
    ['What have you been seeing in the news?', 'Tell me about the part of the story that caught your attention.', 'We can talk about your reaction to it; I do not have live news updates.'],
    [['story', 'What is the story about?', 'What did the report actually say?'], ['reaction', 'What was your reaction to it?', 'What about it caught your attention?'], ['uncertainty', 'Is there a part you are unsure is accurate?', 'What would you want to verify before drawing a conclusion?'], ['connection', 'Does it connect to something in your own life?', 'Why does this particular issue matter to you?'], ['perspective', 'Is there another perspective you are trying to understand?', 'What question would you ask someone who sees it differently?'], ['next', 'Would you rather talk through the issue or how it is affecting you?', 'What do you want to take away from thinking about it?']],
    'Separate what the report claims, what evidence it gives, and your reaction. Checking the original source and date can be a useful next step; I cannot verify live reporting here.', ['news', 'politics', 'headline', 'issue']);

  add('meaning', 'general', 'values and meaning',
    [/\b(?:meaning of life|my purpose|what matters to me|my values|who i want to be|existential|what makes a good life|religious beliefs|my faith)\b/],
    ['That is something we can explore without needing one final answer.', 'It is okay for your answer to be unfinished or changing.', 'Tell me which part of that question feels personal to you.'],
    [['question', 'What brought this question up for you?', 'What is the part you keep coming back to?'], ['moments', 'When does life feel most meaningful to you, even briefly?', 'What are some moments when you feel involved in something that matters?'], ['values', 'What do you find yourself caring about even when it is inconvenient?', 'What would you want your choices to stand for?'], ['tension', 'Are there values or expectations pulling in different directions?', 'What makes living that way difficult?'], ['people', 'Is there someone whose way of living you admire?', 'Who helps you think about these questions?'], ['next', 'What would a small expression of that value look like this week?', 'What would you like to make more room for?']],
    'Choose one value and one small action that would express it. You can explore what matters through ordinary choices without resolving every philosophical question first.', ['meaning', 'purpose', 'values', 'faith']);

  function normalize(t) {
    const aliases = { idk: 'i do not know', dunno: 'do not know', rn: 'right now', tbh: 'honestly', kinda: 'kind of', wanna: 'want to', gotta: 'have to', gonna: 'going to', coz: 'because', cuz: 'because', bc: 'because', ppl: 'people', freind: 'friend', freinds: 'friends', woried: 'worried', worryed: 'worried', lonley: 'lonely', definately: 'definitely', cant: 'cannot' };
    return t.replace(/\b(?:idk|dunno|rn|tbh|kinda|wanna|gotta|gonna|coz|cuz|bc|ppl|freind|freinds|woried|worryed|lonley|definately|cant)\b/g, w => aliases[w]).replace(/\bim\b/g, 'i am');
  }
  function isQuestion(t) { return /^(?:who|what|when|where|why|how|can you|could you|tell me|explain|define|translate|solve|calculate)\b/.test(t) || /\?\s*$/.test(t); }
  function requestKind(t) {
    if (/\b(?:do you care|are you real|are you a person|who are you|what are you|are you human|what do you remember|what is my|what did i|can you remember)\b/.test(t)) return null;
    if (/\b(?:should i|what (?:can|should|could) i do|help me (?:cope|decide|start|talk)|how (?:can|do) i (?:feel|talk|start|cope|deal|make friends)|what would you do)\b/.test(t)) return 'advice';
    if (/\b(?:overreact|too sensitive|makes sense|is it (?:okay|normal|wrong) to feel|like me|love me|about me|think of me)\b/.test(t)) return null;
    if (/^(?:what do you think|how (?:do|can) i feel)\b/.test(t)) return null;
    if (/^(?:could|can|is|does)\b.*\b(?:cancer|disease|symptoms?|infection|medication|poison|toxic|safe to eat)\b/.test(t)) return 'information';
    if (/^what (?:year|time|date|price|percentage|country|city|capital)\b/.test(t) || /^why (?:is|are|does|do) (?!i\b|my\b|he\b|she\b|they\b|we\b)/.test(t)) return 'information';
    if (/^(?:who (?:is|was|won|invented)|what (?:is|are|was|were|does)|when (?:is|was|did|will)|where (?:is|are)|how (?:does|do|many|much)|explain\b|define\b|translate\b|solve\b|calculate\b|can you (?:explain|write|solve|translate|calculate|tell me (?:who|what|when)))\b/.test(t)) return 'information';
    return null;
  }
  function validationKind(t) {
    if (/\b(?:he|she|they|my \w+) (?:said|says|asked|asks|wonders)\b/.test(t) && !/\bi (?:feel|am worried|am upset|am scared)\b/.test(t)) return null;
    if (/\b(?:sorry (?:for|if i am|if i'm) (?:bothering|dumping|rambling|talking)|this (?:sounds|is) stupid|i sound stupid|sorry i keep talking|i do not want to be a burden|i do not know if i should talk about this)\b/.test(t)) return 'disclosure';
    if (/\b(?:am i overreacting|maybe i am overreacting|am i (?:being )?too sensitive|is it (?:okay|normal|wrong|weird) (?:to feel|that i feel)|not sure (?:if )?(?:my feelings|that makes sense)|i do not know if that makes sense|maybe i am being dramatic)\b/.test(t)) return 'feelings';
    if (/\b(?:not sure i (?:can|am good enough|will manage)|i doubt i can|what if i mess (?:it|everything) up|maybe i cannot do it|scared i will mess up)\b/.test(t)) return 'ability';
    return null;
  }
  const validations = {
    disclosure: ['You do not have to apologize for putting this into words.', 'You can take up room in this conversation, even if the thought is unfinished.', 'It is okay to explain it in your own way. It does not need to sound polished.'],
    feelings: ['Your feelings are worth taking seriously, even while you work out what happened.', 'You can acknowledge the feeling without having to prove that every interpretation is right.', 'Having a reaction does not mean you have to judge yourself for it. We can look at the situation with some care.'],
    ability: ['Being unsure does not mean you are incapable.', 'You do not have to feel completely confident before taking a small step.', 'The doubt is one part of what you are experiencing; it is not a prediction of the outcome.']
  };
  function extract(raw, t, id) {
    const fields = {};
    const put = (key, re) => { const m = raw.match(re); if (m) fields[key] = clean(m[1] || m[0], 140).replace(/\s+(?:today|yesterday|tomorrow|tonight)\b.*$/i, ''); };
    if (id === 'family_life') put('situation', /\bmy (?:parents|family) (?:keep|always|never|want|expect|think|say|make|treat|do not|does not|are)\b[^.!?;]{2,140}/i);
    if (id === 'workload') put('load', /\b(?:too much work|work keeps piling up|workload|working overtime|back.to.back meetings)\b[^.!?;]{0,100}/i);
    if (id === 'money') put('pressure', /\bsaving (?:up )?for\s+([^.!?;]{2,100})/i);
    if (id === 'games') put('game', /\b(Minecraft|Roblox|Fortnite|Stardew(?: Valley)?|Valorant|chess|Dungeons and Dragons|D&D)\b/i);
    if (id === 'music') put('music', /\b(?:listening to|playing|learning)\s+([^.!?,;]{2,70})/i);
    if (id === 'screen_stories' || id === 'reading') put('title', /\b(?:watching|watched|reading|read)\s+([^.!?,;]{2,70})/i);
    if (id === 'screen_stories' || id === 'reading') put('title', /^(?:it (?:was|is)(?: in)?|the (?:movie|book|show) (?:is|was))\s+([^.!?,;]{2,70})/i);
    if (id === 'screen_stories') put('reaction', /\b(?:the ending|the film|the show|it) (?:confused|surprised|bored|excited|moved|disappointed) me\b[^.!?;]{0,60}/i);
    if (id === 'food') put('dish', /\b(?:cooking|baking|made|making|ate)\s+([^.!?,;]{2,70})/i);
    if (id === 'pets') put('pet', /\bmy\s+((?:dog|cat|puppy|kitten|pet|rabbit|hamster|parrot)(?:\s+(?:is called|is named|named)\s+[A-Z][a-z]+)?)/i);
    if (id === 'exercise') put('activity', /\b(running|swimming|cycling|a run|the gym|my workout)\b/i);
    if (id === 'travel') put('place', /\b(?:traveling to|travelling to|trip to|vacation in|holiday in)\s+([^.!?,;]{2,70})/i);
    if (id === 'creativity') put('project', /\b(?:writing|working on|making)\s+([^.!?,;]{2,70})/i);
    if (id === 'procrastination') put('task', /\b(?:putting off|procrastinating on|avoiding)\s+([^.!?,;]{2,70})/i);
    if (id === 'decision') put('options', /\b(?:between)\s+([^.!?;]{2,140})/i);
    if (id === 'learning') put('subject', /\b(?:learning|studying|understand)\s+([^.!?,;]{2,70})/i);
    if (id === 'sports') put('sport', /\b(hockey|football|basketball|soccer|baseball)\b/i);
    if (id === 'technology') put('observed', /\b(?:it|the app|my \w+) (?:keeps crashing|will not turn on|won't turn on|is frozen|shows an error)[^.!?;]{0,60}/i);
    if (/\b(?:with my|with a friend|by myself|on my own)\b/.test(t) && cards[id]?.stages.some(s => s.slot === 'company')) put('company', /\b(with (?:my |a )?[^.!?;]{2,60}|by myself|on my own)/i);
    if (cards[id]?.stages.some(s => s.slot === 'goal')) put('goal', /\bI (?:want|hope|am trying) to\s+([^.!?;]{2,120})/i);
    if (cards[id]?.stages.some(s => s.slot === 'wish')) put('wish', /\bI (?:wish|want them to|hope they)\s+([^.!?;]{2,120})/i);
    if (cards[id]?.stages.some(s => s.slot === 'pattern') && /\b(?:every time|always|often|only once|the first time|for a while)\b/.test(t)) fields.pattern = clean(raw,140);
    put('origin', /\b([^.!?;]{0,45}(?:introduced me to it|got me into it))\b/i);
    return fields;
  }
  function relatedTopic(t) {
    const groups = [['screen_stories', /\b(?:movie|film|show|series|anime|plot|ending)\b/], ['reading', /\b(?:book|novel|chapter|author)\b/], ['games', /\b(?:game|gaming|minecraft|roblox)\b/], ['music', /\b(?:music|song|album|band|playlist)\b/], ['food', /\b(?:food|cook|cooking|recipe|cake)\b/], ['technology', /\b(?:computer|phone|laptop|error|code|device)\b/], ['family_life', /\b(?:parents|family|home)\b/]];
    return groups.find(([, re]) => re.test(t))?.[0] || null;
  }
  function stats() { return { topics: Object.keys(cards).length, openingLines: Object.values(cards).reduce((n, c) => n + c.openings.length, 0), followupQuestions: Object.values(cards).reduce((n, c) => n + c.stages.reduce((m, s) => m + s.questions.length, 0), 0) }; }
  return { cards, clean, quote, normalize, isQuestion, requestKind, validationKind, validations, extract, stats, relatedTopic };
});
