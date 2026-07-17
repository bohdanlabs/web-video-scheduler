/**
 * demo.js — Web Video Scheduler interactive demo
 * ponytail: plain JS array in memory + localStorage, no framework
 */

(function () {
  'use strict';

  // ============================================================
  // DATA
  // ============================================================

  const STORAGE_KEY = 'wvs_slots';

  // ponytail: 0=Sun … 6=Sat (JS Date convention)
  const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_NAMES_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  // Ordered Mon–Sun for display purposes (ISO week)
  const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  const videos = {
    'business-lunch': { en: 'Business Lunch Special', uk: 'Бізнес-ланч' },
    'evening-promo':  { en: 'Evening Wine Promo',     uk: 'Вечірня акція' },
    'carwash-deal':   { en: 'Carwash Deal',            uk: 'Акція мийки' }
  };

  const DEFAULT_SLOTS = [
    { id: 1, time: '12:00', days: [1,2,3,4,5], video: 'business-lunch' },
    { id: 2, time: '19:00', days: [0,1,2,3,4,5,6], video: 'evening-promo' }
  ];

  let slots = loadSlots();
  let editingId = null;
  let nextId = Math.max(0, ...slots.map(function (s) { return s.id; })) + 1;

  function loadSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return DEFAULT_SLOTS.map(function (s) { return Object.assign({}, s, { days: s.days.slice() }); });
  }

  function saveSlots() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }

  // ============================================================
  // DOM REFS
  // ============================================================

  function $(id) { return document.getElementById(id); }

  const slotList      = $('slotList');
  const slotForm      = $('slotForm');
  const slotFormTitle = $('slotFormTitle');
  const formTime      = $('formTime');
  const formVideo     = $('formVideo');
  const formSave      = $('formSave');
  const formCancel    = $('formCancel');
  const btnAddSlot    = $('btnAddSlot');
  const statusBadge   = $('statusBadge');
  const statusText    = $('statusText');
  const statusNext    = $('statusNext');
  const hintTooltip   = $('hintTooltip');
  const tvPlaying     = $('tvPlaying');
  const tvNext        = $('tvNext');

  // ============================================================
  // HELPERS
  // ============================================================

  function lang() {
    return (window.wvsLang ? window.wvsLang.current() : null) ||
           localStorage.getItem('wvs_lang') || 'en';
  }

  function videoLabel(key) {
    const v = videos[key];
    if (!v) return key;
    return v[lang()] || v.en;
  }

  function dayLabel(dayNum) {
    return lang() === 'uk' ? DAY_NAMES_UK[dayNum] : DAY_NAMES_EN[dayNum];
  }

  function formatDays(days) {
    if (!days || days.length === 0) return '—';
    if (days.length === 7) return lang() === 'uk' ? 'Щодня' : 'Daily';
    // Group Mon–Fri
    const weekdays = [1,2,3,4,5];
    const weekend  = [6,0];
    const sortedInput = days.slice().sort();
    if (weekdays.every(function (d) { return days.indexOf(d) !== -1; }) && days.length === 5)
      return lang() === 'uk' ? 'Пн–Пт' : 'Mon–Fri';
    if (weekend.every(function (d) { return days.indexOf(d) !== -1; }) && days.length === 2)
      return lang() === 'uk' ? 'Сб, Нд' : 'Sat, Sun';
    return DISPLAY_ORDER
      .filter(function (d) { return days.indexOf(d) !== -1; })
      .map(dayLabel)
      .join(', ');
  }

  function getNextSlot() {
    if (slots.length === 0) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const todayDay = now.getDay();
    const current = getCurrentSlot();

    const sorted = slots.slice().sort(function (a, b) {
      return timeToMins(a.time) - timeToMins(b.time);
    });

    // Look for a slot later today
    for (const s of sorted) {
      if (s.days.indexOf(todayDay) !== -1 && timeToMins(s.time) > nowMins) return s;
    }
    // Otherwise earliest slot any day (excluding active slot so it never appears as Next)
    return sorted.find(function (s) { return s !== current; }) || null;
  }

  function getCurrentSlot() {
    if (slots.length === 0) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const todayDay = now.getDay();
    // Find the latest slot that started before now and is active today
    const candidates = slots.filter(function (s) {
      return s.days.indexOf(todayDay) !== -1 && timeToMins(s.time) <= nowMins;
    });
    if (!candidates.length) return null;
    return candidates.reduce(function (best, s) {
      return timeToMins(s.time) > timeToMins(best.time) ? s : best;
    });
  }

  function timeToMins(t) {
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  // ============================================================
  // TV PREVIEW
  // ============================================================

  function updateTV(overridePlaying, overrideNext, instant) {
    const current = overridePlaying !== undefined ? overridePlaying : getCurrentSlot();
    const next    = overrideNext    !== undefined ? overrideNext    : getNextSlot();

    const nowLabel  = lang() === 'uk' ? 'Зараз відтворюється' : 'Now Playing';
    const nextLabel = lang() === 'uk' ? 'Наступне:' : 'Next:';
    const noContent = lang() === 'uk' ? 'Немає запланованого контенту' : 'No scheduled content';

    const newText = current ? videoLabel(current.video) : noContent;
    if (instant) {
      // Skip fade on language switch so TV syncs instantly with the rest of the UI
      tvPlaying.textContent = newText;
    } else {
      tvPlaying.classList.add('fading');
      setTimeout(function () {
        tvPlaying.textContent = newText;
        tvPlaying.classList.remove('fading');
      }, 350);
    }

    if (next && next !== current) {
      tvNext.textContent = videoLabel(next.video) + ' — ' + next.time;
    } else if (next && slots.length > 1) {
      // show second slot as "next"
      const others = slots.filter(function (s) { return s.id !== (current && current.id); });
      const nxt = others.sort(function (a, b) { return timeToMins(a.time) - timeToMins(b.time); })[0];
      tvNext.textContent = nxt ? videoLabel(nxt.video) + ' — ' + nxt.time : '—';
    } else {
      tvNext.textContent = '—';
    }

    // Update labels via wvsLang
    const nowLabelEl = $('tvNowLabel');
    const nextLabelEl = $('tvNextLabel');
    if (nowLabelEl)  nowLabelEl.setAttribute('data-en', 'Now Playing');
    if (nextLabelEl) nextLabelEl.setAttribute('data-en', 'Next:');
  }

  // ============================================================
  // RENDER SLOT LIST
  // ============================================================

  function renderSlots() {
    slotList.innerHTML = '';

    if (slots.length === 0) {
      slotList.innerHTML = '<div class="empty-state" data-en="No slots yet — add one above." data-uk="Слотів немає — додайте вище.">No slots yet — add one above.</div>';
      if (window.wvsLang) window.wvsLang.apply(window.wvsLang.current());
      return;
    }

    const sorted = slots.slice().sort(function (a, b) { return timeToMins(a.time) - timeToMins(b.time); });
    const current = getCurrentSlot();

    sorted.forEach(function (slot) {
      const isActive = current && current.id === slot.id;
      const row = document.createElement('div');
      row.className = 'slot-row' + (isActive ? ' active-slot' : '');
      row.dataset.id = slot.id;

      const editLabel   = lang() === 'uk' ? 'Ред.' : 'Edit';
      const deleteLabel = lang() === 'uk' ? 'Вид.' : 'Del';

      row.innerHTML =
        '<span class="slot-time">' + slot.time + '</span>' +
        '<span class="slot-days">' + formatDays(slot.days) + '</span>' +
        '<span class="slot-video">' + videoLabel(slot.video) + '</span>' +
        '<span class="slot-actions">' +
          '<button class="btn-icon edit-btn" data-id="' + slot.id + '">' + editLabel + '</button>' +
          '<button class="btn-icon delete btn-delete" data-id="' + slot.id + '">' + deleteLabel + '</button>' +
        '</span>';

      slotList.appendChild(row);
    });

    // Wire row buttons
    slotList.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { openEdit(parseInt(btn.dataset.id, 10)); });
    });
    slotList.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteSlot(parseInt(btn.dataset.id, 10)); });
    });
  }

  // ============================================================
  // FORM
  // ============================================================

  function getCheckedDays() {
    const checked = [];
    document.querySelectorAll('.day-check:checked').forEach(function (cb) {
      checked.push(parseInt(cb.value, 10));
    });
    return checked;
  }

  function setCheckedDays(days) {
    document.querySelectorAll('.day-check').forEach(function (cb) {
      cb.checked = days.indexOf(parseInt(cb.value, 10)) !== -1;
    });
  }

  function openAdd() {
    editingId = null;
    const addTitle = lang() === 'uk' ? 'Новий слот' : 'New Slot';
    const saveLabel = lang() === 'uk' ? 'Зберегти' : 'Save';
    slotFormTitle.textContent = addTitle;
    formSave.textContent = saveLabel;
    formTime.value = '';
    formVideo.value = 'business-lunch';
    setCheckedDays([]);
    slotForm.classList.add('open');
    formTime.focus();
  }

  function openEdit(id) {
    const slot = slots.find(function (s) { return s.id === id; });
    if (!slot) return;
    editingId = id;
    const editTitle = lang() === 'uk' ? 'Редагувати слот' : 'Edit Slot';
    const saveLabel = lang() === 'uk' ? 'Застосувати' : 'Apply';
    slotFormTitle.textContent = editTitle;
    formSave.textContent = saveLabel;
    formTime.value = slot.time;
    formVideo.value = slot.video;
    setCheckedDays(slot.days);
    slotForm.classList.add('open');
  }

  function closeForm() {
    slotForm.classList.remove('open');
    editingId = null;
    clearScenario();
  }

  function saveForm() {
    const time  = formTime.value;
    const video = formVideo.value;
    const days  = getCheckedDays();

    if (!time) { formTime.focus(); return; }
    if (days.length === 0) {
      // Check all weekdays as default
      setCheckedDays([1,2,3,4,5]);
      return;
    }

    if (editingId !== null) {
      const slot = slots.find(function (s) { return s.id === editingId; });
      if (slot) { slot.time = time; slot.video = video; slot.days = days; }
    } else {
      slots.push({ id: nextId++, time: time, video: video, days: days });
    }

    saveSlots();
    closeForm();
    renderSlots();
    updateTV();
    showStatus(days);
  }

  function deleteSlot(id) {
    slots = slots.filter(function (s) { return s.id !== id; });
    saveSlots();
    renderSlots();
    updateTV();
  }

  function showStatus(days) {
    const updated = lang() === 'uk' ? 'Розклад оновлено' : 'Schedule updated';
    statusText.textContent = updated;
    statusBadge.classList.add('show');

    const next = getNextSlot();
    if (next) {
      const nextPrefix = lang() === 'uk' ? 'Наступний слот:' : 'Next slot:';
      statusNext.textContent = nextPrefix + ' ' + formatDays([next.days[0]]) + ' ' + next.time;
    } else {
      statusNext.textContent = '';
    }

    clearTimeout(statusBadge._timer);
    statusBadge._timer = setTimeout(function () {
      statusBadge.classList.remove('show');
    }, 4000);
  }

  // ============================================================
  // SCENARIOS
  // ============================================================

  let activeScenario = null;

  const scenarios = {
    // Scenario 1: Restaurant Morning Slot
    restaurant: function () {
      openAdd();
      formTime.value  = '08:00';
      formVideo.value = 'business-lunch';
      setCheckedDays([1,2,3,4,5]);
      showHint(
        lang() === 'uk'
          ? '🍽 Ресторан: ранковий слот заповнено. Натисніть «Зберегти».'
          : '🍽 Restaurant: morning slot pre-filled. Click Save.'
      );
    },

    // Scenario 2: Fuel Station Swap
    fuelstation: function () {
      // Check if there is a slot to edit; if not, create a carwash one to swap
      let carwash = slots.find(function (s) { return s.video === 'carwash-deal'; });
      if (!carwash) {
        carwash = { id: nextId++, time: '10:00', days: [0,6], video: 'carwash-deal' };
        slots.push(carwash);
        saveSlots();
        renderSlots();
      }
      // Highlight the edit button for that slot
      setTimeout(function () {
        const btn = slotList.querySelector('.edit-btn[data-id="' + carwash.id + '"]');
        if (btn) btn.classList.add('highlighted');
        showHint(
          lang() === 'uk'
            ? '⛽ АЗС: натисніть «Ред.» навпроти слоту «Акція мийки» — потім змініть відео.'
            : '⛽ Fuel Station: click Edit on the Carwash Deal slot — then swap the video.'
        );
        // Auto-open edit after brief delay so user sees the highlight
        setTimeout(function () {
          if (btn) btn.classList.remove('highlighted');
          openEdit(carwash.id);
          formVideo.value = 'evening-promo';
        }, 1800);
      }, 100);
    },

    // Scenario 3: Weekend Special
    weekend: function () {
      openAdd();
      formTime.value  = '10:00';
      formVideo.value = 'carwash-deal';
      setCheckedDays([6, 0]);
      showHint(
        lang() === 'uk'
          ? '📅 Вихідна акція: заповнено суботу та неділю. Натисніть «Зберегти».'
          : '📅 Weekend Special: Saturday + Sunday pre-filled. Click Save.'
      );
    }
  };

  function runScenario(key) {
    // Toggle off if clicking same
    if (activeScenario === key) {
      clearScenario();
      closeForm();
      return;
    }
    clearScenario();
    activeScenario = key;
    document.querySelectorAll('.scenario-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.scenario === key);
    });
    scenarios[key]();
  }

  function clearScenario() {
    activeScenario = null;
    document.querySelectorAll('.scenario-btn').forEach(function (btn) { btn.classList.remove('active'); });
    hideHint();
    // Remove any highlighted edit buttons
    slotList.querySelectorAll('.highlighted').forEach(function (el) { el.classList.remove('highlighted'); });
  }

  function showHint(text) {
    hintTooltip.textContent = text;
    hintTooltip.classList.add('show');
  }
  function hideHint() {
    hintTooltip.classList.remove('show');
  }

  // ============================================================
  // WIRING
  // ============================================================

  btnAddSlot.addEventListener('click', function () {
    clearScenario();
    openAdd();
  });

  formSave.addEventListener('click', saveForm);
  formCancel.addEventListener('click', function () {
    closeForm();
    clearScenario();
  });

  document.querySelectorAll('.scenario-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { runScenario(btn.dataset.scenario); });
  });

  // ============================================================
  // LANGUAGE REACTIVITY
  // ============================================================

  // Re-render when language switches so slot labels update
  if (window.wvsLang) {
    const orig = window.wvsLang.apply;
    window.wvsLang.apply = function (l) {
      orig(l);
      renderSlots();
      updateTV(undefined, undefined, true); // instant: sync TV text with rest of UI on lang switch
    };
  } else {
    // lang.js loads after us; patch after DOMContentLoaded
    document.addEventListener('wvsLangReady', function () {
      const orig = window.wvsLang.apply;
      window.wvsLang.apply = function (l) {
        orig(l);
        renderSlots();
        updateTV(undefined, undefined, true);
      };
    });
  }

  // ============================================================
  // INIT
  // ============================================================

  renderSlots();
  updateTV();

  // Refresh TV every minute for "current" accuracy
  setInterval(function () {
    renderSlots();
    updateTV();
  }, 60000);

}());
