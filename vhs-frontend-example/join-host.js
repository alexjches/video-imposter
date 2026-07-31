/* join-host.js — Access Console & Lobby Router Logic */

document.addEventListener('DOMContentLoaded', () => {
  console.log("Access Console (Join/Host Screen) Loaded!");

  // ── REC light flashing ──────────────────────────────────────
  const recDot = document.getElementById('rec-dot');
  setInterval(() => {
    if (recDot) recDot.classList.toggle('active');
  }, 600);

  // ── CRT Toggle ──────────────────────────────────────────────
  const crtToggle = document.getElementById('crt-toggle');
  const crtViewport = document.getElementById('crt-viewport');
  
  // Set initial CRT state from localStorage or default to active
  let isCrt = localStorage.getItem('imposter_crt_effect') !== 'false';
  if (crtViewport) {
    if (isCrt) crtViewport.classList.add('crt-active');
    else crtViewport.classList.remove('crt-active');
  }
  if (crtToggle) {
    crtToggle.textContent = `VHS EFFECT: ${isCrt ? 'ON' : 'OFF'}`;
    crtToggle.className = isCrt ? 'btn-brutal yellow' : 'btn-brutal dark';
    
    crtToggle.addEventListener('click', () => {
      isCrt = crtViewport.classList.toggle('crt-active');
      localStorage.setItem('imposter_crt_effect', isCrt);
      crtToggle.textContent = `VHS EFFECT: ${isCrt ? 'ON' : 'OFF'}`;
      crtToggle.className = isCrt ? 'btn-brutal yellow' : 'btn-brutal dark';
    });
  }

  // ── Avatar & Profile Loader ──────────────────────────────────
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

  function getAvatarSVG(config) {
    const color = AVATAR_COLORS[config.colorIdx] || AVATAR_COLORS[0];
    const bodySvg = AVATAR_BODIES[config.bodyIdx].replace(/{color}/g, color);
    const eyesSvg = AVATAR_EYES[config.eyeIdx];
    const mouthSvg = AVATAR_MOUTHS[config.mouthIdx];
    const accSvg = AVATAR_ACCESSORIES[config.accIdx];

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width:100%; height:100%;">
        ${bodySvg}
        ${mouthSvg}
        ${eyesSvg}
        ${accSvg}
      </svg>
    `;
  }

  const savedNickname = localStorage.getItem('imposter_nickname') || 'Alex';
  const savedAvatarConfig = localStorage.getItem('imposter_avatar_config');
  
  const headerAvatarEl = document.getElementById('header-user-avatar');
  const headerNameEl = document.getElementById('header-user-name');

  if (headerNameEl) headerNameEl.textContent = savedNickname;
  if (headerAvatarEl && savedAvatarConfig) {
    try {
      const config = JSON.parse(savedAvatarConfig);
      headerAvatarEl.innerHTML = getAvatarSVG(config);
      // Adjust wrapper style slightly to fit cleanly
      headerAvatarEl.style.display = 'inline-flex';
      headerAvatarEl.style.width = '30px';
      headerAvatarEl.style.height = '30px';
      headerAvatarEl.style.alignItems = 'center';
    } catch (e) {
      headerAvatarEl.textContent = '🎮';
    }
  }

  // ── Navigation buttons ──────────────────────────────────────
  const btnBackHome = document.getElementById('btn-back-home');
  if (btnBackHome) {
    btnBackHome.addEventListener('click', () => {
      window.location.href = 'home.html';
    });
  }

  // ── Interactive Host Controls ──────────────────────────────
  let hostVisibility = 'public';
  let hostChat = 'text';
  let hostCategory = 'memes';

  // Privacy toggling
  const optPublic = document.getElementById('opt-public');
  const optPrivate = document.getElementById('opt-private');
  
  if (optPublic && optPrivate) {
    optPublic.addEventListener('click', () => {
      hostVisibility = 'public';
      optPublic.classList.add('active');
      optPrivate.classList.remove('active');
    });
    optPrivate.addEventListener('click', () => {
      hostVisibility = 'private';
      optPrivate.classList.add('active');
      optPublic.classList.remove('active');
    });
  }

  // Chat Type toggling
  const chatBtns = document.querySelectorAll('.chat-btn');
  chatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hostChat = btn.dataset.chat;
    });
  });

  // Video Category toggling + custom urls block logic
  const categoryBtns = document.querySelectorAll('.category-btn');
  const customUrlsBlock = document.getElementById('custom-urls-block');
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hostCategory = btn.dataset.category;

      if (hostCategory === 'custom') {
        customUrlsBlock.style.display = 'flex';
      } else {
        customUrlsBlock.style.display = 'none';
      }
    });
  });

  // YouTube URL Validation helper
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

  const urlCrewInput = document.getElementById('url-crew');
  const urlImposterInput = document.getElementById('url-imposter');
  const urlCrewError = document.getElementById('url-crew-error');
  const urlImposterError = document.getElementById('url-imposter-error');

  function validateUrlField(input, errorEl) {
    const val = input.value.trim();
    if (val === '') {
      errorEl.style.display = 'none';
      return true;
    }
    const id = parseYoutubeId(val);
    if (!id) {
      errorEl.style.display = 'block';
      return false;
    }
    errorEl.style.display = 'none';
    return true;
  }

  if (urlCrewInput && urlCrewError) {
    urlCrewInput.addEventListener('blur', () => validateUrlField(urlCrewInput, urlCrewError));
  }
  if (urlImposterInput && urlImposterError) {
    urlImposterInput.addEventListener('blur', () => validateUrlField(urlImposterInput, urlImposterError));
  }

  // Submit Host Action
  const btnHostSubmit = document.getElementById('btn-host-submit');
  if (btnHostSubmit) {
    btnHostSubmit.addEventListener('click', () => {
      let crewUrl = "";
      let imposterUrl = "";

      if (hostCategory === 'custom') {
        const crewOk = validateUrlField(urlCrewInput, urlCrewError);
        const imposterOk = validateUrlField(urlImposterInput, urlImposterError);

        if (!crewOk || !imposterOk || !urlCrewInput.value.trim() || !urlImposterInput.value.trim()) {
          alert("Please insert valid YouTube URLs for both Crewmate and Suspect tapes.");
          return;
        }

        crewUrl = urlCrewInput.value.trim();
        imposterUrl = urlImposterInput.value.trim();
      }

      // Generate simulated Room Code
      const code = `HOST-${Math.floor(1000 + Math.random() * 9000)}`;

      const settings = {
        isPublic: hostVisibility === 'public',
        chatType: hostChat,
        videoCategory: hostCategory,
        crewUrl: crewUrl,
        imposterUrl: imposterUrl
      };

      // Save room info to localStorage
      localStorage.setItem('imposter_active_lobby_code', code);
      localStorage.setItem('imposter_active_lobby_is_host', 'true');
      localStorage.setItem('imposter_active_lobby_settings', JSON.stringify(settings));

      // Redirect to simulated game room
      window.location.href = 'index.html';
    });
  }

  // ── Join Action on Public Lobbies ───────────────────────────
  const publicJoinBtns = document.querySelectorAll('.join-public-btn');
  publicJoinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const card = btn.closest('.lobby-item-card');
      const category = card.dataset.category || 'memes';
      const chat = card.dataset.chat || 'text';

      const settings = {
        isPublic: true,
        chatType: chat,
        videoCategory: category,
        crewUrl: "",
        imposterUrl: ""
      };

      // Save room info (player is guest)
      localStorage.setItem('imposter_active_lobby_code', code);
      localStorage.setItem('imposter_active_lobby_is_host', 'false');
      localStorage.setItem('imposter_active_lobby_settings', JSON.stringify(settings));

      // Redirect to simulated game room
      window.location.href = 'index.html';
    });
  });

  // ── Join Action on Private Lobby Code ────────────────────────
  const joinPrivateBtn = document.getElementById('join-private-btn');
  const privateCodeInput = document.getElementById('private-code-input');

  if (joinPrivateBtn && privateCodeInput) {
    joinPrivateBtn.addEventListener('click', () => {
      const code = privateCodeInput.value.trim().toUpperCase();
      if (!code) {
        alert("Please enter a valid Suspect Code sticker.");
        return;
      }

      const settings = {
        isPublic: false,
        chatType: 'text',
        videoCategory: 'memes', // default
        crewUrl: "",
        imposterUrl: ""
      };

      // Save room info
      localStorage.setItem('imposter_active_lobby_code', code);
      localStorage.setItem('imposter_active_lobby_is_host', 'false');
      localStorage.setItem('imposter_active_lobby_settings', JSON.stringify(settings));

      // Redirect
      window.location.href = 'index.html';
    });

    privateCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinPrivateBtn.click();
    });
  }

});
