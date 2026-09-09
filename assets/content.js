/* Human-written conversation material. Edit this file to change Still's voice.
   No model, remote service, training data, or generated runtime text. */
(function (root) {
  'use strict';
  const CONTENT = {
    version: 1,
    welcome: "You don't have to have it all figured out to start.\n\nWhat's taking up space in your head today?",
    starters: ["I'm overthinking something", "I just need to vent", "I feel stuck", "Something good happened"],
    topics: {
      school: {
        label: 'School & expectations',
        words: ['school', 'exam', 'test', 'quiz', 'midterm', 'homework', 'studying', 'studied', 'study', 'teacher', 'grades', 'grade', 'college', 'university', 'class', 'assignment', 'chemistry', 'physics', 'calculus', 'biology'],
        opening: "What's been happening with school?",
        reflections: ["There's the schoolwork itself, and then there's what the result might mean to you. Those can feel like two different loads.", "A grade can matter without having to say everything about you.", "You don't have to pretend school pressure is easy just because other people deal with it too."],
        questions: [
          ['school-pressure', "What's weighing on you most: the work itself, the result, or someone else's expectations?", ['The work itself', 'The result', "Other people's expectations"]],
          ['school-meaning', "What are you afraid a disappointing result would mean?", ["That I'm not capable", 'Letting someone down', 'Losing an opportunity']],
          ['school-control', 'Which part is still in your hands, even if the outcome is not?', []],
          ['school-support', 'What would make the next part more manageable?', ['A clearer plan', 'Some help', 'A proper break']],
          ['school-fair', 'What would a fair expectation of yourself look like this week?', []],
          ['school-perspective', 'If someone you cared about were in your position, what would you want them to remember?', []]
        ],
        step: 'You could pick one small topic to review, ask one specific question, or take a break before deciding. Which would help most?',
        steps: ['Review one topic', 'Ask for help', 'Take a break']
      },
      work: {
        label: 'Work & pressure', words: ['work', 'job', 'boss', 'manager', 'coworker', 'colleague', 'deadline', 'career', 'shift', 'fired', 'office'],
        opening: "What's been happening at work?",
        reflections: ["Work can take up more room in your head than the hours you spend there.", "Being able to keep going doesn't mean the current demands are sustainable.", "It can be hard to separate doing your job well from feeling responsible for everything."],
        questions: [
          ['work-load', 'What feels most difficult: the workload, the people, or uncertainty about what comes next?', ['The workload', 'The people', 'The uncertainty']],
          ['work-expectations', 'Which expectations have actually been stated, and which ones are you having to guess?', []],
          ['work-boundary', 'What is one demand you wish you could question or put a limit on?', []],
          ['work-support', 'Who could help you understand your options without deciding for you?', []],
          ['work-enough', 'What would doing enough look like, as opposed to doing everything?', []]
        ],
        step: 'A starting point could be clarifying one priority, writing down a boundary, or asking for help with one task. What fits your situation?',
        steps: ['Clarify one priority', 'Write down a boundary', 'Ask for help']
      },
      relationships: {
        label: 'Relationships & connection', words: ['friend', 'friends', 'friendship', 'boyfriend', 'girlfriend', 'partner', 'husband', 'wife', 'relationship', 'dating', 'breakup', 'break up', 'broke up', 'crush', 'ignored', 'rejected', 'rejection', 'texted', 'reply', 'argument', 'argued'],
        opening: 'What happened between you and them?',
        reflections: ["It matters how you're treated. Understanding their side doesn't have to erase your own.", "Caring about someone can make uncertainty with them feel especially difficult.", "You can want closeness and still need some things to change.", "We can make room for what hurt without having to decide what kind of person they are."],
        questions: [
          ['rel-hurt', 'What part of the interaction has stayed with you?', []],
          ['rel-need', 'What did you need from them in that moment?', ['To be heard', 'Some reassurance', 'Respect for a boundary']],
          ['rel-known', 'What do you know from what happened, and what are you having to guess about their intentions?', []],
          ['rel-say', 'If you could say one honest sentence to them without having to solve everything, what would it be?', []],
          ['rel-change', 'What would need to change for this to feel better for you?', []],
          ['rel-pattern', 'Does this feel like one difficult moment, or something that keeps happening?', ['One difficult moment', 'A pattern', "I'm not sure yet"]]
        ],
        step: 'You could draft a message without sending it, name a boundary for yourself, or give yourself some time before responding. Which feels useful?',
        steps: ['Draft a message', 'Name a boundary', 'Take some time']
      },
      family: {
        label: 'Family & expectations', words: ['mother', 'father', 'mom', 'mum', 'dad', 'parents', 'parent', 'sister', 'brother', 'family', 'grandmother', 'grandfather', 'grandma', 'grandpa'],
        opening: "What's been going on in your family?",
        reflections: ["Someone can matter to you and still hurt or disappoint you. Both can be true.", "Your experience doesn't have to match the version everyone else in the family tells.", "Wanting approval from family can make it especially hard to work out what you want for yourself."],
        questions: [
          ['family-understand', 'What do you wish they understood about your experience?', []],
          ['family-expect', 'What do they seem to expect of you, and how does that compare with what you want?', []],
          ['family-safe', 'How does it usually go when you disagree or express a need?', []],
          ['family-role', 'Is there a role you feel expected to play in your family?', []],
          ['family-need', 'What would support from them look like in a concrete way?', []]
        ],
        step: 'If it feels safe, you could write one thing you want them to understand. You do not have to share it. Would that help, or would some space help more?',
        steps: ['Write it for myself', 'Take some space', 'Something else']
      },
      selfworth: {
        label: 'The way you see yourself', words: ['worthless', 'failure', 'not good enough', 'unlovable', 'stupid', 'hate myself', 'useless', 'ugly', 'insecure', 'confidence', 'self esteem', 'ashamed', 'shame', 'loser', 'disappointed in myself'],
        opening: 'What happened that brought this view of yourself forward?',
        reflections: ["That sounds like a painful way to be speaking to yourself. We can look honestly at what happened without turning it into a verdict on your whole worth.", "A feeling can be very convincing without being a complete account of who you are.", "You don't have to jump from self-criticism to loving everything about yourself. A fairer description is a place to start.", "You can take responsibility for something without deciding that it makes you irredeemable."],
        questions: [
          ['self-trigger', 'Was there a particular moment that set off this thought?', []],
          ['self-voice', 'Does this sound like your own standard, or something you learned to expect from someone else?', []],
          ['self-specific', 'Can we make the criticism more specific: what do you think you did or failed to do?', []],
          ['self-fair', 'What would be a more accurate description that includes the difficulty without attacking you?', []],
          ['self-friend', 'Would you use the same words for someone you cared about in this situation?', ['Probably not', 'Maybe', "I don't know"]]
        ],
        step: 'Try writing one factual sentence about what happened, without words like “always,” “never,” or “worthless.” What would it say?',
        steps: []
      },
      loneliness: {
        label: 'Feeling disconnected', words: ['lonely', 'loneliness', 'alone', 'isolated', 'left out', 'no friends', 'nobody cares', 'no one cares', 'nobody likes', 'no one likes', 'everyone hates', 'nobody loves'],
        opening: 'What has feeling disconnected been like for you lately?',
        reflections: ["Feeling disconnected can hurt even when there are people around you.", "Wanting to be known and included is an understandable need.", "Feeling unwanted is painful. It also doesn't give us a reliable view of what every person thinks of you.", "We don't have to solve your whole social life to take the feeling seriously."],
        questions: [
          ['lonely-kind', 'Is it more about having nobody around, or not feeling understood by the people who are?', ['Nobody around', 'Not feeling understood', 'A bit of both']],
          ['lonely-moment', 'When does the feeling tend to get loudest?', []],
          ['lonely-miss', 'What kind of connection do you miss most?', ['Everyday company', 'Being really understood', 'Feeling included']],
          ['lonely-person', 'Is there anyone you feel even a little more at ease with?', []],
          ['lonely-ease', 'What makes reaching out difficult right now?', []]
        ],
        step: 'A small step could be sending a low-pressure message to someone safe, or spending time in a familiar shared space. Does either feel within reach?',
        steps: ['Send a simple message', 'Be around people', 'Neither feels doable yet']
      },
      loss: {
        label: 'Loss & missing someone', words: ['died', 'death', 'grief', 'grieving', 'passed away', 'funeral', 'bereaved', 'miss them', 'miss him', 'miss her', 'lost my dog', 'lost my cat'],
        opening: 'What would you like me to know about what you have lost?',
        reflections: ["You don't have to find a positive meaning in this for your feelings to deserve room.", "There isn't a particular way you have to feel here.", "Missing someone can show up in ordinary moments, not just the big ones.", "Talking about this doesn't have to turn into trying to move past it."],
        questions: [
          ['loss-now', 'What feels most present today: missing them, the circumstances, or something else?', []],
          ['loss-memory', 'Is there something about them you would like to tell me?', []],
          ['loss-understand', 'What do you wish the people around you understood about this?', []],
          ['loss-day', 'What has getting through an ordinary day been like?', []],
          ['loss-company', 'Who could be with you in this without asking you to feel differently?', []]
        ],
        step: 'Would it help to write down a memory, let someone know today is difficult, or simply leave some room to rest?',
        steps: ['Write down a memory', 'Tell someone today is hard', 'Leave room to rest']
      },
      rest: {
        label: 'Energy & overwhelm', words: ['tired', 'exhausted', 'burnout', 'burned out', 'burnt out', 'sleep', 'sleeping', 'insomnia', 'overwhelmed', 'too much', 'drained', 'no energy', 'worn out'],
        opening: 'What has been taking the most out of you?',
        reflections: ["You don't have to reach a breaking point before your need for rest matters.", "Having limits is part of being human, not proof that you aren't trying.", "When a lot is demanding your attention, even small things can feel heavy.", "A break does not have to solve everything to be worth taking."],
        questions: [
          ['rest-load', 'Is the tiredness more physical, mental, emotional, or a mix?', ['Mostly physical', 'Mostly mental', 'A mix of everything']],
          ['rest-demand', 'What is asking the most of you right now?', []],
          ['rest-less', 'What could be a little smaller, later, or less perfect?', []],
          ['rest-need', 'What kind of rest sounds appealing, even if it feels hard to make room for?', []],
          ['rest-help', 'Is there one thing someone else could take off your plate?', []]
        ],
        step: 'You could put one non-urgent task aside, get something to drink, or take a few minutes away from a demand. What would ease things a little?',
        steps: ['Set one task aside', 'Get a drink', 'Take a short break']
      },
      worry: {
        label: 'Worry & overthinking', words: ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'scared', 'afraid', 'panic', 'panicking', 'overthink', 'overthinking', 'what if', 'stressed', 'stress', 'catastrophizing'],
        opening: 'What is the worry circling around?',
        reflections: ["Uncertainty can be difficult to sit with. We don't have to pretend the outcome is guaranteed to look at what's happening now.", "Thinking about something repeatedly doesn't always give you new information, even when it feels urgent to work it out.", "We can take the worry seriously without treating its worst prediction as a fact.", "You don't have to solve every possible future before you are allowed a moment of relief."],
        questions: [
          ['worry-prediction', 'What is the specific thing you are afraid might happen?', []],
          ['worry-known', 'What do you know for sure so far, separate from what might happen?', []],
          ['worry-control', 'Is there a useful action available now, or is this mostly waiting with uncertainty?', ['There is an action', 'Mostly waiting', 'A bit of both']],
          ['worry-help', 'What has made a similar uncertain moment even slightly easier before?', []],
          ['worry-cost', 'What is the worrying keeping you from doing or enjoying right now?', []]
        ],
        step: 'We can name one thing you can act on, or pause and notice your surroundings for a moment. Which feels better?',
        steps: ['Name one action', 'A grounding pause']
      },
      stuck: {
        label: 'Feeling stuck', words: ['stuck', 'procrastinating', 'procrastinate', 'motivation', 'unmotivated', 'decision', 'decide', 'choice', 'purpose', 'direction', 'lost', 'future', 'cannot start'],
        opening: 'What feels stuck: getting started, choosing a direction, or believing it will matter?',
        reflections: ["Being stuck can mean several different things. We can get more specific without calling it laziness.", "You don't have to see the whole route before deciding what is worth trying next.", "A decision can be thoughtful without being certain.", "Wanting change and finding it difficult to move can exist at the same time."],
        questions: [
          ['stuck-obstacle', 'What happens when you try to take the first step?', []],
          ['stuck-cost', 'What feels risky about moving forward?', []],
          ['stuck-want', 'If nobody else had an opinion about it, what would you want?', []],
          ['stuck-small', 'What is the smallest experiment you could try without committing to everything?', []],
          ['stuck-information', 'What information would actually help you choose?', []]
        ],
        step: 'What is a version of the first step that takes only a few minutes and does not commit you to everything?',
        steps: []
      },
      joy: {
        label: 'Something worth noticing', words: ['happy', 'proud', 'excited', 'relieved', 'good news', 'something good', 'great day', 'passed', 'succeeded', 'won', 'achievement', 'celebrate', 'grateful'],
        opening: 'Tell me what happened. What feels good about it?',
        reflections: ["That sounds like something worth giving a little room to.", "You don't have to rush past something good and immediately look for the next task.", "A good moment doesn't have to be impressive to anyone else to matter to you.", "It is okay to enjoy this without making it into a demand to feel good all the time."],
        questions: [
          ['joy-meaning', 'What makes this meaningful to you?', []],
          ['joy-credit', 'Is there something you did that you want to give yourself credit for?', []],
          ['joy-share', 'Who might enjoy hearing about this?', []],
          ['joy-remember', 'What part of this moment would you like to remember?', []],
          ['joy-next', 'How would you like to mark it, even in a small way?', []]
        ],
        step: 'You could tell someone, write a sentence to remember it by, or take a moment to enjoy it. What would fit?',
        steps: ['Tell someone', 'Write it down', 'Enjoy the moment']
      },
      general: {
        label: 'Making sense of things', words: [], opening: 'Which part would you like to start with?',
        reflections: ["You don't have to tidy this up before putting it into words.", "We can stay with your experience without rushing to a verdict.", "It is okay if there are several feelings in this, even ones that don't seem to fit together.", "You can take your time deciding what this means to you."],
        questions: [
          ['general-now', 'What part feels most important to understand right now?', []],
          ['general-need', 'What do you wish were different?', []],
          ['general-understand', 'What do you wish someone understood about this?', []],
          ['general-moment', 'Was there a particular moment that brought this up today?', []],
          ['general-space', 'What have you not had much room to say about it?', []],
          ['general-next', 'Would it help to stay with the feeling, or think about what comes next?', ['Stay with the feeling', 'Think about what comes next']]
        ], step: 'What would make the next hour a little easier, without needing to fix the whole situation?', steps: []
      }
    },
    emotions: {
      sad: { words: ['sad', 'sadness', 'down', 'low', 'miserable', 'crying', 'cried', 'heartbroken', 'upset', 'depressed'], lines: ['That sounds painful.', 'It sounds like this has been weighing on you.', 'You do not have to minimize how much this hurts.'] },
      anxious: { words: ['anxious', 'nervous', 'worried', 'scared', 'afraid', 'stressed', 'panicking'], lines: ['That sounds unsettling.', 'It sounds like there is a lot of uncertainty in this for you.', 'The worry sounds difficult to carry.'] },
      angry: { words: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'pissed', 'resentful'], lines: ['It sounds like this has really frustrated you.', 'There is room to name the anger without deciding yet what to do with it.', 'What happened seems to have touched a sore point.'] },
      hurt: { words: ['hurt', 'rejected', 'betrayed', 'dismissed', 'ignored', 'unwanted'], lines: ['That sounds hurtful.', 'It sounds like the way this happened really mattered to you.', 'Wanting your experience to be taken seriously is understandable.'] },
      guilty: { words: ['guilty', 'ashamed', 'regret', 'embarrassed', 'shame'], lines: ['This sounds difficult to sit with.', 'We can look at what happened honestly without piling more shame onto it.', 'You can care about the impact of your actions and still treat yourself fairly.'] },
      tired: { words: ['tired', 'exhausted', 'drained', 'overwhelmed', 'burned out', 'burnt out'], lines: ['That sounds like a lot to carry.', 'It sounds like your energy is being stretched.', 'Needing some relief is understandable.'] },
      lonely: { words: ['lonely', 'isolated', 'left out'], lines: ['Feeling disconnected can really hurt.', 'It sounds like you are missing a sense of connection.', 'Wanting company or understanding is a reasonable need.'] },
      happy: { words: ['happy', 'proud', 'excited', 'relieved', 'grateful', 'delighted'], lines: ['That sounds good to have experienced.', 'There is room here for the good things, too.', 'It sounds like this matters to you in a good way.'] }
    },
    listening: [
      "You can say more without having to turn it into a lesson or a plan.",
      "We can leave the advice aside and stay with what this has been like for you.",
      "There's room for the messy or contradictory parts, too.",
      "You don't need to make a perfectly argued case for your feelings.",
      "If there is more to it, you can keep going at your own pace.",
      "You don't have to finish the thought neatly.",
      "We can leave some things unresolved for a moment.",
      "It is okay to put the part you haven't said anywhere else into words here. Share only what feels comfortable."
    ],
    acknowledgements: ["That gives me a clearer picture.", "That seems like an important part of it.", "Let's stay with that part for a moment.", "We can work from there.", "Thank you for putting that into words.", "That helps me follow what you mean."],
    grounding: [
      { text: 'If it feels comfortable, look around and name five things you can see. A shorter list is fine; you can skip any sense.', chips: ['Skip this sense', 'Stop the exercise'] },
      { text: 'Now notice four things you can physically feel, such as the chair beneath you or fabric against your hand. Keep your attention outside yourself if that is more comfortable.', chips: ['Skip this sense', 'Stop the exercise'] },
      { text: 'Name three sounds you can hear. Quiet sounds count, and skipping is fine.', chips: ['Skip this sense', 'Stop the exercise'] },
      { text: 'Notice two smells, if any are available. You can also name two familiar smells or skip this part.', chips: ['Skip this sense', 'Stop the exercise'] },
      { text: 'Finally, notice one taste, or name one thing around you that feels familiar.', chips: ['Skip this sense', 'Stop the exercise'] }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
  else root.StillContent = CONTENT;
})(typeof globalThis !== 'undefined' ? globalThis : this);
