/* vhs-frontend-example/app.js */

let ytPlayer = null;
let isPlayerReady = false;
let progressInterval = null;

const YOUTUBE_VIDEO_IDS = [
  "ScMzIvxBSi4", // Toto - Africa
  "fJ9rUzIMcZQ", // Queen - Bohemian Rhapsody
  "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
  "hT_nvWreIhg", // OneRepublic - Counting Stars
  "kJQP7kiw5Fk", // Luis Fonsi - Despacito
];

// Video Registry matching the categories in React app
const VIDEO_REGISTRY = {
  memes: [
    {
      name: 'Rick Roll vs Trololo',
      crew: 'dQw4w9WgXcQ',
      imposter: '2Z4m4lnjxkY',
      crewTitle: 'Never Gonna Give You Up',
      imposterTitle: 'Trololo Song'
    },
    {
      name: 'Numa Numa vs Keyboard Cat',
      crew: 'KmtzQCSh6xk',
      imposter: 'J---aiyznGQ',
      crewTitle: 'Numa Numa',
      imposterTitle: 'Keyboard Cat'
    }
  ],
  sports: [
    {
      name: 'Messi Goal vs Ronaldo Goal',
      crew: 'PSanjqYOM_4',
      imposter: 'sB1o1vO383g',
      crewTitle: 'Messi Iconic Goal',
      imposterTitle: 'Ronaldo Free Kick'
    },
    {
      name: 'Buzzer Beater vs Strikeout',
      crew: 'v2bEYOE_GJU',
      imposter: 'f7n6rOof-4Y',
      crewTitle: 'NBA Buzzer Beater',
      imposterTitle: 'Baseball Strikeout'
    }
  ],
  music: [
    {
      name: 'Thriller vs Billie Jean',
      crew: 'sOnqjkJTMaA',
      imposter: 'Zi_XLOBDo_Y',
      crewTitle: 'Thriller',
      imposterTitle: 'Billie Jean'
    },
    {
      name: 'Bohemian Rhapsody vs We Will Rock You',
      crew: 'fJ9rUzIMcZQ',
      imposter: '-tJYN-eG1zk',
      crewTitle: 'Bohemian Rhapsody',
      imposterTitle: 'We Will Rock You'
    }
  ]
};

// Global active round settings
let activeCrewVideoId = "dQw4w9WgXcQ";
let activeImposterVideoId = "2Z4m4lnjxkY";
let activeCrewTitle = "Never Gonna Give You Up";
let activeImposterTitle = "Trololo Song";
let isImposter = false;

function parseYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Load YouTube API script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player', {
    height: '100%',
    width: '100%',
    videoId: YOUTUBE_VIDEO_IDS[0],
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'fs': 0,
      'modestbranding': 1,
      'rel': 0,
      'showinfo': 0,
      'iv_load_policy': 3,
      'mute': 1
    },
    events: {
      'onReady': () => {
        isPlayerReady = true;
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  console.log(" Tape Suspect Mockup Initialized!");

  const recDot = document.getElementById('rec-dot');

  // REC light flashing animation
  setInterval(() => {
    if (recDot) {
      recDot.classList.toggle('active');
    }
  }, 600);

  // Read active room settings from localStorage
  const roomCode = localStorage.getItem('imposter_active_lobby_code') || 'SUSPECT-80S';
  const isHost = localStorage.getItem('imposter_active_lobby_is_host') === 'true';
  const settingsRaw = localStorage.getItem('imposter_active_lobby_settings');
  
  let settings = {
    isPublic: true,
    chatType: 'text',
    videoCategory: 'memes',
    crewUrl: '',
    imposterUrl: ''
  };
  
  if (settingsRaw) {
    try {
      settings = JSON.parse(settingsRaw);
    } catch (e) {
      console.error("Failed to parse active room settings", e);
    }
  }

  // Update Sleeve Code label
  const sleeveCodeEl = document.querySelector('.sleeve-code');
  if (sleeveCodeEl) {
    sleeveCodeEl.textContent = roomCode;
  }

  // Update OSD Camcorder Config menu
  const osdMenu = document.querySelector('.osd-menu');
  if (osdMenu) {
    osdMenu.innerHTML = `
      <div class="osd-menu-title">--- Camcorder Config ---</div>
      <div class="osd-menu-row">
        <span>VIDEO SRC:</span>
        <span style="color: var(--neon-yellow);">${settings.videoCategory.toUpperCase()}</span>
      </div>
      <div class="osd-menu-row">
        <span>CHAT TYPE:</span>
        <span style="color: var(--neon-yellow);">${settings.chatType.toUpperCase()}</span>
      </div>
      <div class="osd-menu-row">
        <span>VISIBILITY:</span>
        <span style="color: var(--neon-yellow);">${settings.isPublic ? 'PUBLIC' : 'PRIVATE'}</span>
      </div>
      <div class="osd-menu-row">
        <span>YOUR ROLE:</span>
        <span id="osd-role-value" style="color: var(--neon-green); font-weight: bold;">CREW</span>
      </div>
    `;
  }

  // Setup dynamic round role assignment and video selection
  function setupActiveRound() {
    // 35% chance to be the Suspect/Imposter
    isImposter = Math.random() < 0.35;
    
    // Update role display in OSD
    const osdRoleValue = document.getElementById('osd-role-value');
    if (osdRoleValue) {
      if (isImposter) {
        osdRoleValue.textContent = "SUSPECT";
        osdRoleValue.style.color = "var(--neon-magenta)";
      } else {
        osdRoleValue.textContent = "CREW";
        osdRoleValue.style.color = "var(--neon-green)";
      }
    }

    // Set overlays and titles
    const playOverlayText = document.querySelector('.osd-overlay-play span:first-child');
    if (playOverlayText) {
      if (isImposter) {
        playOverlayText.textContent = "⏵ PLAY (SUSPECT TAPE)";
        playOverlayText.style.color = "var(--neon-magenta)";
      } else {
        playOverlayText.textContent = "⏵ PLAY (CREW RECORDING)";
        playOverlayText.style.color = "var(--neon-green)";
      }
    }

    // Select Video IDs and Titles
    if (settings.videoCategory === 'custom') {
      const crewId = parseYoutubeId(settings.crewUrl) || "dQw4w9WgXcQ";
      const imposterId = parseYoutubeId(settings.imposterUrl) || "2Z4m4lnjxkY";
      
      activeCrewVideoId = crewId;
      activeImposterVideoId = imposterId;
      activeCrewTitle = "Custom Crew Tape";
      activeImposterTitle = "Custom Suspect Tape";
    } else {
      const category = settings.videoCategory || 'memes';
      const items = VIDEO_REGISTRY[category] || VIDEO_REGISTRY['memes'];
      const pair = items[Math.floor(Math.random() * items.length)];
      
      activeCrewVideoId = pair.crew;
      activeImposterVideoId = pair.imposter;
      activeCrewTitle = pair.crewTitle;
      activeImposterTitle = pair.imposterTitle;
    }
  }

  // Initial round setup
  setupActiveRound();

  // Expose role setter function to remote control switch
  window.resetRoundForLobby = setupActiveRound;

  // ── Gartic Avatar SVG Generator ────────────────────────────
  const AVATAR_COLORS = ['#ff0077', '#00f0ff', '#ffee00', '#00ff66', '#ff7700', '#aa00ff', '#ff00aa', '#00ffaa'];
  const AVATAR_BODIES = [
    '<circle cx="50" cy="50" r="35" fill="{color}" stroke="#000" stroke-width="4"/>',
    '<rect x="18" y="18" width="64" height="64" rx="15" fill="{color}" stroke="#000" stroke-width="4"/>',
    '<rect x="15" y="25" width="70" height="50" rx="8" fill="{color}" stroke="#000" stroke-width="4"/>' +
    '<circle cx="35" cy="50" r="10" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<circle cx="65" cy="50" r="10" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<circle cx="35" cy="50" r="4" fill="#fff"/>' +
    '<circle cx="65" cy="50" r="4" fill="#fff"/>',
    '<path d="M 50 15 C 25 15, 20 45, 20 75 C 40 85, 60 85, 80 75 C 80 45, 75 15, 50 15 Z" fill="{color}" stroke="#000" stroke-width="4"/>'
  ];
  const AVATAR_EYES = [
    '<circle cx="38" cy="42" r="8" fill="#fff" stroke="#000" stroke-width="3"/>' +
    '<circle cx="37" cy="42" r="3" fill="#000"/>' +
    '<circle cx="62" cy="42" r="8" fill="#fff" stroke="#000" stroke-width="3"/>' +
    '<circle cx="63" cy="42" r="3" fill="#000"/>',
    '<polygon points="22,38 46,38 42,48 26,48" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<polygon points="54,38 78,38 74,48 58,48" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<line x1="46" y1="41" x2="54" y2="41" stroke="#000" stroke-width="3"/>',
    '<rect x="22" y="36" width="56" height="12" rx="4" fill="#00f0ff" stroke="#000" stroke-width="3"/>' +
    '<line x1="26" y1="42" x2="74" y2="42" stroke="#fff" stroke-width="2" stroke-dasharray="4,2"/>',
    '<path d="M 28 35 L 46 40 M 72 35 L 54 40" stroke="#000" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="37" cy="46" r="5" fill="#000"/>' +
    '<circle cx="63" cy="46" r="5" fill="#000"/>'
  ];
  const AVATAR_MOUTHS = [
    '<path d="M 35 60 Q 50 72, 65 60" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>',
    '<circle cx="50" cy="62" r="6" fill="#000"/>',
    '<path d="M 35 60 L 40 65 L 45 60 L 50 65 L 55 60 L 60 65 L 65 60" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>',
    '<line x1="38" y1="62" x2="62" y2="62" stroke="#000" stroke-width="4" stroke-linecap="round"/>'
  ];
  const AVATAR_ACCESSORIES = [
    '<path d="M 24 45 C 24 20, 76 20, 76 45" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="17" y="42" width="10" height="16" rx="4" fill="#ff0077" stroke="#000" stroke-width="2.5"/>' +
    '<rect x="73" y="42" width="10" height="16" rx="4" fill="#ff0077" stroke="#000" stroke-width="2.5"/>',
    '<line x1="50" y1="20" x2="50" y2="8" stroke="#000" stroke-width="3"/>' +
    '<circle cx="50" cy="6" r="4" fill="#ffee00" stroke="#000" stroke-width="2"/>',
    '<rect x="23" y="6" width="32" height="12" fill="#fff" stroke="#000" stroke-width="2" transform="rotate(-10 23 6)"/>' +
    '<text x="26" y="14" font-size="5.5" font-family="monospace" fill="#000" font-weight="bold" transform="rotate(-10 23 6)">SUSPECT</text>',
    ''
  ];

  // Expose avatar generator globally or inside window so add player btn can use it
  window.getAvatarSVG = function(config) {
    const color = AVATAR_COLORS[config.colorIdx];
    const bodySvg = AVATAR_BODIES[config.bodyIdx].replace(/{color}/g, color);
    const eyesSvg = AVATAR_EYES[config.eyeIdx];
    const mouthSvg = AVATAR_MOUTHS[config.mouthIdx];
    const accSvg = AVATAR_ACCESSORIES[config.accIdx];

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        ${bodySvg}
        ${mouthSvg}
        ${eyesSvg}
        ${accSvg}
      </svg>
    `;
  };

  window.getRandomAvatarConfig = function() {
    return {
      colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
      bodyIdx: Math.floor(Math.random() * AVATAR_BODIES.length),
      eyeIdx: Math.floor(Math.random() * AVATAR_EYES.length),
      mouthIdx: Math.floor(Math.random() * AVATAR_MOUTHS.length),
      accIdx: Math.floor(Math.random() * AVATAR_ACCESSORIES.length)
    };
  };

  // Cosmetics mappings
  const VCR_SKIN_STYLES = {
    'vcr-midnight-chrome': {
      bg: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a16 100%)',
      border: '#8888ff',
      shadow: '#8888ff',
      textColor: '#8888ff',
      ledColor: '#8888ff'
    },
    'vcr-arctic-frost': {
      bg: 'linear-gradient(180deg, #c8d8e8 0%, #8899aa 100%)',
      border: '#ddeeff',
      shadow: '#aabbcc',
      textColor: '#88ddff',
      ledColor: '#88ddff'
    },
    'vcr-magma-deck': {
      bg: 'linear-gradient(180deg, #3a1010 0%, #1a0505 100%)',
      border: '#ff3300',
      shadow: '#ff3300',
      textColor: '#ff6633',
      ledColor: '#ff3300'
    },
    'vcr-cyber-punk': {
      bg: 'linear-gradient(180deg, #1a0028 0%, #0d0016 100%)',
      border: '#ff00ff',
      shadow: '#ff00ff',
      textColor: '#ff00ff',
      ledColor: '#ff00ff'
    },
    'vcr-military-ops': {
      bg: 'linear-gradient(180deg, #2a2a1a 0%, #1a1a0d 100%)',
      border: '#8a8a4a',
      shadow: '#8a8a4a',
      textColor: '#aaaa66',
      ledColor: '#aaaa66'
    },
    'vcr-vaporwave': {
      bg: 'linear-gradient(180deg, #2a1838 0%, #14081e 100%)',
      border: '#ee77ff',
      shadow: '#ee77ff',
      textColor: '#ee77ff',
      ledColor: '#ee77ff'
    }
  };

  const TAPE_SKIN_STYLES = {
    'tape-neon-noir': {
      bg: '#0a0a12', border: '#ff0077', shadow: '#ff0077',
      labelBg: 'linear-gradient(135deg, #1a0020, #0a0018)', labelBorder: '#ff0077', labelColor: '#ff0077'
    },
    'tape-retro-sunset': {
      bg: '#2b1800', border: '#ff8800', shadow: '#ff8800',
      labelBg: 'linear-gradient(135deg, #ff8800, #ff4400)', labelBorder: '#000', labelColor: '#fff'
    },
    'tape-glitch-core': {
      bg: '#0d0d1a', border: '#00f0ff', shadow: '#00f0ff',
      labelBg: 'linear-gradient(135deg, #001a22, #002233)', labelBorder: '#00f0ff', labelColor: '#00f0ff'
    },
    'tape-pastel-wave': {
      bg: '#2a1e3a', border: '#cc88ff', shadow: '#cc88ff',
      labelBg: 'linear-gradient(135deg, #eeddff, #ffddee)', labelBorder: '#aa66dd', labelColor: '#6633aa'
    },
    'tape-toxic-waste': {
      bg: '#0a1a0a', border: '#00ff66', shadow: '#00ff66',
      labelBg: 'linear-gradient(135deg, #001a00, #003300)', labelBorder: '#00ff66', labelColor: '#00ff66'
    },
    'tape-gold-standard': {
      bg: '#1a1500', border: '#ffd700', shadow: '#ffd700',
      labelBg: 'linear-gradient(135deg, #ffd700, #ffaa00)', labelBorder: '#000', labelColor: '#1a1000'
    }
  };

  const TAPE_LABELS = {
    'label-classified': '⛔ CLASSIFIED',
    'label-top-secret': '🔒 TOP SECRET',
    'label-home-video': '🏠 HOME VIDEO',
    'label-directors-cut': '🎬 DIR CUT',
    'label-evidence': '🔍 EVIDENCE',
    'label-bootleg': '💀 BOOTLEG'
  };

  // Render user's avatar
  const userAvatarDisplay = document.getElementById('user-avatar-display');
  if (userAvatarDisplay) {
    const savedConfig = localStorage.getItem('imposter_avatar_config');
    let config;
    if (savedConfig) {
      try { config = JSON.parse(savedConfig); } catch(e) {}
    }
    if (!config) {
      config = window.getRandomAvatarConfig();
    }
    userAvatarDisplay.innerHTML = window.getAvatarSVG(config);
  }

  // Render dummy avatar 1
  const dummyAvatar1 = document.getElementById('dummy-avatar-1');
  if (dummyAvatar1) {
    dummyAvatar1.innerHTML = window.getAvatarSVG(window.getRandomAvatarConfig());
  }

  // Load custom nickname from local storage if set
  const savedNickname = localStorage.getItem('imposter_nickname');
  const userTapeTitleEl = document.getElementById('user-tape-title');
  const usernameInputEl = document.getElementById('username-input');

  if (savedNickname) {
    if (userTapeTitleEl) userTapeTitleEl.textContent = savedNickname + " (You)";
    if (usernameInputEl) usernameInputEl.value = savedNickname;
    // Also sync standard lobby nickname variables if present
    const votingUserTitle = document.getElementById('voting-user-display-text');
    if (votingUserTitle) {
      votingUserTitle.textContent = savedNickname + " (You)";
    }
  }

  // Apply equipped cosmetics
  const equipped = JSON.parse(localStorage.getItem('imposter_equipped') || '{}');

  // 1. VCR Player Skin
  const userVcrDeck = document.getElementById('user-tape');
  if (userVcrDeck && equipped['vcr-skins']) {
    const skinId = equipped['vcr-skins'];
    const skinStyles = VCR_SKIN_STYLES[skinId];
    if (skinStyles) {
      userVcrDeck.style.backgroundImage = skinStyles.bg;
      userVcrDeck.style.borderColor = skinStyles.border;
      userVcrDeck.style.boxShadow = `4px 4px 0px ${skinStyles.shadow}`;
      
      const displayTxt = userVcrDeck.querySelector('.player-display-text');
      if (displayTxt) displayTxt.style.color = skinStyles.textColor;

      const led = userVcrDeck.querySelector('.player-led');
      if (led) {
        led.style.backgroundColor = skinStyles.ledColor;
        led.style.boxShadow = `0 0 6px ${skinStyles.ledColor}`;
      }
    }
  }

  // 2. Tape Skin and Label in watch screen insertion overlay
  const watchInsertionTape = document.getElementById('vcr-insertion-overlay')?.querySelector('.compact-tape');
  const watchInsertionLabel = document.getElementById('vcr-insertion-overlay')?.querySelector('.compact-label');

  if (watchInsertionTape && equipped['tape-skins']) {
    const skinId = equipped['tape-skins'];
    const skinStyles = TAPE_SKIN_STYLES[skinId];
    if (skinStyles) {
      watchInsertionTape.style.backgroundColor = skinStyles.bg;
      watchInsertionTape.style.borderColor = skinStyles.border;
      watchInsertionTape.style.boxShadow = `4px 4px 0px ${skinStyles.shadow}`;

      const tapeLabel = watchInsertionTape.querySelector('.tape-label') || watchInsertionTape;
      if (tapeLabel) {
        tapeLabel.style.background = skinStyles.labelBg;
        tapeLabel.style.borderColor = skinStyles.labelBorder;
      }
    }
  }

  // 3. Label text stamp
  if (watchInsertionLabel) {
    if (equipped['tape-labels']) {
      const labelId = equipped['tape-labels'];
      const labelText = TAPE_LABELS[labelId];
      if (labelText) {
        watchInsertionLabel.textContent = labelText;
      }
    } else {
      watchInsertionLabel.textContent = savedNickname ? `📼 ${savedNickname.toUpperCase()}` : '📼 ALEX_TAPE';
    }
  }



  // --- View Control Setup (VCR Remote Interface) ---
  const remoteBtns = document.querySelectorAll('.remote-btn');
  const viewPanels = document.querySelectorAll('.view-panel');

  function switchView(targetViewId) {
    viewPanels.forEach(panel => {
      if (panel.id === targetViewId) {
        panel.classList.add('active-view');
      } else {
        panel.classList.remove('active-view');
      }
    });

    // Update remote control states
    remoteBtns.forEach(btn => {
      if (btn.dataset.target === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Specific actions on transition
    if (targetViewId === 'view-watch') {
      startWatchSequence();
    } else {
      stopVideoPlayback();
    }

    if (targetViewId === 'view-lobby') {
      // Re-randomize the round when returning to lobby so player can test another combination!
      if (typeof window.resetRoundForLobby === 'function') {
        window.resetRoundForLobby();
      }
    }

    if (targetViewId === 'view-results') {
      // Update results dynamically
      const resultsOutcomeCard = document.querySelector('#view-results .brutal-card.yellow');
      if (resultsOutcomeCard) {
        const titleEl = resultsOutcomeCard.querySelector('h3');
        const descEl = resultsOutcomeCard.querySelector('p');
        
        if (isImposter) {
          titleEl.textContent = "SUSPECT DETECTED!";
          descEl.textContent = "You were the Suspect tape. The crewmates successfully detected your different footage and ejected you.";
          resultsOutcomeCard.style.backgroundColor = "var(--neon-magenta)";
          resultsOutcomeCard.style.color = "#fff";
        } else {
          titleEl.textContent = "CREW VICTORY!";
          descEl.textContent = "The Suspect was successfully detected and ejected from the VCR deck.";
          resultsOutcomeCard.style.backgroundColor = "var(--neon-yellow)";
          resultsOutcomeCard.style.color = "#000";
        }
      }

      // Update reveal info cards
      const revealCards = document.querySelectorAll('#view-results .results-info-cards .brutal-card');
      if (revealCards.length >= 2) {
        const crewValEl = revealCards[0].querySelector('.reveal-value');
        const imposterValEl = revealCards[1].querySelector('.reveal-value');
        
        if (crewValEl) crewValEl.textContent = `"${activeCrewTitle.toUpperCase()}.VHS"`;
        if (imposterValEl) imposterValEl.textContent = `"${activeImposterTitle.toUpperCase()}.VHS"`;
      }

      // Update the ejected tape title
      const ejectedTapeTitle = document.querySelector('#view-results .ejected-tape .tape-title');
      if (ejectedTapeTitle) {
        ejectedTapeTitle.textContent = activeImposterTitle;
      }

      // Trigger VCR Eject sequence
      const vcrDeck = document.querySelector('.vcr-deck');
      if (vcrDeck) {
        vcrDeck.classList.remove('ejected');
        setTimeout(() => {
          vcrDeck.classList.add('ejected');
        }, 300);
      }
    }
  }

  function startWatchSequence() {
    const overlay = document.getElementById('vcr-insertion-overlay');
    const videoScreen = document.querySelector('.video-screen');
    const trackingLine = document.querySelector('.tracking-line');
    const crtViewport = document.getElementById('crt-viewport');
    
    if (!overlay) return;
    
    // Stop any existing playback/timers first
    stopVideoPlayback();

    overlay.classList.remove('fade-out', 'inserting');
    overlay.querySelector('.insertion-status').textContent = "TAPE INJECTING...";
    
    if (crtViewport) {
      crtViewport.classList.add('watching-video');
    }
    
    setTimeout(() => {
      overlay.classList.add('inserting');
    }, 50);

    setTimeout(() => {
      overlay.querySelector('.insertion-status').textContent = "TAPE LOADED... READING...";
    }, 1300);

    setTimeout(() => {
      overlay.classList.add('fade-out');
      
      if (crtViewport) {
        crtViewport.classList.remove('vhs-effects-faded');
      }
      
      if (videoScreen) {
        videoScreen.classList.remove('vhs-starting');
        void videoScreen.offsetWidth; // trigger reflow
        videoScreen.classList.add('vhs-starting');
      }
      if (trackingLine) {
        trackingLine.classList.remove('vhs-starting-tracking');
        void trackingLine.offsetWidth; // trigger reflow
        trackingLine.classList.add('vhs-starting-tracking');
      }

      // Fade out VHS overlays over the video after the 1.2s startup animation finishes
      setTimeout(() => {
        if (crtViewport && crtViewport.classList.contains('watching-video')) {
          crtViewport.classList.add('vhs-effects-faded');
        }
      }, 1200);

      playRandomVideo();
    }, 1800);
  }

  function playRandomVideo() {
    if (!ytPlayer || !isPlayerReady) {
      setTimeout(playRandomVideo, 200);
      return;
    }
    
    // Play the correct video according to the assigned role
    const playId = isImposter ? activeImposterVideoId : activeCrewVideoId;
    ytPlayer.loadVideoById(playId);
    ytPlayer.playVideo();
    ytPlayer.unMute();

    startBatteryProgressTracking();
  }

  function startBatteryProgressTracking() {
    const batteryEl = document.getElementById('hud-battery');
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
      if (ytPlayer && ytPlayer.getDuration) {
        const duration = ytPlayer.getDuration();
        const currentTime = ytPlayer.getCurrentTime();
        if (duration > 0) {
          const percentRemaining = Math.max(0, Math.min(100, Math.floor((1 - (currentTime / duration)) * 100)));
          
          let bars = "   ";
          if (percentRemaining >= 75) {
            bars = "|||";
          } else if (percentRemaining >= 45) {
            bars = "|| ";
          } else if (percentRemaining >= 15) {
            bars = "|  ";
          }
          
          if (batteryEl) {
            batteryEl.textContent = `🔋 ${percentRemaining}% [${bars}]`;
          }
        }
      }
    }, 250);
  }

  function stopVideoPlayback() {
    const batteryEl = document.getElementById('hud-battery');
    const crtViewport = document.getElementById('crt-viewport');
    const videoScreen = document.querySelector('.video-screen');
    const trackingLine = document.querySelector('.tracking-line');

    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    if (ytPlayer && ytPlayer.stopVideo) {
      ytPlayer.stopVideo();
    }

    if (batteryEl) {
      batteryEl.textContent = "🔋 100% [|||]";
    }

    if (crtViewport) {
      crtViewport.classList.remove('watching-video', 'vhs-effects-faded');
    }

    if (videoScreen) {
      videoScreen.classList.remove('vhs-starting');
    }

    if (trackingLine) {
      trackingLine.classList.remove('vhs-starting-tracking');
    }
  }

  remoteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) {
        switchView(target);
      }
    });
  });

  // --- CRT/VHS Mode Toggle ---
  const crtToggle = document.getElementById('crt-toggle');
  const crtViewport = document.getElementById('crt-viewport');

  if (crtToggle && crtViewport) {
    crtToggle.addEventListener('click', () => {
      const isCrt = crtViewport.classList.toggle('crt-active');
      crtToggle.textContent = `VHS EFFECT: ${isCrt ? 'ON' : 'OFF'}`;
      crtToggle.className = isCrt ? 'btn-brutal yellow' : 'btn-brutal dark';
    });
  }

  // --- Lobby Setup Simulation ---
  const userTape = document.getElementById('user-tape');
  const userTapeTitle = document.getElementById('user-tape-title');
  const colorOptions = document.querySelectorAll('.color-option');
  const usernameInput = document.getElementById('username-input');

  // Change user tape color
  colorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      colorOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      
      const themeColor = opt.dataset.color;
      if (userTape) {
        // Reset colors
        userTape.style.borderColor = themeColor;
        userTape.style.boxShadow = `4px 4px 0px ${themeColor}`;
      }
      const votingUserVcr = document.getElementById('voting-user-vcr');
      if (votingUserVcr) {
        votingUserVcr.style.borderColor = themeColor;
        votingUserVcr.style.boxShadow = `4px 4px 0px ${themeColor}`;
      }
    });
  });

  // Sync input name to tape sticker
  if (usernameInput && userTapeTitle) {
    usernameInput.addEventListener('input', (e) => {
      const newName = e.target.value || "YOUR TAPE";
      userTapeTitle.textContent = newName;
      const votingUserTitle = document.getElementById('voting-user-display-text');
      if (votingUserTitle) {
        votingUserTitle.textContent = newName;
      }
    });
  }

  // Simulated Player Joining
  const dummyPlayers = [
    { name: "RetroRacer99", color: "#00f0ff", ready: true, sticker: "PLAYBACK-A" },
    { name: "GlitchWitch", color: "#ff0077", ready: false, sticker: "MASTER-TAPE" },
    { name: "VCR_Hero", color: "#ffee00", ready: true, sticker: "COPIED_DUB" },
    { name: "NeonSamurai", color: "#00ff66", ready: true, sticker: "CAM-SETUP" },
    { name: "RewindRoy", color: "#ff8800", ready: false, sticker: "HOME-VIDEO" },
  ];

  const tapesGrid = document.getElementById('tapes-grid');
  const addPlayerBtn = document.getElementById('add-player-btn');
  let currentDummyIndex = 0;

  if (addPlayerBtn && tapesGrid) {
    addPlayerBtn.addEventListener('click', () => {
      if (currentDummyIndex >= dummyPlayers.length) {
        alert("Lobby is full! (Max 6 players for this demo)");
        return;
      }

      const player = dummyPlayers[currentDummyIndex];
      currentDummyIndex++;

      // Create new VHS Player element
      const playerCard = document.createElement('div');
      playerCard.className = `vhs-player ${player.ready ? 'ready' : ''}`;
      playerCard.style.borderColor = '#000';
      playerCard.style.boxShadow = `4px 4px 0px #000`;
      
      // Inside VCR setup
      playerCard.innerHTML = `
        <div class="player-avatar-circle"></div>
        <div class="player-tag" style="background-color: ${player.color}">${player.sticker}</div>
        <div class="player-display">
          <div class="player-display-text">${player.name}</div>
          <div class="player-display-status">
            <span>CH. ${currentDummyIndex + 2}</span>
            <span>${player.ready ? '● READY' : '● WAITING'}</span>
          </div>
        </div>
        <div class="player-vcr-slot">
          <div class="player-vcr-door-flap"></div>
        </div>
        <div class="player-controls">
          <div class="player-led ${player.ready ? 'active' : 'waiting'}"></div>
          <div class="vcr-btns">
            <div class="vcr-btn"></div>
            <div class="vcr-btn"></div>
            <div class="vcr-btn"></div>
          </div>
        </div>
      `;

      tapesGrid.appendChild(playerCard);

      // Render random avatar for this newly joined player
      const newAvatarEl = playerCard.querySelector('.player-avatar-circle');
      if (newAvatarEl && typeof window.getAvatarSVG === 'function') {
        newAvatarEl.innerHTML = window.getAvatarSVG(window.getRandomAvatarConfig());
      }

    });
  }



  // --- Voting Logic Simulator ---
  const monitorScreens = document.querySelectorAll('.monitor-screen');
  const votingTimerVal = document.getElementById('voting-timer-val');

  // Voting countdown
  let timeLeft = 90;
  if (votingTimerVal) {
    setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        votingTimerVal.textContent = timeLeft;
        if (timeLeft <= 10) {
          votingTimerVal.style.color = "var(--neon-magenta)";
        }
      }
    }, 1000);
  }

  monitorScreens.forEach(screen => {
    screen.addEventListener('click', () => {
      // Clear previous voted indicators
      monitorScreens.forEach(s => s.classList.remove('voted-target'));
      
      // Add voted target stamp to clicked monitor
      screen.classList.add('voted-target');
      
      // Short screen flash effect
      screen.style.opacity = '0.3';
      setTimeout(() => {
        screen.style.opacity = '1';
      }, 100);
    });
  });

  // --- Voting Chat Simulator (Word Phase + Free Chat) ---
  const chatLog = document.getElementById('voting-chat-log');
  const chatInput = document.getElementById('voting-chat-input');
  const chatSendBtn = document.getElementById('voting-chat-send');
  const pinnedChips = document.getElementById('pinned-words-chips');
  const wordPhaseBanner = document.getElementById('word-phase-banner');

  const DUMMY_CREW = [
    { name: "VCR_Glitch",    color: "#ff0077" },
    { name: "RetroRacer99",  color: "#ffee00" },
    { name: "NeonSamurai",   color: "#00ff66" },
  ];

  // Words the dummy players will submit in the word phase
  const DUMMY_WORDS = ["Nostalgic", "Suspicious", "Glitchy", "Rewind"];

  // Free chat replies for after word phase
  const FREE_REPLIES = [
    "I agree with that.",
    "Are you sure? I think it might be RetroRacer99.",
    "Let's vote VCR_Glitch, they are definitely the suspect.",
    "Wait, why is everyone voting so fast?",
    "I was watching CH. 4, looked normal to me.",
    "Check the tracking line next time we watch a video.",
    "Let's stick together!"
  ];

  let wordPhaseActive = true;
  let userSubmittedWord = false;
  let dummyWordsSubmitted = 0;
  const totalPlayers = 4; // 3 dummies + user

  function addChatMsg(html, className = 'chat-log-msg') {
    if (!chatLog) return;
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = html;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addWordChip(authorName, authorColor, word) {
    if (!pinnedChips) return;
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.innerHTML = `<span class="word-chip-author" style="color:${authorColor}">${authorName}:</span><span class="word-chip-word">${word}</span>`;
    pinnedChips.appendChild(chip);
  }

  function checkWordPhaseComplete() {
    if (dummyWordsSubmitted >= DUMMY_CREW.length && userSubmittedWord) {
      // All words in — unlock free chat
      wordPhaseActive = false;
      if (wordPhaseBanner) {
        wordPhaseBanner.textContent = '✅ WORD PHASE COMPLETE — Full chat unlocked';
        wordPhaseBanner.style.borderColor = 'var(--neon-green)';
        wordPhaseBanner.style.color = 'var(--neon-green)';
        wordPhaseBanner.style.textShadow = '0 0 6px var(--neon-green)';
        wordPhaseBanner.style.animation = 'none';
      }
      if (chatInput) {
        chatInput.maxLength = 80;
        chatInput.placeholder = 'Type crew message...';
      }
      addChatMsg('[System] Word phase complete! Free chat is now open.', 'chat-log-msg system');
    }
  }

  function simulateDummyWordSubmissions() {
    // Stagger each dummy player's word submission 1.5–3s apart
    DUMMY_CREW.forEach((player, i) => {
      setTimeout(() => {
        const word = DUMMY_WORDS[i] || "Retro";
        addWordChip(player.name, player.color, word);
        addChatMsg(`<span class="author" style="color:${player.color}">${player.name}:</span> <em style="color:#aaa">[Word] ${word}</em>`);
        dummyWordsSubmitted++;
        checkWordPhaseComplete();
      }, 1800 + i * 1600);
    });
  }

  // Trigger word phase when the voting view is opened
  const originalSwitchView = window.__switchView;
  function initVotingWordPhase() {
    wordPhaseActive = true;
    userSubmittedWord = false;
    dummyWordsSubmitted = 0;

    // Reset chat log and chips
    if (chatLog) chatLog.innerHTML = '';
    if (pinnedChips) pinnedChips.innerHTML = '';
    if (wordPhaseBanner) {
      wordPhaseBanner.textContent = '⏳ WORD PHASE: Submit 1 word about the video before chat opens';
      wordPhaseBanner.style.borderColor = 'var(--neon-cyan)';
      wordPhaseBanner.style.color = 'var(--neon-cyan)';
      wordPhaseBanner.style.textShadow = '0 0 6px var(--neon-cyan)';
      wordPhaseBanner.style.animation = 'word-phase-pulse 2s infinite alternate';
    }
    if (chatInput) {
      chatInput.maxLength = 20;
      chatInput.placeholder = 'Your 1 word about the video...';
    }

    addChatMsg('[System] WORD PHASE active — everyone submit your 1-word reaction to the video!', 'chat-log-msg system');

    simulateDummyWordSubmissions();
  }

  // Hook into switchView to detect voting screen entry
  const _originalRemoteBtns = document.querySelectorAll('.remote-btn');
  _originalRemoteBtns.forEach(btn => {
    if (btn.dataset.target === 'view-voting') {
      btn.addEventListener('click', () => {
        // Small delay to let the view transition
        setTimeout(initVotingWordPhase, 200);
      });
    }
  });

  function sendUserChatMessage() {
    if (!chatInput || !chatLog) return;
    const text = chatInput.value.trim();
    if (!text) return;

    // In word phase, enforce single word (no spaces)
    if (wordPhaseActive) {
      if (text.includes(' ')) {
        chatInput.style.borderColor = 'var(--neon-magenta)';
        chatInput.placeholder = 'ONE word only — no spaces!';
        setTimeout(() => {
          chatInput.style.borderColor = '';
          chatInput.placeholder = 'Your 1 word about the video...';
        }, 1500);
        return;
      }
      if (userSubmittedWord) {
        chatInput.placeholder = 'Already submitted — wait for others...';
        setTimeout(() => { chatInput.placeholder = 'Your 1 word about the video...'; }, 1500);
        chatInput.value = '';
        return;
      }
    }

    chatInput.value = "";

    const userName = (document.getElementById('user-tape-title')?.textContent || "Alex").replace(" (You)", "");
    const userVcrColor = document.getElementById('user-tape')?.style.borderColor || "var(--neon-cyan)";

    if (wordPhaseActive) {
      // Word phase submission
      addWordChip(userName, userVcrColor, text);
      addChatMsg(`<span class="author" style="color:${userVcrColor}">${userName}:</span> <em style="color:#aaa">[Word] ${text}</em>`);
      userSubmittedWord = true;
      checkWordPhaseComplete();
    } else {
      // Free chat
      addChatMsg(`<span class="author" style="color:${userVcrColor}">${userName}:</span> ${text}`);

      // Simulate a random crew reply after a delay
      setTimeout(() => {
        const respondent = DUMMY_CREW[Math.floor(Math.random() * DUMMY_CREW.length)];
        const replyText = FREE_REPLIES[Math.floor(Math.random() * FREE_REPLIES.length)];
        addChatMsg(`<span class="author" style="color:${respondent.color}">${respondent.name}:</span> ${replyText}`);
      }, 1200 + Math.random() * 800);
    }
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', sendUserChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendUserChatMessage();
    });
  }

});

