/* home.js — Homepage & Cosmetics Shop Logic */

document.addEventListener('DOMContentLoaded', () => {
  console.log("📼 Tape Suspect Homepage Loaded!");

  // ── REC light flashing ──────────────────────────────────────
  const recDot = document.getElementById('rec-dot');
  setInterval(() => {
    if (recDot) recDot.classList.toggle('active');
  }, 600);

  // ── CRT Toggle ──────────────────────────────────────────────
  const crtToggle = document.getElementById('crt-toggle');
  const crtViewport = document.getElementById('crt-viewport');
  if (crtToggle && crtViewport) {
    crtToggle.addEventListener('click', () => {
      const isCrt = crtViewport.classList.toggle('crt-active');
      crtToggle.textContent = `VHS EFFECT: ${isCrt ? 'ON' : 'OFF'}`;
      crtToggle.className = isCrt ? 'btn-brutal yellow' : 'btn-brutal dark';
    });
  }

  // ── Shop Modal Toggle logic ────────────────────────────────
  const shopModalOverlay = document.getElementById('shop-setup-modal');
  const btnShopClose = document.getElementById('shop-modal-close');
  const shopTriggers = [
    document.getElementById('box-shop-btn'),
    document.getElementById('coin-balance'),
    document.querySelector('.balance-pill')
  ];

  function openShopModal() {
    if (shopModalOverlay) {
      shopModalOverlay.classList.add('active-modal');
      updateEquipStates();
    }
  }

  function closeShopModal() {
    if (shopModalOverlay) {
      shopModalOverlay.classList.remove('active-modal');
    }
  }

  shopTriggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openShopModal();
      });
    }
  });

  if (btnShopClose) {
    btnShopClose.addEventListener('click', closeShopModal);
  }

  // ══════════════════════════════════════════════════════════════
  //  STORAGE & STATE
  // ══════════════════════════════════════════════════════════════
  const STORAGE_KEY_COINS = 'imposter_rewind_coins';
  const STORAGE_KEY_OWNED = 'imposter_owned_items';
  const STORAGE_KEY_EQUIPPED = 'imposter_equipped';
  const DEFAULT_COINS = 500;

  // One equipped item per category
  function getEquipped() {
    const stored = localStorage.getItem(STORAGE_KEY_EQUIPPED);
    if (!stored) return {};
    try { return JSON.parse(stored); } catch { return {}; }
  }

  function setEquipped(category, itemId) {
    const equipped = getEquipped();
    equipped[category] = itemId;
    localStorage.setItem(STORAGE_KEY_EQUIPPED, JSON.stringify(equipped));
  }

  function isEquipped(itemId) {
    const equipped = getEquipped();
    return Object.values(equipped).includes(itemId);
  }

  function getCoins() {
    const stored = localStorage.getItem(STORAGE_KEY_COINS);
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY_COINS, DEFAULT_COINS);
      return DEFAULT_COINS;
    }
    return parseInt(stored, 10);
  }

  function setCoins(amount) {
    localStorage.setItem(STORAGE_KEY_COINS, amount);
    updateCoinDisplay();
  }

  function getOwnedItems() {
    const stored = localStorage.getItem(STORAGE_KEY_OWNED);
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  }

  function addOwnedItem(itemId) {
    const owned = getOwnedItems();
    if (!owned.includes(itemId)) {
      owned.push(itemId);
      localStorage.setItem(STORAGE_KEY_OWNED, JSON.stringify(owned));
    }
  }

  function isOwned(itemId) {
    return getOwnedItems().includes(itemId);
  }

  // ══════════════════════════════════════════════════════════════
  //  UI UPDATE FUNCTIONS
  // ══════════════════════════════════════════════════════════════
  const coinAmountEl = document.getElementById('coin-amount');
  const boxCoinAmountEl = document.getElementById('box-coin-amount');

  function updateCoinDisplay() {
    const coins = getCoins();
    if (coinAmountEl) {
      coinAmountEl.classList.add('coin-flash');
      coinAmountEl.textContent = coins;
      setTimeout(() => coinAmountEl.classList.remove('coin-flash'), 400);
    }
    if (boxCoinAmountEl) {
      boxCoinAmountEl.classList.add('coin-flash');
      boxCoinAmountEl.textContent = coins;
      setTimeout(() => boxCoinAmountEl.classList.remove('coin-flash'), 400);
    }
  }

  function markItemAsOwned(card) {
    card.classList.add('purchased');
    const buyBtn = card.querySelector('.shop-buy-btn');
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = 'OWNED';
    }
    // Show the equip button
    const equipBtn = card.querySelector('.shop-equip-btn');
    if (equipBtn) {
      equipBtn.style.display = '';
    }
  }

  function updateEquipStates() {
    const equipped = getEquipped();
    const allCards = document.querySelectorAll('.shop-item-card');

    allCards.forEach(card => {
      const itemId = card.dataset.itemId;
      const equipBtn = card.querySelector('.shop-equip-btn');
      if (!equipBtn) return;

      if (isEquipped(itemId)) {
        card.classList.add('equipped');
        equipBtn.textContent = '✓ EQUIPPED';
        equipBtn.classList.remove('cyan');
        equipBtn.classList.add('green');
      } else {
        card.classList.remove('equipped');
        if (isOwned(itemId)) {
          equipBtn.textContent = 'EQUIP';
          equipBtn.classList.remove('green');
          equipBtn.classList.add('cyan');
        }
      }
    });
  }

  // Initialize all owned + equipped items on page load
  function initOwnedItems() {
    updateCoinDisplay();
    const allCards = document.querySelectorAll('.shop-item-card');
    allCards.forEach(card => {
      const itemId = card.dataset.itemId;
      if (isOwned(itemId)) {
        markItemAsOwned(card);
      }
    });
    updateEquipStates();
  }

  // ══════════════════════════════════════════════════════════════
  //  SHOP CATEGORY TABS
  // ══════════════════════════════════════════════════════════════
  const shopTabs = document.querySelectorAll('.shop-tab');
  const shopGrids = document.querySelectorAll('.shop-grid');

  const CATEGORY_TO_GRID = {
    'tape-skins': 'grid-tape-skins',
    'vcr-skins': 'grid-vcr-skins',
    'tape-labels': 'grid-tape-labels',
  };

  shopTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;

      shopTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      shopGrids.forEach(g => g.classList.remove('active-grid'));
      const targetGrid = document.getElementById(CATEGORY_TO_GRID[category]);
      if (targetGrid) {
        targetGrid.classList.add('active-grid');
      }
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  BUY BUTTON INTERACTIONS
  // ══════════════════════════════════════════════════════════════
  const allBuyBtns = document.querySelectorAll('.shop-buy-btn');

  allBuyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.shop-item-card');
      if (!card) return;

      const itemId = card.dataset.itemId;
      const price = parseInt(card.dataset.price, 10);
      const currentCoins = getCoins();

      if (isOwned(itemId)) return;

      if (currentCoins < price) {
        btn.textContent = 'NOT ENOUGH 🪙';
        btn.classList.add('insufficient');
        setTimeout(() => {
          btn.textContent = 'BUY';
          btn.classList.remove('insufficient');
        }, 1500);
        return;
      }

      // Purchase!
      setCoins(currentCoins - price);
      addOwnedItem(itemId);

      card.classList.add('buying');
      setTimeout(() => {
        card.classList.remove('buying');
        markItemAsOwned(card);
        updateEquipStates();
      }, 600);
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  EQUIP BUTTON INTERACTIONS
  // ══════════════════════════════════════════════════════════════
  const allEquipBtns = document.querySelectorAll('.shop-equip-btn');

  allEquipBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.shop-item-card');
      if (!card) return;

      const itemId = card.dataset.itemId;
      const category = card.dataset.category;

      if (!isOwned(itemId)) return;

      // If already equipped, unequip
      if (isEquipped(itemId)) {
        const equipped = getEquipped();
        delete equipped[category];
        localStorage.setItem(STORAGE_KEY_EQUIPPED, JSON.stringify(equipped));
      } else {
        // Equip this item (replaces any previously equipped item in same category)
        setEquipped(category, itemId);
      }

      // Flash the card
      card.classList.add('equipping');
      setTimeout(() => card.classList.remove('equipping'), 500);

      updateEquipStates();
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  SHOP CARD HOVER SPOOL ANIMATION
  // ══════════════════════════════════════════════════════════════
  const allShopCards = document.querySelectorAll('.shop-item-card');
  allShopCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const spools = card.querySelectorAll('.spool, .c-spool');
      spools.forEach(s => s.classList.add('spinning'));
    });
    card.addEventListener('mouseleave', () => {
      const spools = card.querySelectorAll('.spool, .c-spool');
      spools.forEach(s => s.classList.remove('spinning'));
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  INITIALIZE
  // ══════════════════════════════════════════════════════════════
  initOwnedItems();



  // ══════════════════════════════════════════════════════════════
  //  HOW TO PLAY CAROUSEL
  // ══════════════════════════════════════════════════════════════
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  let currentSlide = 0;

  function showSlide(index) {
    if (slides.length === 0) return;
    
    // Bounds check
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((slide, i) => {
      if (i === currentSlide) {
        slide.classList.add('active-slide');
      } else {
        slide.classList.remove('active-slide');
      }
    });

    dots.forEach((dot, i) => {
      if (i === currentSlide) {
        dot.classList.add('active-dot');
      } else {
        dot.classList.remove('active-dot');
      }
    });
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetSlide = parseInt(dot.dataset.slide, 10);
      showSlide(targetSlide);
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  AVATAR DYNAMIC SVG GENERATOR
  // ══════════════════════════════════════════════════════════════
  const AVATAR_COLORS = ['#ff0077', '#00f0ff', '#ffee00', '#00ff66', '#ff7700', '#aa00ff', '#ff00aa', '#00ffaa'];
  const AVATAR_BODIES = [
    // Circle
    '<circle cx="50" cy="50" r="35" fill="{color}" stroke="#000" stroke-width="4"/>',
    // Rounded square
    '<rect x="18" y="18" width="64" height="64" rx="15" fill="{color}" stroke="#000" stroke-width="4"/>',
    // Cassette spools shape
    '<rect x="15" y="25" width="70" height="50" rx="8" fill="{color}" stroke="#000" stroke-width="4"/>' +
    '<circle cx="35" cy="50" r="10" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<circle cx="65" cy="50" r="10" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<circle cx="35" cy="50" r="4" fill="#fff"/>' +
    '<circle cx="65" cy="50" r="4" fill="#fff"/>',
    // Alien blob
    '<path d="M 50 15 C 25 15, 20 45, 20 75 C 40 85, 60 85, 80 75 C 80 45, 75 15, 50 15 Z" fill="{color}" stroke="#000" stroke-width="4"/>'
  ];
  const AVATAR_EYES = [
    // Big round cartoon eyes
    '<circle cx="38" cy="42" r="8" fill="#fff" stroke="#000" stroke-width="3"/>' +
    '<circle cx="37" cy="42" r="3" fill="#000"/>' +
    '<circle cx="62" cy="42" r="8" fill="#fff" stroke="#000" stroke-width="3"/>' +
    '<circle cx="63" cy="42" r="3" fill="#000"/>',
    // Cool retro shades
    '<polygon points="22,38 46,38 42,48 26,48" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<polygon points="54,38 78,38 74,48 58,48" fill="#000" stroke="#000" stroke-width="2"/>' +
    '<line x1="46" y1="41" x2="54" y2="41" stroke="#000" stroke-width="3"/>',
    // Cyber blue visor
    '<rect x="22" y="36" width="56" height="12" rx="4" fill="#00f0ff" stroke="#000" stroke-width="3"/>' +
    '<line x1="26" y1="42" x2="74" y2="42" stroke="#fff" stroke-width="2" stroke-dasharray="4,2"/>',
    // Angry squint
    '<path d="M 28 35 L 46 40 M 72 35 L 54 40" stroke="#000" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="37" cy="46" r="5" fill="#000"/>' +
    '<circle cx="63" cy="46" r="5" fill="#000"/>'
  ];
  const AVATAR_MOUTHS = [
    // Big curved smile
    '<path d="M 35 60 Q 50 72, 65 60" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>',
    // Simple gasp O
    '<circle cx="50" cy="62" r="6" fill="#000"/>',
    // Glitched / zig-zag mouth
    '<path d="M 35 60 L 40 65 L 45 60 L 50 65 L 55 60 L 60 65 L 65 60" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>',
    // Straight neutral line
    '<line x1="38" y1="62" x2="62" y2="62" stroke="#000" stroke-width="4" stroke-linecap="round"/>'
  ];
  const AVATAR_ACCESSORIES = [
    // Headphones
    '<path d="M 24 45 C 24 20, 76 20, 76 45" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="17" y="42" width="10" height="16" rx="4" fill="#ff0077" stroke="#000" stroke-width="2.5"/>' +
    '<rect x="73" y="42" width="10" height="16" rx="4" fill="#ff0077" stroke="#000" stroke-width="2.5"/>',
    // Cyber antenna
    '<line x1="50" y1="20" x2="50" y2="8" stroke="#000" stroke-width="3"/>' +
    '<circle cx="50" cy="6" r="4" fill="#ffee00" stroke="#000" stroke-width="2"/>',
    // Cool retro tape tag
    '<rect x="23" y="6" width="32" height="12" fill="#fff" stroke="#000" stroke-width="2" transform="rotate(-10 23 6)"/>' +
    '<text x="26" y="14" font-size="5.5" font-family="monospace" fill="#000" font-weight="bold" transform="rotate(-10 23 6)">SUSPECT</text>',
    // None
    ''
  ];

  const RANDOM_NICKNAMES = [
    'TapeSuspect', 'VCR_Glitch', 'SpoolMaster', 'RewindRider', 
    'StaticShifter', 'RecRoom99', 'OutrunBeta', 'VHS_Hero', 
    'MaxellMax', 'LaserDisc', 'BetamaxBoy', 'FastForward',
    'TrackingLost', 'SignalMute', 'DubbingDude', 'NoiseCore'
  ];

  let currentAvatarConfig = {
    colorIdx: 0,
    bodyIdx: 0,
    eyeIdx: 0,
    mouthIdx: 0,
    accIdx: 0
  };

  function renderAvatar(config, targetElement) {
    if (!targetElement) return;

    const color = AVATAR_COLORS[config.colorIdx];
    const bodySvg = AVATAR_BODIES[config.bodyIdx].replace(/{color}/g, color);
    const eyesSvg = AVATAR_EYES[config.eyeIdx];
    const mouthSvg = AVATAR_MOUTHS[config.mouthIdx];
    const accSvg = AVATAR_ACCESSORIES[config.accIdx];

    const fullSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        ${bodySvg}
        ${mouthSvg}
        ${eyesSvg}
        ${accSvg}
      </svg>
    `;
    targetElement.innerHTML = fullSvg;
  }

  function randomizeAvatar() {
    currentAvatarConfig = {
      colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
      bodyIdx: Math.floor(Math.random() * AVATAR_BODIES.length),
      eyeIdx: Math.floor(Math.random() * AVATAR_EYES.length),
      mouthIdx: Math.floor(Math.random() * AVATAR_MOUTHS.length),
      accIdx: Math.floor(Math.random() * AVATAR_ACCESSORIES.length)
    };
    renderAvatar(currentAvatarConfig, document.getElementById('avatar-svg-wrapper'));
  }

  function getRandomNickname() {
    const base = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `${base}${digits}`;
  }

  // ══════════════════════════════════════════════════════════════
  //  MODAL INTERACTIVITY LOGIC
  // ══════════════════════════════════════════════════════════════
  const modalOverlay = document.getElementById('avatar-setup-modal');
  const btnPlayGuest = document.getElementById('btn-play-guest');
  const btnPlaySignup = document.getElementById('btn-play-signup');
  const modalClose = document.getElementById('modal-close');
  const btnRandomize = document.getElementById('btn-randomize-avatar');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  
  const guestFields = document.getElementById('guest-fields');
  const signupFields = document.getElementById('signup-fields');
  
  const nicknameInput = document.getElementById('nickname-input');
  const signupUsernameInput = document.getElementById('signup-username');
  const signupPasswordInput = document.getElementById('signup-password');

  // Equipped pill references
  const equippedTapeSkinName = document.getElementById('equipped-tape-skin-name');
  const equippedVcrSkinName = document.getElementById('equipped-vcr-skin-name');
  const equippedLabelName = document.getElementById('equipped-label-name');

  const ITEM_NAMES = {
    'tape-neon-noir': 'Neon Noir',
    'tape-retro-sunset': 'Retro Sunset',
    'tape-glitch-core': 'Glitch Core',
    'tape-pastel-wave': 'Pastel Wave',
    'tape-toxic-waste': 'Toxic Waste',
    'tape-gold-standard': 'Gold Standard',
    
    'vcr-midnight-chrome': 'Midnight Chrome',
    'vcr-arctic-frost': 'Arctic Frost',
    'vcr-magma-deck': 'Magma Deck',
    'vcr-cyber-punk': 'Cyber Punk',
    'vcr-military-ops': 'Military Ops',
    'vcr-vaporwave': 'Vaporwave',
    
    'label-classified': 'Classified ⛔',
    'label-top-secret': 'Top Secret 🔒',
    'label-home-video': 'Home Video 🏠',
    'label-directors-cut': "Director's Cut 🎬",
    'label-evidence': 'Evidence 🔍',
    'label-bootleg': 'Bootleg 💀'
  };

  function updateEquippedDisplay() {
    const equipped = getEquipped();
    if (equippedTapeSkinName) {
      equippedTapeSkinName.textContent = ITEM_NAMES[equipped['tape-skins']] || 'Default 📼';
    }
    if (equippedVcrSkinName) {
      equippedVcrSkinName.textContent = ITEM_NAMES[equipped['vcr-skins']] || 'Default 📟';
    }
    if (equippedLabelName) {
      equippedLabelName.textContent = ITEM_NAMES[equipped['tape-labels']] || 'None 🏷️';
    }
  }

  function openProfileModal(mode) {
    if (!modalOverlay) return;
    
    // Load any existing profile info or randomize
    const savedNickname = localStorage.getItem('imposter_nickname');
    const savedConfig = localStorage.getItem('imposter_avatar_config');
    
    if (savedConfig) {
      try {
        currentAvatarConfig = JSON.parse(savedConfig);
        renderAvatar(currentAvatarConfig, document.getElementById('avatar-svg-wrapper'));
      } catch (e) {
        randomizeAvatar();
      }
    } else {
      randomizeAvatar();
    }

    if (mode === 'guest') {
      guestFields.style.display = 'block';
      signupFields.style.display = 'none';
      nicknameInput.value = savedNickname || getRandomNickname();
      localStorage.setItem('imposter_is_guest', 'true');
    } else {
      guestFields.style.display = 'none';
      signupFields.style.display = 'block';
      signupUsernameInput.value = savedNickname || getRandomNickname();
      signupPasswordInput.value = '';
      localStorage.setItem('imposter_is_guest', 'false');
    }

    updateEquippedDisplay();
    modalOverlay.classList.add('active-modal');
  }

  if (btnPlayGuest) {
    btnPlayGuest.addEventListener('click', () => openProfileModal('guest'));
  }
  if (btnPlaySignup) {
    btnPlaySignup.addEventListener('click', () => openProfileModal('signup'));
  }
  if (modalClose) {
    modalClose.addEventListener('click', () => modalOverlay.classList.remove('active-modal'));
  }
  if (btnRandomize) {
    btnRandomize.addEventListener('click', randomizeAvatar);
  }

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const isGuest = localStorage.getItem('imposter_is_guest') === 'true';
      let nickname = 'Alex';
      
      if (isGuest) {
        nickname = nicknameInput.value.trim() || 'Alex';
      } else {
        nickname = signupUsernameInput.value.trim() || 'Alex';
        // Mock authentication success
        localStorage.setItem('imposter_auth_token', 'mock_token_' + Date.now());
      }
      
      localStorage.setItem('imposter_nickname', nickname);
      localStorage.setItem('imposter_avatar_config', JSON.stringify(currentAvatarConfig));

      // Redirect to Join / Host page
      window.location.href = 'join-host.html';
    });
  }
});
