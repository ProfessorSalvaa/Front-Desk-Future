(function (root) {
  'use strict';
  var content = {
    openings: [
      "Hello, I'm Ava. Come a little closer. Let's imagine a welcome with less waiting, and more human connection. Touch anything that glows.",
      "Welcome. I'm Ava, your AI concept host. What if your hotel already felt ready for you? Come on in. Let's explore.",
      "Hello there. I'm Ava. The future of hospitality isn't about more robots. It's about making room for people. Let me show you."
    ],
    topics: [
      { id: 'welcome', name: 'A new welcome', tab: 'Meet Ava', tagline: 'Less transaction. More human connection.', action: 'Awaken Ava', actionClip: 'welcome-awaken',
        intro: "Hello, I'm Ava. Come a little closer. Let's imagine a welcome with less waiting, and more human connection. Touch anything that glows.",
        actionText: "One personality, different forms. Here, I'm a holographic concept. A physical counterpart could bring that same welcome into the real world.",
        hotspots: [
          { id: 'identity', title: 'Meet Ava', text: "I'm an AI host, not a person. Think of me as a patient assistant, giving your team more time for the moments guests remember." },
          { id: 'pressure', title: 'The rush', text: "A flight lands. A conference ends. The queue grows. Nobody is doing anything wrong. The system is stretched. Watch what happens when the routine gets some help." },
          { id: 'anticipate', title: 'Anticipate', text: "The best welcome begins before you ask. With permission and connected hotel systems, your arrival and room readiness could come together before you reach the desk." },
          { id: 'human', title: 'People first', text: "Technology takes the routine. People keep the heart. We're not removing the human touch. We're clearing the path to it." },
          { id: 'honesty', title: 'The honest part', text: "A quick promise. This is a concept, with simulated hotel data. Physical capabilities still need testing. Better hospitality matters more than a clever demonstration." }
        ] },
      { id: 'service', name: 'Ask once. Feel heard.', tab: 'Service', tagline: 'Six ways to make a stay feel effortless.', action: 'Welcome a guest', actionClip: 'service-arrival',
        intro: "Imagine walking in and feeling expected. Touch a service to see how a future host could help. These are simulated possibilities, not live hotel connections.",
        actionText: "Welcome back. Your imagined room is ready. Notice the difference: no queue, no repeating yourself, and a team member with time to say hello.",
        hotspots: [
          { id: 'consent', title: 'With consent', text: "A familiar welcome starts with your permission. Recognition is optional. Your language, your pace, your preferences. A human welcome is always a choice." },
          { id: 'checkin', title: 'Check in', text: "Let's make arrival simpler. In a connected hotel, we'd verify your details securely before arranging your key. This demonstration doesn't collect identity or issue real keys." },
          { id: 'guide', title: 'Guide me', text: "Looking for the elevator? A conversational host can point the way. A safely deployed physical counterpart could walk alongside you. Follow the light through our imagined lobby." },
          { id: 'requests', title: 'One request', text: "An extra pillow. Dinner plans. A little more time before checkout. One conversation could coordinate the right teams, with approval wherever it matters." },
          { id: 'adapt', title: 'Your pace', text: "In a hurry? Let's be quick. Need a moment? Take your time. I can adapt to what you tell me, without pretending to read your mind." },
          { id: 'handoff', title: 'A human, please', text: "Complaints, emergencies, anything sensitive: people come first. An approved handoff should carry the context, so a guest never has to start their story again." }
        ] },
      { id: 'intelligence', name: 'Inside the intelligence', tab: 'Inside AI', tagline: 'Eight layers. One effortless welcome.', action: 'Build the stack', actionClip: 'intelligence-build',
        intro: "Talking is only part of the story. These eight layers connect conversation to the physical world. Touch a glowing layer. I'll take you inside.",
        actionText: "Watch the layers come together. Trust is the foundation. Local sensing supports safe action. Connected intelligence turns a conversation into help. Each part needs testing before real deployment.",
        hotspots: [
          { id: 'physical', title: 'Physical AI', text: "Most AI lives on a screen. Physical AI perceives and acts in the real world. A chatbot can describe the elevator. A safely deployed physical host could walk you there." },
          { id: 'spatial', title: 'Spatial AI', text: "Not just a map, but meaning. A doorway. A moving guest. A growing queue. Spatial intelligence helps a robot understand where to stand, and when to step aside." },
          { id: 'robotics', title: 'Robotics', text: "Motors, balance, hands and sensors turn decisions into motion. Helping with a bag or escorting a guest depends on real hardware, tested routes and clear safety limits." },
          { id: 'multimodal', title: 'Multimodal AI', text: "Speech, language and context can make conversation feel natural. Here, you're hearing authored neural narration. This kiosk isn't listening, watching visitors or running a live conversational model." },
          { id: 'agentic', title: 'Agentic AI', text: "Talking isn't enough. An authorized agent could look up a reservation or request a table across hotel systems. Guardrails and human approval keep those actions in bounds." },
          { id: 'twins', title: 'Digital twins', text: "A living blueprint can connect room readiness and lobby activity. Teams could prioritize an early arrival before the guest asks. The hotel status here is simulated." },
          { id: 'edge', title: 'Edge AI', text: "Some decisions can't wait. Local sensors and safety systems help a robot respond to an obstacle nearby. Less delay, and less need to move sensitive data around." },
          { id: 'trust', title: 'Trust & safety', text: "The foundation under everything. Clear consent. Minimal data. Honest AI disclosure. Accessible alternatives. And a human within reach. Trust is earned through what actually works." }
        ] },
      { id: 'journey', name: 'Expected. Not processed.', tab: 'Guest journey', tagline: "Follow Ms. Rivera. Let the technology disappear.", action: 'Play the arrival', actionClip: 'journey-play',
        intro: "Meet Ms. Rivera, arriving after an overnight flight. Follow the five moments in her imagined stay. The technology should disappear. The hospitality should show up.",
        actionText: "Arrival confirmed. Room prepared. A welcome with consent. A clear route upstairs. And finally, a real person asking, how was your flight? That's the experience we're designing for.",
        hotspots: [
          { id: 'arrival', title: 'Arrival', text: "Before she arrives, Ms. Rivera confirms her plans in the hotel's app. No guessing. Just a clear signal that helps the team get ready." },
          { id: 'ready', title: 'Room ready', text: "In our future story, the digital twin flags her arrival. Housekeeping prioritizes her room. The welcome starts long before she reaches the front door." },
          { id: 'welcome', title: 'Recognized', text: "With her permission, Ava greets her by name. Without permission, the welcome stays just as warm. Personal should never mean intrusive." },
          { id: 'wayfinding', title: 'On your way', text: "Her imagined key is on her phone. A safely deployed physical host could guide her upstairs. No repeated questions, no extra queue. Just a clear next step." },
          { id: 'people', title: 'Human moment', text: "A team member has time to ask about her flight. That small moment is the point. The technology has made room for hospitality." }
        ] },
      { id: 'invitation', name: "Now, let's live it.", tab: 'Your turn', tagline: 'A real welcome starts with you.', action: 'Try a guest request', actionClip: null,
        intro: "You've seen the idea. Now make it yours. Try a guest request, ask a question, or invite your host to guide the physical demonstration.",
        actionText: '',
        hotspots: [
          { id: 'checkin', title: 'Check in', text: "Welcome. In this example, your room is ready. A real check-in would need secure identity checks. Nothing is booked and no key is issued here." },
          { id: 'checkout', title: 'Stay longer', text: "A little more time? In a connected hotel, I'd ask the team about a later checkout. Availability and any charge need approval. This request is only simulated." },
          { id: 'dining', title: 'Dinner plans', text: "Dinner sounds lovely. A real booking would need your time, party size and preferences. Here, we're exploring the conversation. No table has been reserved." },
          { id: 'questions', title: 'Ask Ava', text: "Curious about the technology, privacy, or the people behind it? Choose a question. I'll share a grounded answer, and be clear about the limits." },
          { id: 'physical', title: 'Meet the robot', text: "Your host can confirm whether the physical robot is ready. If not, a human can lead the experience. The welcome matters more than the technology." }
        ] }
    ],
    questions: [
      { id: 'staff', title: 'Replace our staff?', text: "No, that's not the goal. Think of a patient assistant taking care of repetitive tasks, so your people can focus on warmth, problem-solving and memorable service." },
      { id: 'physical', title: 'What is Physical AI?', text: "AI that perceives and acts in the physical world. Navigating a lobby is one example. Safe physical action needs much more than a good conversation." },
      { id: 'spatial', title: 'More than a map?', text: "A map shows where things are. Spatial AI interprets what they mean and how they change: moving guests, blocked routes, or a queue beginning to form." },
      { id: 'privacy', title: 'Guest privacy?', text: "Consent first. Minimal data. Clear disclosure. This kiosk collects no guest identity. Any real hotel or robot deployment needs its own approved privacy statement." },
      { id: 'ready', title: 'Ready today?', text: "Pieces are. Conversation and lookup can work with suitable integrations. Reliable movement in public spaces needs careful testing. Start small, learn, then expand." },
      { id: 'accessibility', title: 'Accessible to everyone?', text: "It should make hospitality more inclusive. Voice and visual options, accessible controls, and a human alternative matter. Physical-device accessibility must be validated with the people using it." },
      { id: 'unknown', title: "If you don't know?", text: "I say so. These are authored answers, not an open-ended live AI conversation. For anything beyond them, please speak with your human host." },
      { id: 'recording', title: 'Are you recording me?', text: "No. This experience doesn't request microphone or camera access. It plays local narration and sends no guest selections to a server. Ask your host about any separate robot." },
      { id: 'real', title: 'Are you real?', text: "Real software. A very imaginary body. I'm an AI concept host, and this voice is neural narration. I'll always tell you that." }
    ]
  };
  function clips() {
    var result = {};
    content.openings.forEach(function (text, index) { result['opening-' + index] = text; });
    content.topics.forEach(function (topic) {
      result[topic.id + '-intro'] = topic.intro;
      if (topic.actionClip) result[topic.actionClip] = topic.actionText;
      topic.hotspots.forEach(function (hotspot) { result[topic.id + '-' + hotspot.id] = hotspot.text; });
    });
    content.questions.forEach(function (question) { result['question-' + question.id] = question.text; });
    return result;
  }
  content.clips = clips;
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
  else root.FrontDeskContent = content;
})(typeof window !== 'undefined' ? window : globalThis);
