// SCR Tab Injection - Inline content version (matches launcher tab style)
// Shows SCR runs in the same cards area as other tabs
(function() {
  const SCR_API = "https://api.scr.gg/service";
  const SCR_BASE = "https://scr.gg";
  const TWEAKS_STORAGE_KEY = 'djrlincs-tweaks-settings';
  
  let scrData = { runs: [], event: null, lastFetch: null };
  let scrTabActive = false;
  let eventImageCache = {};
  let trackImageCache = {};
  
  // Check if SCR tab is enabled in settings
  function isSCREnabled() {
    try {
      const saved = localStorage.getItem(TWEAKS_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        // Default to true if setting doesn't exist
        return settings.scrTabEnabled !== false;
      }
      return true; // Default enabled
    } catch (e) {
      return true; // Default enabled on error
    }
  }
  
  // Fetch event image from API by slug
  async function fetchEventImage(eventUrl) {
    if (!eventUrl) return null;
    
    const match = eventUrl.match(/\/events\/([^\/\?#]+)/);
    if (!match) return null;
    
    const slug = match[1];
    
    // Check cache first
    if (eventImageCache[slug] !== undefined) {
      return eventImageCache[slug];
    }
    
    try {
      const response = await fetch(`${SCR_API}/event/${slug}`);
      if (!response.ok) {
        eventImageCache[slug] = null;
        return null;
      }
      
      const data = await response.json();
      if (!data.success || !data.data) {
        eventImageCache[slug] = null;
        return null;
      }
      
      // Look for heat_image in event_heats
      let imageUrl = null;
      if (data.data.event_heats && data.data.event_heats.length > 0) {
        for (const heat of data.data.event_heats) {
          if (heat.heat_image) {
            // Adjust size to 512 for better quality
            imageUrl = heat.heat_image.replace(/\?size=\d+/, '?size=512');
            break;
          }
        }
      }
      
      // Fallback to event_image
      if (!imageUrl && data.data.event_image) {
        imageUrl = data.data.event_image.replace(/\?size=\d+/, '?size=512');
      }
      
      eventImageCache[slug] = imageUrl;
      return imageUrl;
    } catch (e) {
      console.error('[SCR] Failed to fetch event image:', e);
      eventImageCache[slug] = null;
      return null;
    }
  }
  
  console.log('[SCR] Script loaded');
  
  // Enable DevTools with Ctrl+Shift+I or F12
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
      e.preventDefault();
      try {
        // Try multiple methods to open DevTools
        if (window.require) {
          const electron = window.require('electron');
          if (electron.ipcRenderer) {
            electron.ipcRenderer.send('open-devtools');
          }
          if (electron.remote && electron.remote.getCurrentWebContents) {
            electron.remote.getCurrentWebContents().openDevTools();
          }
        }
        // Fallback: Try webContents directly
        if (window.electronAPI && window.electronAPI.openDevTools) {
          window.electronAPI.openDevTools();
        }
      } catch (err) {
        console.log('[SCR] Could not open DevTools:', err);
      }
    }
  });
  
  // Utilities
  function msToTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  }
  
  function timeAgo(dateStr) {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
  
  // Format time until event
  function timeUntil(dateStr) {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMs = date - now;
    
    if (diffMs < 0) return 'Started';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    return date.toLocaleDateString();
  }
  
  // Format event date/time nicely
  function formatEventDate(dateStr) {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function countryToFlag(code) {
    if (!code || code.length !== 2) {
      return '';
    }
    // Use flag images since Windows doesn't support flag emoji
    const lowerCode = code.toLowerCase();
    return '<img class="scr-flag-img" src="https://flagcdn.com/16x12/' + lowerCode + '.png" srcset="https://flagcdn.com/32x24/' + lowerCode + '.png 2x" alt="' + code + '">';
  }
  
  function openExternal(url) {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else if (window.require) {
      try { window.require('electron').shell.openExternal(url); } 
      catch (e) { window.open(url, '_blank'); }
    } else {
      window.open(url, '_blank');
    }
  }
  
  // Fetch upcoming events from iCal calendar and return the soonest one
  async function fetchNextEvent() {
    try {
      const response = await fetch('https://api.scr.gg/calendar/');
      if (!response.ok) return null;
      const icalText = await response.text();
      
      // Parse iCal VEVENT blocks
      const events = [];
      const eventBlocks = icalText.split('BEGIN:VEVENT');
      
      for (let i = 1; i < eventBlocks.length; i++) {
        const block = eventBlocks[i];
        const endIdx = block.indexOf('END:VEVENT');
        if (endIdx === -1) continue;
        const eventData = block.substring(0, endIdx);
        
        // Extract fields
        const dtStartMatch = eventData.match(/DTSTART:(\d{8}T\d{6}Z)/);
        const summaryMatch = eventData.match(/SUMMARY:([^\r\n]+)/);
        const urlMatch = eventData.match(/URL;VALUE=URI:([^\r\n]+)/);
        
        if (dtStartMatch && summaryMatch) {
          // Parse iCal date format: 20260227T190000Z
          const dtStr = dtStartMatch[1];
          const year = dtStr.substring(0, 4);
          const month = dtStr.substring(4, 6);
          const day = dtStr.substring(6, 8);
          const hour = dtStr.substring(9, 11);
          const min = dtStr.substring(11, 13);
          const sec = dtStr.substring(13, 15);
          const dateStr = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
          
          // Decode HTML entities in summary
          let summary = summaryMatch[1].replace(/&amp;/g, '&');
          
          events.push({
            name: summary,
            date: dateStr,
            url: urlMatch ? urlMatch[1] : 'https://scr.gg/events'
          });
        }
      }
      
      const now = new Date();
      
      // Filter future events and sort by date
      const upcoming = events
        .filter(e => new Date(e.date.replace(' ', 'T') + 'Z') > now)
        .sort((a, b) => new Date(a.date.replace(' ', 'T') + 'Z') - new Date(b.date.replace(' ', 'T') + 'Z'));
      
      return upcoming.length > 0 ? upcoming[0] : null;
    } catch (e) {
      console.error('[SCR] Calendar fetch error:', e);
      return null;
    }
  }
  
  async function fetchLatestRuns() {
    try {
      const response = await fetch(`${SCR_API}/runs/latest`, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.success || !data.data) return null;
      return data.data.map(run => ({
        racer: run.user_sc_handle || 'Unknown',
        track: run.track_name || 'Unknown Track',
        trackSlug: run.track_slug || '',
        time: parseInt(run.run_time) || 0,
        date: run.run_date || '',
        country: run.user_country || ''
      }));
    } catch (e) {
      console.error('[SCR] Fetch error:', e);
      return null;
    }
  }
  
  // Fetch track image from API
  async function fetchTrackImage(trackSlug) {
    if (!trackSlug) return null;
    
    // Check cache
    if (trackImageCache[trackSlug] !== undefined) {
      return trackImageCache[trackSlug];
    }
    
    try {
      const response = await fetch(`${SCR_API}/track/${trackSlug}`);
      if (!response.ok) {
        trackImageCache[trackSlug] = null;
        return null;
      }
      const data = await response.json();
      if (!data.success || !data.data) {
        trackImageCache[trackSlug] = null;
        return null;
      }
      
      // Get track image - prefer track_image_slug (hero) over track_thumbnail (often 403)
      const imageUrl = data.data.track_image_slug || data.data.track_thumbnail || null;
      trackImageCache[trackSlug] = imageUrl;
      return imageUrl;
    } catch (e) {
      trackImageCache[trackSlug] = null;
      return null;
    }
  }
  
  function createRunCard(run, trackImageUrl) {
    const hue = run.track.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    const card = document.createElement('li');
    card.className = 'sol-c-game-page__card scr-injected-card';
    const gradientBg = `linear-gradient(135deg, hsl(${hue}, 50%, 25%) 0%, hsl(${(hue + 40) % 360}, 40%, 15%) 100%)`;
    
    // External link icon SVG (matches native launcher style)
    const externalLinkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" focusable="false" aria-hidden="true" class="sol-c-icon sol-c-button__icon sol-c-button__icon--start"><path d="M2.475 3.137a.974.974 0 0 0-.975.971v9.23c0 .537.437.972.975.972h9.267a.974.974 0 0 0 .976-.972V8.45a.73.73 0 0 0-.732-.729.73.73 0 0 0-.73.76l-.001 4.372H2.963V4.594h3.902v-.002a.73.73 0 0 0 .67-.727.73.73 0 0 0-.67-.726v-.002h-4.39Z"></path><path d="M13.769 1.313h-4.05a.732.732 0 0 0-.583.21.727.727 0 0 0 .553 1.243h2.314L7.822 6.931v.001a.727.727 0 0 0 .03 1 .734.734 0 0 0 1.003.029h.001l4.182-4.164v2.305a.72.72 0 0 0 .213.55.734.734 0 0 0 1.246-.58V2.039a.732.732 0 0 0-.728-.725Z"></path></svg>`;
    
    // Always include both image and fallback - image will hide on error
    const mediaContent = trackImageUrl 
      ? `<img class="sol-c-card__image sol-c-card__image--loaded scr-track-img" src="${trackImageUrl}" alt="${run.track}" style="object-fit: cover; width: 100%; height: 100%;">
         <div class="scr-card-media-bg scr-track-fallback" style="display: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: ${gradientBg}; align-items: center; justify-content: center;"><span style="font-family: 'Electrolize', 'Consolas', monospace; font-size: 28px; font-weight: 700; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${msToTime(run.time)}</span></div>`
      : `<div class="scr-card-media-bg" style="width: 100%; height: 100%; background: ${gradientBg}; display: flex; align-items: center; justify-content: center;"><span style="font-family: 'Electrolize', 'Consolas', monospace; font-size: 28px; font-weight: 700; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${msToTime(run.time)}</span></div>`;
    
    card.innerHTML = `
      <article class="sol-c-card sol-c-card--wide" data-sol-button-group="true">
        <div class="sol-c-card__wrapper">
          <div class="sol-c-stack sol-c-stack--justify-end sol-c-stack--vertical sol-u-gap-150 sol-c-card__content">
            <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-025 sol-c-card__heading">
              <p class="sol-c-text sol-c-text--heading sol-c-text--heading-xs sol-u-color-foreground sol-u-text-truncate sol-c-card__title" style="--sol-u-text-truncate: 3;">
                <a href="${SCR_BASE}/track/${run.trackSlug}" rel="noopener noreferrer" target="_blank" class="sol-c-card__link">${run.track}</a>
              </p>
            </div>
            <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak sol-u-text-truncate sol-c-card__excerpt" style="--sol-u-text-truncate: 5;">
              ${run.country ? countryToFlag(run.country) + ' ' : ''}${run.racer} &middot; <strong>${msToTime(run.time)}</strong> &middot; ${timeAgo(run.date)}
            </p>
            <span class="sol-c-button sol-c-button--controlled sol-c-button--small sol-c-button--plain sol-c-card__button" aria-hidden="true">
              ${externalLinkIcon}
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-text--offset sol-c-button__content">View Track</span>
            </span>
          </div>
          <div class="sol-c-card__media">
            ${mediaContent}
          </div>
        </div>
      </article>
    `;
    
    card.querySelector('.sol-c-card__link').addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(`${SCR_BASE}/track/${run.trackSlug}`);
    });
    
    // Make the button also clickable
    card.querySelector('.sol-c-card__button').addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(`${SCR_BASE}/track/${run.trackSlug}`);
    });
    
    // Handle image load errors - show fallback gradient
    const trackImg = card.querySelector('.scr-track-img');
    const trackFallback = card.querySelector('.scr-track-fallback');
    if (trackImg && trackFallback) {
      trackImg.onerror = () => {
        trackImg.style.display = 'none';
        trackFallback.style.display = 'flex';
      };
    }
    
    return card;
  }
  
  // Create event card for upcoming event (imageUrl is pre-fetched)
  function createEventCard(event, imageUrl) {
    const card = document.createElement('li');
    card.className = 'sol-c-game-page__card scr-injected-card scr-event-card-wrapper';
    const placeholderBg = 'linear-gradient(135deg, rgba(249, 0, 77, 0.4) 0%, rgba(238, 7, 110, 0.4) 100%)';
    
    // External link icon SVG
    const externalLinkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" focusable="false" aria-hidden="true" class="sol-c-icon sol-c-button__icon sol-c-button__icon--start"><path d="M2.475 3.137a.974.974 0 0 0-.975.971v9.23c0 .537.437.972.975.972h9.267a.974.974 0 0 0 .976-.972V8.45a.73.73 0 0 0-.732-.729.73.73 0 0 0-.73.76l-.001 4.372H2.963V4.594h3.902v-.002a.73.73 0 0 0 .67-.727.73.73 0 0 0-.67-.726v-.002h-4.39Z"></path><path d="M13.769 1.313h-4.05a.732.732 0 0 0-.583.21.727.727 0 0 0 .553 1.243h2.314L7.822 6.931v.001a.727.727 0 0 0 .03 1 .734.734 0 0 0 1.003.029h.001l4.182-4.164v2.305a.72.72 0 0 0 .213.55.734.734 0 0 0 1.246-.58V2.039a.732.732 0 0 0-.728-.725Z"></path></svg>`;
    
    card.innerHTML = `
      <article class="sol-c-card sol-c-card--wide" data-sol-button-group="true">
        <div class="sol-c-card__wrapper">
          <div class="sol-c-stack sol-c-stack--justify-end sol-c-stack--vertical sol-u-gap-150 sol-c-card__content">
            <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-025 sol-c-card__heading">
              <span class="scr-event-badge">UPCOMING EVENT</span>
              <p class="sol-c-text sol-c-text--heading sol-c-text--heading-xs sol-u-color-foreground sol-u-text-truncate sol-c-card__title" style="--sol-u-text-truncate: 3;">
                <a href="${event.url || SCR_BASE + '/events'}" rel="noopener noreferrer" target="_blank" class="sol-c-card__link">${event.name}</a>
              </p>
            </div>
            <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak sol-u-text-truncate sol-c-card__excerpt" style="--sol-u-text-truncate: 5;">
              ${formatEventDate(event.date)} &middot; <strong>${timeUntil(event.date)}</strong>
            </p>
            <span class="sol-c-button sol-c-button--controlled sol-c-button--small sol-c-button--plain sol-c-card__button" aria-hidden="true">
              ${externalLinkIcon}
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-text--offset sol-c-button__content">View Event</span>
            </span>
          </div>
          <div class="sol-c-card__media">
            ${imageUrl 
              ? `<img class="sol-c-card__image sol-c-card__image--loaded" src="${imageUrl}" alt="${event.name}">`
              : `<div style="width: 100%; height: 100%; background: ${placeholderBg}; display: flex; align-items: center; justify-content: center;"><span style="font-size: 24px;">${String.fromCodePoint(0x1F3C1)}</span></div>`
            }
          </div>
        </div>
      </article>
    `;
    
    card.querySelector('.sol-c-card__link').addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(event.url || `${SCR_BASE}/events`);
    });
    
    card.querySelector('.sol-c-card__button').addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(event.url || `${SCR_BASE}/events`);
    });
    
    return card;
  }
  
  function createVisitCard() {
    const card = document.createElement('li');
    card.className = 'sol-c-game-page__card scr-injected-card';
    card.innerHTML = `
      <article class="sol-c-card" data-sol-button-group="true">
        <div class="sol-c-card__wrapper">
          <div class="sol-c-stack sol-c-stack--justify-end sol-c-stack--vertical sol-u-gap-150 sol-c-card__content">
            <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-025 sol-c-card__heading">
              <p class="sol-c-text sol-c-text--heading sol-c-text--heading-xs sol-u-color-foreground sol-u-text-truncate sol-c-card__title" style="--sol-u-text-truncate: 3;">
                <a href="${SCR_BASE}" rel="noopener noreferrer" target="_blank" class="sol-c-card__link">View All Runs</a>
              </p>
            </div>
            <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak sol-u-text-truncate sol-c-card__excerpt" style="--sol-u-text-truncate: 5;">
              Explore the full SCR leaderboards, tracks, and community.
            </p>
            <span class="sol-c-button sol-c-button--controlled sol-c-button--small sol-c-button--plain sol-c-card__button" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" focusable="false" aria-hidden="true" class="sol-c-icon sol-c-button__icon sol-c-button__icon--start"><path d="M2.475 3.137a.974.974 0 0 0-.975.971v9.23c0 .537.437.972.975.972h9.267a.974.974 0 0 0 .976-.972V8.45a.73.73 0 0 0-.732-.729.73.73 0 0 0-.73.76l-.001 4.372H2.963V4.594h3.902v-.002a.73.73 0 0 0 .67-.727.73.73 0 0 0-.67-.726v-.002h-4.39Z"></path><path d="M13.769 1.313h-4.05a.732.732 0 0 0-.583.21.727.727 0 0 0 .553 1.243h2.314L7.822 6.931v.001a.727.727 0 0 0 .03 1 .734.734 0 0 0 1.003.029h.001l4.182-4.164v2.305a.72.72 0 0 0 .213.55.734.734 0 0 0 1.246-.58V2.039a.732.732 0 0 0-.728-.725Z"></path></svg>
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-text--offset sol-c-button__content">scr.gg</span>
            </span>
          </div>
        </div>
      </article>
    `;
    card.querySelector('.sol-c-card__link').addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(SCR_BASE);
    });
    return card;
  }

  function createLoadingCard() {
    const card = document.createElement('li');
    card.className = 'sol-c-game-page__card scr-injected-card scr-loading-card';
    card.innerHTML = `
      <article class="sol-c-card" data-sol-button-group="true">
        <div class="sol-c-card__wrapper">
          <div class="sol-c-stack sol-c-stack--justify-end sol-c-stack--vertical sol-u-gap-150 sol-c-card__content" style="align-items: center; justify-content: center; min-height: 150px;">
            <div class="scr-spinner"></div>
            <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak">Loading SCR data...</p>
          </div>
        </div>
      </article>
    `;
    return card;
  }
  
  async function loadSCRData() {
    const container = document.querySelector('.sol-c-game-page__cards');
    if (!container) return;
    
    // Remove any existing SCR cards
    container.querySelectorAll('.scr-injected-card').forEach(c => c.remove());
    
    // Add loading card
    container.appendChild(createLoadingCard());
    
    // Fetch runs and upcoming event in parallel
    const [runs, nextEvent] = await Promise.all([
      fetchLatestRuns(),
      fetchNextEvent()
    ]);
    
    // Fetch event image if we have an event
    let eventImageUrl = null;
    if (nextEvent) {
      eventImageUrl = await fetchEventImage(nextEvent.url);
    }
    
    // Remove loading card and any SCR cards
    container.querySelectorAll('.scr-injected-card').forEach(c => c.remove());
    
    // Add upcoming event card first if available
    if (nextEvent) {
      container.appendChild(createEventCard(nextEvent, eventImageUrl));
    }
    
    if (!runs || runs.length === 0) {
      if (!nextEvent) {
        const errorCard = document.createElement('li');
        errorCard.className = 'sol-c-game-page__card scr-injected-card';
        errorCard.innerHTML = `
          <article class="sol-c-card" data-sol-button-group="true">
            <div class="sol-c-card__wrapper">
              <div class="sol-c-stack sol-c-stack--justify-end sol-c-stack--vertical sol-u-gap-150 sol-c-card__content" style="min-height: 100px;">
                <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak">${String.fromCodePoint(0x26A0)} Could not load SCR data</p>
              </div>
            </div>
          </article>
        `;
        container.appendChild(errorCard);
      }
      container.appendChild(createVisitCard());
      return;
    }
    
    // Fetch track images for unique tracks (limit to reduce API calls)
    const uniqueSlugs = [...new Set(runs.map(r => r.trackSlug).filter(Boolean))];
    const trackImages = {};
    await Promise.all(uniqueSlugs.slice(0, 10).map(async (slug) => {
      trackImages[slug] = await fetchTrackImage(slug);
    }));
    
    runs.forEach(run => container.appendChild(createRunCard(run, trackImages[run.trackSlug])));
    container.appendChild(createVisitCard());
    
    scrData.runs = runs;
    scrData.nextEvent = nextEvent;
    scrData.lastFetch = Date.now();
  }
  
  // Find the cards wrapper element (parent of the ul.sol-c-game-page__cards)
  function findCardsWrapper() {
    const nativeCards = document.querySelector('.sol-c-game-page__cards');
    if (nativeCards) {
      return nativeCards.parentElement;
    }
    return null;
  }
  
  // Store native cards HTML
  let nativeCardsBackup = null;
  
  function showSCRContent() {
    const nativeCards = document.querySelector('.sol-c-game-page__cards');
    if (!nativeCards) {
      console.log('[SCR] Native cards not found');
      return;
    }
    
    // Backup native cards if not already backed up
    if (nativeCardsBackup === null) {
      nativeCardsBackup = nativeCards.innerHTML;
    }
    
    // Hide all native card items (non-SCR cards)
    nativeCards.querySelectorAll('.sol-c-game-page__card:not(.scr-injected-card)').forEach(card => {
      card.style.display = 'none';
    });
    
    scrTabActive = true;
    
    // Load data if needed - also reload if cards don't exist (React may have recreated DOM)
    const existingSCRCards = nativeCards.querySelector('.scr-injected-card');
    if (!scrData.lastFetch || Date.now() - scrData.lastFetch > 60000 || !existingSCRCards) {
      console.log('[SCR] Loading data (lastFetch:', scrData.lastFetch, ', cardsExist:', !!existingSCRCards, ')');
      loadSCRData();
    } else {
      // Re-show existing SCR cards
      console.log('[SCR] Re-showing existing cards');
      nativeCards.querySelectorAll('.scr-injected-card').forEach(card => {
        card.style.display = '';
      });
    }
  }
  
  function hideSCRContent() {
    const nativeCards = document.querySelector('.sol-c-game-page__cards');
    if (nativeCards) {
      // Remove all SCR injected cards
      nativeCards.querySelectorAll('.scr-injected-card').forEach(card => {
        card.remove();
      });
      
      // Show all native card items again
      nativeCards.querySelectorAll('.sol-c-game-page__card').forEach(card => {
        card.style.display = '';
      });
    }
    
    // Restore native indicator (let launcher handle positioning and color)
    const nativeIndicator = document.querySelector('.sol-c-game-page__tabs-indicator');
    if (nativeIndicator) {
      nativeIndicator.style.opacity = '';
      nativeIndicator.style.left = '';
      nativeIndicator.style.width = '';
      nativeIndicator.style.background = '';
      nativeIndicator.classList.remove('scr-indicator-active');
    }
    
    scrTabActive = false;
    
    const scrTab = document.querySelector('.scr-tab-btn');
    if (scrTab) {
      scrTab.classList.remove('scr-tab-active');
      scrTab.setAttribute('aria-pressed', 'false');
      scrTab.setAttribute('aria-current', 'false');
    }
  }
  
  function findTabsContainer() {
    let container = document.querySelector('.sol-c-game-page__tabs');
    if (container) return container;
    
    const tabNames = ['Community', 'Comm-Links', 'New Citizens', 'Patch Notes'];
    for (const name of tabNames) {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === name);
      if (btn && btn.parentElement) {
        return btn.parentElement;
      }
    }
    return null;
  }
  
  function injectSCRTab() {
    // Check if SCR tab is enabled in settings
    if (!isSCREnabled()) {
      // Remove existing SCR tab if disabled
      const existingTab = document.querySelector('.scr-tab-btn');
      if (existingTab) {
        existingTab.remove();
        console.log('[SCR] Tab removed (disabled in settings)');
      }
      return true; // Return true to stop retry attempts
    }
    
    if (document.querySelector('.scr-tab-btn')) return true;
    
    const tabsContainer = findTabsContainer();
    if (!tabsContainer) return false;
    
    console.log('[SCR] Injecting tab');
    
    const scrTab = document.createElement('button');
    // Use native tab class for proper styling
    scrTab.className = 'sol-c-game-page__tab scr-tab-btn';
    scrTab.type = 'button';
    scrTab.title = 'Star Citizen Racing - Latest Runs';
    scrTab.setAttribute('aria-pressed', 'false');
    scrTab.setAttribute('aria-current', 'false');
    // Match native tab inner structure
    scrTab.innerHTML = '<span class="sol-c-text sol-c-text--button sol-c-text--button-m">SCR</span>';
    
    const indicator = tabsContainer.querySelector('.sol-c-game-page__tabs-indicator');
    if (indicator) {
      tabsContainer.insertBefore(scrTab, indicator);
    } else {
      tabsContainer.appendChild(scrTab);
    }
    
    scrTab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (scrTabActive) {
        hideSCRContent();
      } else {
        // Visually deselect ALL native tabs
        tabsContainer.querySelectorAll('.sol-c-game-page__tab:not(.scr-tab-btn)').forEach(tab => {
          tab.setAttribute('aria-pressed', 'false');
          tab.setAttribute('aria-current', 'false');
        });
        
        // Move native indicator to SCR tab position with SCR brand color
        if (indicator) {
          const tabRect = scrTab.getBoundingClientRect();
          const containerRect = tabsContainer.getBoundingClientRect();
          indicator.style.width = `${tabRect.width}px`;
          indicator.style.left = `${tabRect.left - containerRect.left}px`;
          indicator.style.opacity = '1';
          indicator.style.background = 'linear-gradient(90deg, #f81f01, #f9004d)';
          indicator.classList.add('scr-indicator-active');
        }
        
        scrTab.setAttribute('aria-pressed', 'true');
        scrTab.setAttribute('aria-current', 'true');
        scrTab.classList.add('scr-tab-active');
        showSCRContent();
      }
    });
    
    // Listen for native tab clicks
    document.addEventListener('click', (e) => {
      if (!scrTabActive) return;
      
      const clickedTab = e.target.closest('button');
      if (clickedTab && clickedTab !== scrTab && tabsContainer.contains(clickedTab)) {
        hideSCRContent();
      }
    }, true);
    
    console.log('[SCR] Tab injected');
    return true;
  }
  
  function addStyles() {
    if (document.getElementById('scr-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'scr-styles';
    style.textContent = `
      /* SCR Tab - using SCR brand colors (#f9004d) */
      .scr-tab-btn.sol-c-game-page__tab {
        position: relative;
      }
      
      /* Gradient text for SCR - matches scr.gg brand */
      .scr-tab-btn.sol-c-game-page__tab .sol-c-text {
        background: linear-gradient(90deg, #f81f01, #f9004d, #ee076e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        opacity: 0.7;
        transition: opacity 0.15s ease;
      }
      
      .scr-tab-btn.sol-c-game-page__tab:hover .sol-c-text {
        opacity: 1;
      }
      
      .scr-tab-btn.sol-c-game-page__tab[aria-pressed="true"] .sol-c-text,
      .scr-tab-btn.sol-c-game-page__tab.scr-tab-active .sol-c-text {
        background: linear-gradient(90deg, #f9004d, #fa004d, #ff1a5f);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        opacity: 1;
      }
      
      /* SCR Event badge */
      .scr-event-badge {
        background: linear-gradient(90deg, #f81f01, #f9004d);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 4px;
        letter-spacing: 1px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        margin-bottom: 4px;
      }
      
      /* SCR Event card styling - add pink border */
      .scr-event-card-wrapper .sol-c-card {
        border: 1px solid rgba(249, 0, 77, 0.4);
      }
      .scr-event-card-wrapper .sol-c-card:hover {
        border-color: rgba(249, 0, 77, 0.7);
        box-shadow: 0 0 12px rgba(249, 0, 77, 0.3);
      }
      
      /* Country flag image - since Windows doesn't support flag emoji */
      .scr-flag-img {
        display: inline-block;
        width: 16px;
        height: 12px;
        vertical-align: middle;
        margin-right: 4px;
        object-fit: cover;
        border-radius: 1px;
      }
      
      /* Loading spinner */
      .scr-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--sol-color-surface-3, #333);
        border-top-color: var(--sol-color-interactive, #00aaff);
        border-radius: 50%;
        animation: scr-spin 1s linear infinite;
      }
      
      @keyframes scr-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  function init() {
    console.log('[SCR] Initializing...');
    addStyles();
    
    if (injectSCRTab()) return;
    
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (injectSCRTab() || attempts >= 100) {
        clearInterval(interval);
      }
    }, 500);
    
    // Track the tabs container to detect when React recreates it
    let lastTabsContainer = null;
    
    const observer = new MutationObserver((mutations) => {
      const currentContainer = findTabsContainer();
      
      // If tabs container changed (React recreated it), or our tab is missing
      if (currentContainer && (currentContainer !== lastTabsContainer || !document.querySelector('.scr-tab-btn'))) {
        lastTabsContainer = currentContainer;
        console.log('[SCR] Observer: tabs container changed/missing, re-injecting');
        injectSCRTab();
      }
      
      // Also check for specific node additions that might be the tabs area
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              // Check if this node contains tabs
              if (node.querySelector && node.querySelector('.sol-c-game-page__tabs')) {
                console.log('[SCR] Observer: found node with game-page tabs');
                setTimeout(injectSCRTab, 50);
              }
              // Or if this is the tabs container itself
              if (node.classList && node.classList.contains('sol-c-game-page__tabs')) {
                console.log('[SCR] Observer: tabs container added');
                setTimeout(injectSCRTab, 50);
              }
              // Also check for game-page content appearing (means we're on the game page)
              if (node.classList && node.classList.contains('sol-c-game-page__content')) {
                console.log('[SCR] Observer: game-page content appeared, checking for tabs...');
                setTimeout(() => {
                  if (!document.querySelector('.scr-tab-btn') && findTabsContainer()) {
                    injectSCRTab();
                  }
                }, 100);
              }
              // Check for game-page cards (nested content indicator)
              if (node.querySelector && node.querySelector('.sol-c-game-page__cards')) {
                console.log('[SCR] Observer: game-page cards found');
                setTimeout(() => {
                  if (!document.querySelector('.scr-tab-btn') && findTabsContainer()) {
                    injectSCRTab();
                  }
                }, 100);
              }
            }
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Periodic check every 2s to ensure tab exists when on game page
    setInterval(() => {
      const gamePageContent = document.querySelector('.sol-c-game-page__content');
      const scrTab = document.querySelector('.scr-tab-btn');
      const tabsContainer = findTabsContainer();
      
      if (gamePageContent && !scrTab && tabsContainer && isSCREnabled()) {
        console.log('[SCR] Periodic check: game page visible but no SCR tab, injecting...');
        injectSCRTab();
      }
    }, 2000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }
  
  window.addEventListener('load', init);
  
  // Re-inject on navigation (hash change)
  window.addEventListener('hashchange', () => {
    console.log('[SCR] Navigation detected, will retry injection...');
    // Retry multiple times as React may take a moment to render
    let retries = 0;
    const retryInterval = setInterval(() => {
      retries++;
      if (!isSCREnabled()) {
        clearInterval(retryInterval);
        return;
      }
      if (document.querySelector('.scr-tab-btn')) {
        console.log('[SCR] Tab already exists');
        clearInterval(retryInterval);
        return;
      }
      const tabsContainer = findTabsContainer();
      if (tabsContainer) {
        console.log('[SCR] Found tabs container, injecting...');
        injectSCRTab();
        clearInterval(retryInterval);
      } else if (retries >= 20) {
        console.log('[SCR] Gave up after 20 retries - no tabs container found');
        clearInterval(retryInterval);
      }
    }, 200);
  });
  
  // Listen for settings change to re-enable SCR tab
  window.addEventListener('djrlincs-scr-enabled', () => {
    console.log('[SCR] Re-enabling via settings...');
    if (isSCREnabled()) {
      // Remove existing and re-inject to ensure clean state
      const existing = document.querySelector('.scr-tab-btn');
      if (existing) existing.remove();
      setTimeout(() => injectSCRTab(), 100);
    }
  });
})();

// ============================================================
// DJRLincs Tweaks - Settings Page Injection
// ============================================================
// Replicates functionality from Python scripts:
// - edit_launcher_carousel.py (background image/video replacement)
// - edit_launcher_music.py (music customization)
// - rotate_screenshot_splash.py (random screenshot backgrounds)
// ============================================================
(function() {
  const TWEAKS_STORAGE_KEY = 'djrlincs-tweaks-settings';
  
  // Default settings
  const defaultSettings = {
    scrTabEnabled: true,
    customBackground: '',
    backgroundType: 'default', // 'default', 'image', 'video', 'fallback-only', 'carousel'
    backgroundOpacity: 1.0,
    hideVideo: false,
    customVideoUrl: '',
    customMusicUrl: '', // URL to custom music file (MP3, OGG, WAV)
    carouselUrls: [], // Array of image/video URLs for carousel mode
    carouselInterval: 30 // seconds between transitions
  };

  // Carousel state
  let carouselTimer = null;
  let carouselIndex = 0;
  
  // Stop carousel rotation
  function stopCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
      console.log('[DJRLincs] Carousel stopped');
    }
    // Hide carousel video if exists
    const carouselVideo = document.getElementById('djrlincs-carousel-video');
    if (carouselVideo) {
      carouselVideo.pause();
      carouselVideo.style.opacity = '0';
    }
  }

  // Background persistence observer - watches for launcher trying to restore its native bg
  let bgObserver = null;
  let bgObserverPaused = false;
  
  function setupBackgroundObserver() {
    if (bgObserver) return; // Already set up
    
    const bgContainer = document.querySelector('.sol-c-game-page__background');
    if (!bgContainer) return;
    
    bgObserver = new MutationObserver((mutations) => {
      if (bgObserverPaused) return;
      
      const settings = loadSettings();
      if (settings.backgroundType === 'default') return; // Don't interfere with default mode
      
      // Check if launcher is trying to show the video/image again
      const bgVideo = bgContainer.querySelector('video.sol-c-game-page__video');
      const fallbackImg = bgContainer.querySelector('img.sol-c-game-page__image');
      
      let needsReapply = false;
      
      if (settings.backgroundType === 'image' || settings.backgroundType === 'carousel') {
        if (bgVideo && bgVideo.style.display !== 'none') needsReapply = true;
        if (fallbackImg && fallbackImg.style.display !== 'none') needsReapply = true;
      }
      
      if (needsReapply) {
        console.log('[DJRLincs] Launcher tried to restore native bg, re-applying custom bg...');
        bgObserverPaused = true; // Prevent recursion
        applyBackground();
        setTimeout(() => { bgObserverPaused = false; }, 100);
      }
    });
    
    bgObserver.observe(bgContainer, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['style', 'src'] 
    });
    
    console.log('[DJRLincs] Background persistence observer active');
  }
  
  // Load settings from localStorage
  function loadSettings() {
    try {
      const saved = localStorage.getItem(TWEAKS_STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }
  
  // Save settings to localStorage
  function saveSettings(settings) {
    try {
      localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('[DJRLincs] Failed to save settings:', e);
    }
  }
  
  // Apply background customization
  // Targets: .sol-c-game-page__background which contains:
  //   - img.sol-c-game-page__image (src: ./assets/images/sc_bg_fallback.jpg)
  //   - video.sol-c-game-page__video (src: ./assets/videos/sc_bg_video.webm)
  function applyBackground() {
    const settings = loadSettings();
    
    // Target the exact background container from the game page
    const bgContainer = document.querySelector('.sol-c-game-page__background');
    if (!bgContainer) {
      console.log('[DJRLincs] Background container not found, will retry...');
      return;
    }
    
    const fallbackImg = bgContainer.querySelector('img.sol-c-game-page__image');
    const bgVideo = bgContainer.querySelector('video.sol-c-game-page__video');
    
    console.log('[DJRLincs] Applying background settings:', settings.backgroundType);
    
    // Remove any existing custom background overlay
    let customBg = document.getElementById('djrlincs-custom-bg');
    
    switch (settings.backgroundType) {
      case 'image':
        // Custom image - hide video, replace with custom image overlay
        stopCarousel();
        if (bgVideo) {
          bgVideo.style.display = 'none';
          bgVideo.pause();
        }
        if (fallbackImg) {
          fallbackImg.style.display = 'none';
        }
        
        // Create or update custom background
        if (!customBg) {
          customBg = document.createElement('div');
          customBg.id = 'djrlincs-custom-bg';
          customBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            z-index: 1;
            pointer-events: none;
            transition: opacity 0.5s ease;
          `;
          bgContainer.appendChild(customBg);
        }
        
        if (settings.customBackground) {
          customBg.style.backgroundImage = `url('${settings.customBackground}')`;
          customBg.style.opacity = settings.backgroundOpacity;
          customBg.style.display = 'block';
        }
        break;
        
      case 'video':
        // Custom video URL
        stopCarousel();
        if (customBg) customBg.style.display = 'none';
        if (fallbackImg) fallbackImg.style.display = 'none';
        
        if (bgVideo && settings.customVideoUrl) {
          bgVideo.src = settings.customVideoUrl;
          bgVideo.style.opacity = settings.backgroundOpacity;
          bgVideo.style.pointerEvents = '';
          bgVideo.load();
          bgVideo.play().catch(() => {});
        }
        break;
        
      case 'fallback-only':
        // Show only the fallback image (similar to edit_launcher_carousel.py image mode)
        stopCarousel();
        if (customBg) customBg.style.display = 'none';
        if (bgVideo) {
          bgVideo.style.display = 'none';
          bgVideo.pause();
        }
        if (fallbackImg) {
          fallbackImg.style.display = 'block';
          fallbackImg.style.opacity = settings.backgroundOpacity;
          // Optionally replace fallback image source
          if (settings.customBackground) {
            fallbackImg.src = settings.customBackground;
          }
        }
        break;
      
      case 'carousel':
        // Carousel mode - rotate through multiple backgrounds
        stopCarousel(); // Clear any existing timer
        
        const urls = settings.carouselUrls || [];
        if (urls.length === 0) {
          console.log('[DJRLincs] Carousel: No URLs configured');
          break;
        }
        
        // Hide native elements
        if (bgVideo) {
          bgVideo.style.display = 'none';
          bgVideo.pause();
        }
        if (fallbackImg) {
          fallbackImg.style.display = 'none';
        }
        
        // Create or get custom background element
        if (!customBg) {
          customBg = document.createElement('div');
          customBg.id = 'djrlincs-custom-bg';
          customBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            z-index: 1;
            pointer-events: none;
            transition: opacity 1s ease;
          `;
          bgContainer.appendChild(customBg);
        }
        
        // Create video element for carousel if needed
        let carouselVideo = document.getElementById('djrlincs-carousel-video');
        if (!carouselVideo) {
          carouselVideo = document.createElement('video');
          carouselVideo.id = 'djrlincs-carousel-video';
          carouselVideo.autoplay = true;
          carouselVideo.loop = true;
          carouselVideo.muted = true;
          carouselVideo.playsInline = true;
          carouselVideo.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            pointer-events: none;
            transition: opacity 1s ease;
            opacity: 0;
          `;
          bgContainer.appendChild(carouselVideo);
        }
        
        // Function to show a specific carousel item
        function showCarouselItem(index) {
          const url = urls[index];
          const isVideo = /\\.(webm|mp4)$/i.test(url);
          
          if (isVideo) {
            customBg.style.opacity = '0';
            customBg.style.display = 'none';
            carouselVideo.src = url;
            carouselVideo.style.display = 'block';
            carouselVideo.style.opacity = settings.backgroundOpacity;
            carouselVideo.load();
            carouselVideo.play().catch(() => {});
          } else {
            carouselVideo.pause();
            carouselVideo.style.opacity = '0';
            carouselVideo.style.display = 'none';
            customBg.style.backgroundImage = `url('${url}')`;
            customBg.style.display = 'block';
            customBg.style.opacity = settings.backgroundOpacity;
          }
          
          console.log(`[DJRLincs] Carousel: Showing item ${index + 1}/${urls.length}`);
        }
        
        // Show first item
        showCarouselItem(carouselIndex % urls.length);
        
        // Start rotation timer
        const interval = (settings.carouselInterval || 30) * 1000;
        carouselTimer = setInterval(() => {
          carouselIndex = (carouselIndex + 1) % urls.length;
          showCarouselItem(carouselIndex);
        }, interval);
        
        console.log(`[DJRLincs] Carousel started: ${urls.length} items, ${settings.carouselInterval}s interval`);
        break;
        
      case 'default':
      default:
        // Restore defaults
        stopCarousel();
        if (customBg) customBg.style.display = 'none';
        if (bgVideo) {
          // Restore original video source if it was changed
          if (bgVideo.dataset.originalSrc && bgVideo.src !== bgVideo.dataset.originalSrc) {
            bgVideo.src = bgVideo.dataset.originalSrc;
            bgVideo.load();
          }
          bgVideo.style.display = '';
          bgVideo.style.opacity = '';
          bgVideo.play().catch(() => {});
        }
        if (fallbackImg) {
          // Restore original image source if it was changed
          if (fallbackImg.dataset.originalSrc && fallbackImg.src !== fallbackImg.dataset.originalSrc) {
            fallbackImg.src = fallbackImg.dataset.originalSrc;
          }
          fallbackImg.style.display = '';
          fallbackImg.style.opacity = '';
        }
        break;
    }
    
    // Apply music settings
    applyMusicSettings(settings);
    
    // Set up persistence observer to prevent launcher from overriding our changes
    setupBackgroundObserver();
  }
  
  // Store original sources on first run
  function storeOriginalSources() {
    const bgContainer = document.querySelector('.sol-c-game-page__background');
    if (!bgContainer) return;
    
    const fallbackImg = bgContainer.querySelector('img.sol-c-game-page__image');
    const bgVideo = bgContainer.querySelector('video.sol-c-game-page__video');
    
    if (fallbackImg && !fallbackImg.dataset.originalSrc) {
      fallbackImg.dataset.originalSrc = fallbackImg.src;
    }
    if (bgVideo && !bgVideo.dataset.originalSrc) {
      bgVideo.dataset.originalSrc = bgVideo.src;
    }
  }
  
  // Apply music settings - replace music source
  function applyMusicSettings(settings) {
    // Find the launcher's audio elements
    const audioElements = document.querySelectorAll('audio');
    
    if (settings.customMusicUrl && settings.customMusicUrl.trim()) {
      // Store original sources on first run
      audioElements.forEach(audio => {
        if (!audio.dataset.originalSrc) {
          audio.dataset.originalSrc = audio.src || audio.querySelector('source')?.src || '';
        }
        // Replace with custom music
        audio.src = settings.customMusicUrl;
        audio.load();
        // Try to play (may need user interaction)
        audio.play().catch(() => console.log('[DJRLincs] Music autoplay blocked - will play on interaction'));
      });
      
      // Also create our own audio element if no native ones found
      if (audioElements.length === 0) {
        let customAudio = document.getElementById('djrlincs-custom-audio');
        if (!customAudio) {
          customAudio = document.createElement('audio');
          customAudio.id = 'djrlincs-custom-audio';
          customAudio.loop = true;
          customAudio.autoplay = true;
          document.body.appendChild(customAudio);
        }
        customAudio.src = settings.customMusicUrl;
        customAudio.load();
        customAudio.play().catch(() => {});
      }
      
      console.log('[DJRLincs] Custom music applied:', settings.customMusicUrl);
    } else {
      // Restore original music
      audioElements.forEach(audio => {
        if (audio.dataset.originalSrc && audio.src !== audio.dataset.originalSrc) {
          audio.src = audio.dataset.originalSrc;
          audio.load();
          audio.play().catch(() => {});
        }
      });
      
      // Remove custom audio element if it exists
      const customAudio = document.getElementById('djrlincs-custom-audio');
      if (customAudio) {
        customAudio.pause();
        customAudio.remove();
      }
    }
  }
  
  // Create the DJRLincs Tweaks settings content
  function createTweaksContent() {
    const settings = loadSettings();
    
    const content = document.createElement('div');
    content.id = 'djrlincs-tweaks-content';
    content.className = 'sol-c-settings__content djrlincs-tweaks-content';
    content.innerHTML = `
      <h1 class="sol-c-text sol-c-text--heading sol-c-text--heading-m sol-c-settings__title">${String.fromCodePoint(0x1F339)} DJRLincs Tweaks</h1>
      
      <!-- SCR Tab Section -->
      <div class="sol-c-stack sol-c-stack--align-start sol-c-stack--vertical sol-u-gap-100 sol-c-field-group" role="group">
        <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-050 sol-c-field-group__header">
          <p class="sol-c-text sol-c-text--emphasis sol-c-text--emphasis-s sol-u-color-foreground sol-c-field-group__title" style="background: linear-gradient(90deg, #f81f01, #f9004d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SCR Tab</p>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-m sol-u-color-foreground-weak sol-c-field-group__description">
            Star Citizen Racing integration. Shows latest race runs and upcoming events directly in the launcher.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" style="width: 100%;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" id="djr-scr-enabled" ${settings.scrTabEnabled !== false ? 'checked' : ''} style="accent-color: #f9004d; width: 20px; height: 20px;">
            <span class="sol-c-text sol-c-text--body sol-c-text--body-m">Enable SCR Tab</span>
          </label>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 8px; padding-left: 32px;">
            Adds an SCR tab next to Community, New Citizens, etc. showing live race data from <a href="https://scr.gg" target="_blank" style="color: #f9004d;">scr.gg</a>
          </p>
        </div>
      </div>
      
      <div aria-orientation="horizontal" class="sol-c-divider" role="separator" style="--sol-c-divider-spacing: var(--sol-size-200);"></div>
      
      <!-- Background Customization Section -->
      <div class="sol-c-stack sol-c-stack--align-start sol-c-stack--vertical sol-u-gap-100 sol-c-field-group" role="group">
        <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-050 sol-c-field-group__header">
          <p class="sol-c-text sol-c-text--emphasis sol-c-text--emphasis-s sol-u-color-foreground sol-c-field-group__title">Background Customization</p>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-m sol-u-color-foreground-weak sol-c-field-group__description">
            Customize the launcher background. This works like the <code>edit_launcher_carousel.py</code> script but dynamically at runtime.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" style="width: 100%;">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Background Mode</span>
          </label>
          <div class="sol-c-stack sol-u-gap-075 sol-c-field__content" style="flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0;">
              <input type="radio" name="djr-bg-type" value="default" ${settings.backgroundType === 'default' ? 'checked' : ''} style="accent-color: #f9004d;">
              <span class="sol-c-text sol-c-text--body sol-c-text--body-m">Default Video</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0;">
              <input type="radio" name="djr-bg-type" value="fallback-only" ${settings.backgroundType === 'fallback-only' ? 'checked' : ''} style="accent-color: #f9004d;">
              <span class="sol-c-text sol-c-text--body sol-c-text--body-m">Static Image Only</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0;">
              <input type="radio" name="djr-bg-type" value="image" ${settings.backgroundType === 'image' ? 'checked' : ''} style="accent-color: #f9004d;">
              <span class="sol-c-text sol-c-text--body sol-c-text--body-m">Custom Image</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0;">
              <input type="radio" name="djr-bg-type" value="video" ${settings.backgroundType === 'video' ? 'checked' : ''} style="accent-color: #f9004d;">
              <span class="sol-c-text sol-c-text--body sol-c-text--body-m">Custom Video</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 0;">
              <input type="radio" name="djr-bg-type" value="carousel" ${settings.backgroundType === 'carousel' ? 'checked' : ''} style="accent-color: #f9004d;">
              <span class="sol-c-text sol-c-text--body sol-c-text--body-m">${String.fromCodePoint(0x1F3A0)} Carousel</span>
            </label>
          </div>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" id="djr-bg-url-field" style="width: 100%; ${!['image', 'fallback-only'].includes(settings.backgroundType) ? 'opacity: 0.5; pointer-events: none;' : ''}">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Image URL or File</span>
          </label>
          <div class="sol-c-field__content" style="width: 100%; display: flex; gap: 8px;">
            <input type="text" id="djr-bg-url" value="${settings.customBackground || ''}" 
              placeholder="https://... or click Browse"
              style="flex: 1; padding: 10px 12px; background: var(--sol-color-surface-0, #0d0d1a); border: 1px solid var(--sol-color-surface-2, #2a2a4e); border-radius: 4px; color: var(--sol-color-foreground, #fff); font-size: 14px;">
            <label class="sol-c-button sol-c-button--plain" style="padding: 10px 16px; cursor: pointer; white-space: nowrap;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4C1)} Browse</span>
              <input type="file" id="djr-bg-file" accept="image/*" style="display: none;">
            </label>
          </div>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 4px;">
            Supports: JPG, PNG, WebP, GIF. Enter URL or browse for local file.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" id="djr-video-url-field" style="width: 100%; ${settings.backgroundType !== 'video' ? 'opacity: 0.5; pointer-events: none;' : ''}">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Video URL or File</span>
          </label>
          <div class="sol-c-field__content" style="width: 100%; display: flex; gap: 8px;">
            <input type="text" id="djr-video-url" value="${settings.customVideoUrl || ''}" 
              placeholder="https://... or click Browse"
              style="flex: 1; padding: 10px 12px; background: var(--sol-color-surface-0, #0d0d1a); border: 1px solid var(--sol-color-surface-2, #2a2a4e); border-radius: 4px; color: var(--sol-color-foreground, #fff); font-size: 14px;">
            <label class="sol-c-button sol-c-button--plain" style="padding: 10px 16px; cursor: pointer; white-space: nowrap;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4C1)} Browse</span>
              <input type="file" id="djr-video-file" accept="video/*" style="display: none;">
            </label>
          </div>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 4px;">
            Supports: WebM, MP4. Enter URL or browse for local file.
          </p>
        </div>
        
        <!-- Carousel Settings -->
        <div class="sol-c-field sol-c-field--vertical" id="djr-carousel-field" style="width: 100%; ${settings.backgroundType !== 'carousel' ? 'opacity: 0.5; pointer-events: none;' : ''}">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">${String.fromCodePoint(0x1F3A0)} Carousel (URLs or files)</span>
          </label>
          <div class="sol-c-field__content" style="width: 100%;">
            <textarea id="djr-carousel-urls" rows="5" 
              placeholder="Enter URLs (one per line) or use Add Files below"
              style="width: 100%; padding: 10px 12px; background: var(--sol-color-surface-0, #0d0d1a); border: 1px solid var(--sol-color-surface-2, #2a2a4e); border-radius: 4px; color: var(--sol-color-foreground, #fff); font-size: 14px; resize: vertical; font-family: inherit;">${(settings.carouselUrls || []).join('\\n')}</textarea>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <label class="sol-c-button sol-c-button--plain" style="padding: 8px 16px; cursor: pointer;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4C1)} Add Images</span>
              <input type="file" id="djr-carousel-images" accept="image/*" multiple style="display: none;">
            </label>
            <label class="sol-c-button sol-c-button--plain" style="padding: 8px 16px; cursor: pointer;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F3AC)} Add Videos</span>
              <input type="file" id="djr-carousel-videos" accept="video/*" multiple style="display: none;">
            </label>
            <button type="button" id="djr-carousel-clear" class="sol-c-button sol-c-button--plain" style="padding: 8px 16px;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F5D1)} Clear All</span>
            </button>
          </div>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 4px;">
            Mix URLs and local files. Images/videos will rotate automatically.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" id="djr-carousel-interval-field" style="width: 100%; ${settings.backgroundType !== 'carousel' ? 'opacity: 0.5; pointer-events: none;' : ''}">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Rotation Interval: <span id="djr-interval-value">${settings.carouselInterval || 30}s</span></span>
          </label>
          <div class="sol-c-field__content" style="width: 100%;">
            <input type="range" id="djr-carousel-interval" min="5" max="120" value="${settings.carouselInterval || 30}" 
              style="width: 100%; accent-color: #f9004d;">
          </div>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 4px;">
            5 seconds - 2 minutes between background changes
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" id="djr-bg-opacity-field" style="width: 100%;">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Background Opacity: <span id="djr-opacity-value">${Math.round(settings.backgroundOpacity * 100)}%</span></span>
          </label>
          <div class="sol-c-field__content" style="width: 100%;">
            <input type="range" id="djr-bg-opacity" min="10" max="100" value="${settings.backgroundOpacity * 100}" 
              style="width: 100%; accent-color: #f9004d;">
          </div>
        </div>
        
        <div id="djr-preview" style="margin-top: 8px; width: 100%; display: ${settings.backgroundType === 'image' && settings.customBackground ? 'block' : 'none'};">
          <p class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak" style="margin-bottom: 8px;">Preview:</p>
          <div style="width: 100%; height: 120px; border-radius: 8px; overflow: hidden; border: 1px solid var(--sol-color-surface-2, #2a2a4e); background: #000;">
            <img id="djr-preview-img" src="${settings.customBackground || ''}" style="width: 100%; height: 100%; object-fit: cover; opacity: ${settings.backgroundOpacity};" onerror="this.style.display='none'">
          </div>
        </div>
      </div>
      
      <div aria-orientation="horizontal" class="sol-c-divider" role="separator" style="--sol-c-divider-spacing: var(--sol-size-200);"></div>
      
      <!-- Music Settings Section -->
      <div class="sol-c-stack sol-c-stack--align-start sol-c-stack--vertical sol-u-gap-100 sol-c-field-group" role="group">
        <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-050 sol-c-field-group__header">
          <p class="sol-c-text sol-c-text--emphasis sol-c-text--emphasis-s sol-u-color-foreground sol-c-field-group__title">${String.fromCodePoint(0x1F3B5)} Music Replacement</p>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-m sol-u-color-foreground-weak sol-c-field-group__description">
            Replace the launcher's background music with your own. Leave empty to use the default music.<br>
            <strong>Tip:</strong> Use the launcher's built-in volume slider to control volume.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" style="width: 100%;">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Custom Music URL or File</span>
          </label>
          <div class="sol-c-field__content" style="width: 100%; display: flex; gap: 8px;">
            <input type="text" id="djr-music-url" value="${settings.customMusicUrl || ''}" 
              placeholder="https://... or click Browse"
              style="flex: 1; padding: 10px 12px; background: var(--sol-color-surface-0, #0d0d1a); border: 1px solid var(--sol-color-surface-2, #2a2a4e); border-radius: 4px; color: var(--sol-color-foreground, #fff); font-size: 14px;">
            <label class="sol-c-button sol-c-button--plain" style="padding: 10px 16px; cursor: pointer; white-space: nowrap;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4C1)} Browse</span>
              <input type="file" id="djr-music-file" accept="audio/*" style="display: none;">
            </label>
          </div>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 4px;">
            Supports: MP3, OGG, WAV, M4A, FLAC. Enter URL or browse for local file.
          </p>
        </div>
        
        <div class="sol-c-stack sol-u-gap-050" style="margin-top: 8px;">
          <button type="button" id="djr-test-music-btn" class="sol-c-button sol-c-button--plain" style="padding: 8px 16px;">
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x25B6)} Test Music</span>
          </button>
          <button type="button" id="djr-stop-music-btn" class="sol-c-button sol-c-button--plain" style="padding: 8px 16px;">
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x23F9)} Stop</span>
          </button>
          <button type="button" id="djr-restore-music-btn" class="sol-c-button sol-c-button--plain" style="padding: 8px 16px;">
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x21A9)} Restore Default</span>
          </button>
        </div>
      </div>
      
      <div aria-orientation="horizontal" class="sol-c-divider" role="separator" style="--sol-c-divider-spacing: var(--sol-size-200);"></div>
      
      <!-- Splash Screen Section -->
      <div class="sol-c-stack sol-c-stack--align-start sol-c-stack--vertical sol-u-gap-100 sol-c-field-group" role="group">
        <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-050 sol-c-field-group__header">
          <p class="sol-c-text sol-c-text--emphasis sol-c-text--emphasis-s sol-u-color-foreground sol-c-field-group__title">${String.fromCodePoint(0x1F5BC)} EAC Splash Screen</p>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-m sol-u-color-foreground-weak sol-c-field-group__description">
            Replace the EasyAntiCheat loading splash screen with your own image.<br>
            Images are automatically resized to 800x450 pixels.
          </p>
        </div>
        
        <div class="sol-c-field sol-c-field--vertical" style="width: 100%;">
          <label class="sol-c-stack sol-c-stack--align-baseline sol-u-gap-025 sol-c-field__label">
            <span class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak">Image URL or File</span>
          </label>
          <div class="sol-c-field__content" style="width: 100%; display: flex; gap: 8px;">
            <input type="text" id="djr-splash-url" value="" 
              placeholder="https://... or click Browse"
              style="flex: 1; padding: 10px 12px; background: var(--sol-color-surface-0, #0d0d1a); border: 1px solid var(--sol-color-surface-2, #2a2a4e); border-radius: 4px; color: var(--sol-color-foreground, #fff); font-size: 14px;">
            <label class="sol-c-button sol-c-button--plain" style="padding: 10px 16px; cursor: pointer; white-space: nowrap;">
              <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4C1)} Browse</span>
              <input type="file" id="djr-splash-file" accept="image/*" style="display: none;">
            </label>
          </div>
        </div>
        
        <div id="djr-splash-preview" style="margin-top: 8px; width: 100%; display: none;">
          <p class="sol-c-text sol-c-text--label sol-c-text--label-m sol-u-color-foreground-weak" style="margin-bottom: 8px;">Preview (800x450):</p>
          <div style="width: 100%; max-width: 400px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; border: 1px solid var(--sol-color-surface-2, #2a2a4e); background: #000;">
            <canvas id="djr-splash-canvas" width="800" height="450" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
        
        <div class="sol-c-stack sol-u-gap-050" style="margin-top: 8px;">
          <button type="button" id="djr-splash-generate-btn" class="sol-c-button sol-c-button--plain" style="padding: 8px 16px;">
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F504)} Generate Preview</span>
          </button>
          <button type="button" id="djr-splash-download-btn" class="sol-c-button" style="background: linear-gradient(90deg, #f81f01, #f9004d); border: none; padding: 8px 16px;" disabled>
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4BE)} Download SplashScreen.png</span>
          </button>
        </div>
        
        <div id="djr-splash-instructions" class="sol-c-text sol-c-text--body sol-c-text--body-xs sol-u-color-foreground-weak" style="margin-top: 8px; padding: 12px; background: var(--sol-color-surface-1, #1a1a2e); border-radius: 4px; width: 100%;">
          <strong>Instructions:</strong><br>
          1. Enter an image URL or browse for a local file<br>
          2. Click "Generate Preview" to resize the image<br>
          3. Click "Download SplashScreen.png" to save<br>
          4. Copy the downloaded file to:<br>
          <code id="djr-splash-path" style="background: #000; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 4px;">
            Detecting library path...
          </code>
          <button type="button" id="djr-splash-copy-path" class="sol-c-button sol-c-button--plain" style="padding: 4px 10px; margin-left: 8px; vertical-align: middle; font-size: 12px;">
            <span class="sol-c-text sol-c-text--button sol-c-text--button-s sol-c-button__content">${String.fromCodePoint(0x1F4CB)} Copy Path</span>
          </button>
        </div>
      </div>
      
      <div aria-orientation="horizontal" class="sol-c-divider" role="separator" style="--sol-c-divider-spacing: var(--sol-size-200);"></div>
      
      <!-- Action Buttons -->
      <div class="sol-c-stack sol-u-gap-100" style="padding-top: 8px;">
        <button type="button" id="djr-apply-btn" class="sol-c-button" style="background: linear-gradient(90deg, #f81f01, #f9004d); border: none; padding: 12px 24px;">
          <span class="sol-c-text sol-c-text--button sol-c-text--button-m sol-c-text--offset sol-u-text-transform-uppercase sol-c-button__content">Apply Settings</span>
        </button>
        <button type="button" id="djr-reset-btn" class="sol-c-button" style="padding: 12px 24px;">
          <span class="sol-c-text sol-c-text--button sol-c-text--button-m sol-c-text--offset sol-u-text-transform-uppercase sol-c-button__content">Reset to Default</span>
        </button>
      </div>
      
      <div aria-orientation="horizontal" class="sol-c-divider" role="separator" style="--sol-c-divider-spacing: var(--sol-size-250);"></div>
      
      <!-- About Section -->
      <div class="sol-c-stack sol-c-stack--align-start sol-c-stack--vertical sol-u-gap-100 sol-c-field-group" role="group">
        <div class="sol-c-stack sol-c-stack--vertical sol-u-gap-050 sol-c-field-group__header">
          <p class="sol-c-text sol-c-text--emphasis sol-c-text--emphasis-s sol-u-color-foreground sol-c-field-group__title">About ${String.fromCodePoint(0x1F339)} DJRLincs Tweaks</p>
          <p class="sol-c-text sol-c-text--body sol-c-text--body-m sol-u-color-foreground-weak sol-c-field-group__description">
            Custom modifications for the RSI Launcher by DJRLincs.<br><br>
            <strong>Features:</strong><br>
            • SCR (Star Citizen Racing) Tab - Live race data integration<br>
            • Custom Backgrounds - Replace default video/image backgrounds<br>
            • ${String.fromCodePoint(0x1F3A0)} Carousel Mode - Rotate through multiple images/videos automatically<br>
            • ${String.fromCodePoint(0x1F3B5)} Music Replacement - Use your own custom background music<br>
            • ${String.fromCodePoint(0x1F5BC)} Splash Screen - Generate custom EAC loading screens<br>
          </p>
        </div>
      </div>
    `;
    
    // Add event listeners after creation
    setTimeout(() => {
      // Helper function to gather all settings from form
      function getFormSettings() {
        const carouselUrlsRaw = document.getElementById('djr-carousel-urls')?.value || '';
        const carouselUrls = carouselUrlsRaw.split('\\n').map(u => u.trim()).filter(u => u);
        
        return {
          scrTabEnabled: document.getElementById('djr-scr-enabled')?.checked !== false,
          backgroundType: document.querySelector('input[name="djr-bg-type"]:checked')?.value || 'default',
          customBackground: document.getElementById('djr-bg-url')?.value || '',
          customVideoUrl: document.getElementById('djr-video-url')?.value || '',
          backgroundOpacity: (document.getElementById('djr-bg-opacity')?.value || 100) / 100,
          customMusicUrl: document.getElementById('djr-music-url')?.value || '',
          carouselUrls: carouselUrls,
          carouselInterval: parseInt(document.getElementById('djr-carousel-interval')?.value) || 30
        };
      }
      
      // Helper function to apply settings instantly
      function applyInstant() {
        const newSettings = getFormSettings();
        saveSettings(newSettings);
        applyBackground();
      }
      
      // Background type radio buttons
      content.querySelectorAll('input[name="djr-bg-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const bgType = e.target.value;
          const urlField = document.getElementById('djr-bg-url-field');
          const videoField = document.getElementById('djr-video-url-field');
          const carouselField = document.getElementById('djr-carousel-field');
          const carouselIntervalField = document.getElementById('djr-carousel-interval-field');
          const preview = document.getElementById('djr-preview');
          
          // Show/hide fields based on selection
          const showImageUrl = ['image', 'fallback-only'].includes(bgType);
          const showVideoUrl = bgType === 'video';
          const showCarousel = bgType === 'carousel';
          
          if (urlField) urlField.style.cssText = `width: 100%; ${!showImageUrl ? 'opacity: 0.5; pointer-events: none;' : ''}`;
          if (videoField) videoField.style.cssText = `width: 100%; ${!showVideoUrl ? 'opacity: 0.5; pointer-events: none;' : ''}`;
          if (carouselField) carouselField.style.cssText = `width: 100%; ${!showCarousel ? 'opacity: 0.5; pointer-events: none;' : ''}`;
          if (carouselIntervalField) carouselIntervalField.style.cssText = `width: 100%; ${!showCarousel ? 'opacity: 0.5; pointer-events: none;' : ''}`;
          if (preview) preview.style.display = bgType === 'image' ? 'block' : 'none';
          
          // Apply instantly
          applyInstant();
        });
      });
      
      // URL input - update preview and apply
      const urlInput = document.getElementById('djr-bg-url');
      if (urlInput) {
        let urlDebounce = null;
        urlInput.addEventListener('input', (e) => {
          const previewImg = document.getElementById('djr-preview-img');
          const preview = document.getElementById('djr-preview');
          if (previewImg && e.target.value) {
            previewImg.src = e.target.value;
            previewImg.style.display = '';
            preview.style.display = 'block';
          }
          // Debounce apply
          clearTimeout(urlDebounce);
          urlDebounce = setTimeout(applyInstant, 500);
        });
      }
      
      // Video URL input with debounce
      const videoInput = document.getElementById('djr-video-url');
      if (videoInput) {
        let videoDebounce = null;
        videoInput.addEventListener('input', () => {
          clearTimeout(videoDebounce);
          videoDebounce = setTimeout(applyInstant, 500);
        });
      }
      
      // Carousel URLs textarea with debounce
      const carouselInput = document.getElementById('djr-carousel-urls');
      if (carouselInput) {
        let carouselDebounce = null;
        carouselInput.addEventListener('input', () => {
          clearTimeout(carouselDebounce);
          carouselDebounce = setTimeout(applyInstant, 500);
        });
      }
      
      // Helper: Convert file to usable URL
      // In Electron, we can use file:// paths directly. Falls back to data URL.
      const MAX_FILE_SIZE_MB = 10; // 10MB limit for data URLs
      function fileToUrl(file, forceDataUrl = false) {
        return new Promise((resolve, reject) => {
          const sizeMB = file.size / (1024 * 1024);
          
          // In Electron, files have a .path property - use file:// protocol
          if (file.path && !forceDataUrl) {
            // Convert Windows path to file:// URL
            const filePath = file.path.replace(/\\/g, '/');
            resolve(`file:///${filePath}`);
            return;
          }
          
          // Warn for large data URLs
          if (sizeMB > MAX_FILE_SIZE_MB) {
            const proceed = confirm(`"${file.name}" is ${sizeMB.toFixed(1)}MB.\n\nLarge files may not persist. Consider using a URL instead.\n\nContinue?`);
            if (!proceed) {
              reject(new Error('User cancelled'));
              return;
            }
          }
          
          // Fall back to data URL
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      // Background image file picker
      const bgFileInput = document.getElementById('djr-bg-file');
      if (bgFileInput) {
        bgFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const dataUrl = await fileToUrl(file);
            document.getElementById('djr-bg-url').value = dataUrl;
            const previewImg = document.getElementById('djr-preview-img');
            const preview = document.getElementById('djr-preview');
            if (previewImg) {
              previewImg.src = dataUrl;
              previewImg.style.display = '';
            }
            if (preview) preview.style.display = 'block';
            applyInstant();
            showToast(`Loaded: ${file.name}`);
          } catch (err) {
            showToast('Failed to load image');
          }
        });
      }
      
      // Background video file picker
      const videoFileInput = document.getElementById('djr-video-file');
      if (videoFileInput) {
        videoFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const dataUrl = await fileToUrl(file);
            document.getElementById('djr-video-url').value = dataUrl;
            applyInstant();
            showToast(`Loaded: ${file.name}`);
          } catch (err) {
            showToast('Failed to load video');
          }
        });
      }
      
      // Carousel image file picker (multiple)
      const carouselImagesInput = document.getElementById('djr-carousel-images');
      if (carouselImagesInput) {
        carouselImagesInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          if (files.length === 0) return;
          try {
            const dataUrls = await Promise.all(files.map(f => fileToUrl(f)));
            const textarea = document.getElementById('djr-carousel-urls');
            const existing = textarea.value.trim();
            const newContent = existing ? existing + '\\n' + dataUrls.join('\\n') : dataUrls.join('\\n');
            textarea.value = newContent;
            applyInstant();
            showToast(`Added ${files.length} image(s)`);
          } catch (err) {
            showToast('Failed to load images');
          }
          // Reset input so same files can be added again
          e.target.value = '';
        });
      }
      
      // Carousel video file picker (multiple)
      const carouselVideosInput = document.getElementById('djr-carousel-videos');
      if (carouselVideosInput) {
        carouselVideosInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          if (files.length === 0) return;
          try {
            const dataUrls = await Promise.all(files.map(f => fileToUrl(f)));
            const textarea = document.getElementById('djr-carousel-urls');
            const existing = textarea.value.trim();
            const newContent = existing ? existing + '\\n' + dataUrls.join('\\n') : dataUrls.join('\\n');
            textarea.value = newContent;
            applyInstant();
            showToast(`Added ${files.length} video(s)`);
          } catch (err) {
            showToast('Failed to load videos');
          }
          e.target.value = '';
        });
      }
      
      // Carousel clear button
      const carouselClearBtn = document.getElementById('djr-carousel-clear');
      if (carouselClearBtn) {
        carouselClearBtn.addEventListener('click', () => {
          document.getElementById('djr-carousel-urls').value = '';
          applyInstant();
          showToast('Carousel cleared');
        });
      }
      
      // Music file picker
      const musicFileInput = document.getElementById('djr-music-file');
      if (musicFileInput) {
        musicFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const dataUrl = await fileToUrl(file);
            document.getElementById('djr-music-url').value = dataUrl;
            applyInstant();
            showToast(`Loaded: ${file.name}`);
          } catch (err) {
            showToast('Failed to load audio');
          }
        });
      }
      
      // Carousel interval slider
      const intervalSlider = document.getElementById('djr-carousel-interval');
      if (intervalSlider) {
        intervalSlider.addEventListener('input', (e) => {
          const label = document.getElementById('djr-interval-value');
          if (label) label.textContent = `${e.target.value}s`;
        });
        intervalSlider.addEventListener('change', applyInstant);
      }
      
      // Opacity slider - instant apply
      const opacitySlider = document.getElementById('djr-bg-opacity');
      if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
          const value = e.target.value;
          const label = document.getElementById('djr-opacity-value');
          const previewImg = document.getElementById('djr-preview-img');
          if (label) label.textContent = `${value}%`;
          if (previewImg) previewImg.style.opacity = value / 100;
        });
        opacitySlider.addEventListener('change', applyInstant);
      }
      
      // SCR checkbox - instant apply
      const scrCheckbox = document.getElementById('djr-scr-enabled');
      if (scrCheckbox) {
        scrCheckbox.addEventListener('change', (e) => {
          applyInstant();
          applySCRSetting(e.target.checked);
        });
      }
      
      // Music URL input with debounce
      const musicInput = document.getElementById('djr-music-url');
      if (musicInput) {
        let musicDebounce = null;
        musicInput.addEventListener('input', () => {
          clearTimeout(musicDebounce);
          musicDebounce = setTimeout(applyInstant, 500);
        });
      }
      
      // Test music button
      const testMusicBtn = document.getElementById('djr-test-music-btn');
      if (testMusicBtn) {
        testMusicBtn.addEventListener('click', () => {
          const musicUrl = document.getElementById('djr-music-url')?.value;
          if (!musicUrl) {
            showToast('Enter a music URL first');
            return;
          }
          // Create or get test audio
          let testAudio = document.getElementById('djrlincs-test-audio');
          if (!testAudio) {
            testAudio = document.createElement('audio');
            testAudio.id = 'djrlincs-test-audio';
            document.body.appendChild(testAudio);
          }
          testAudio.src = musicUrl;
          testAudio.loop = false;
          testAudio.play().then(() => {
            showToast('Playing test audio...');
          }).catch(e => {
            showToast('Failed to play: ' + e.message);
          });
        });
      }
      
      // Stop music button
      const stopMusicBtn = document.getElementById('djr-stop-music-btn');
      if (stopMusicBtn) {
        stopMusicBtn.addEventListener('click', () => {
          // Stop test audio
          const testAudio = document.getElementById('djrlincs-test-audio');
          if (testAudio) {
            testAudio.pause();
            testAudio.currentTime = 0;
          }
          // Stop custom audio
          const customAudio = document.getElementById('djrlincs-custom-audio');
          if (customAudio) {
            customAudio.pause();
          }
          // Stop native audio
          document.querySelectorAll('audio').forEach(a => a.pause());
          showToast('Music stopped');
        });
      }
      
      // Restore default music button
      const restoreMusicBtn = document.getElementById('djr-restore-music-btn');
      if (restoreMusicBtn) {
        restoreMusicBtn.addEventListener('click', () => {
          const musicInput = document.getElementById('djr-music-url');
          if (musicInput) musicInput.value = '';
          
          // Clear and restore
          const settings = getFormSettings();
          settings.customMusicUrl = '';
          saveSettings(settings);
          applyMusicSettings(settings);
          
          showToast('Music restored to default');
        });
      }
      
      // Apply button (still useful for explicit save)
      const applyBtn = document.getElementById('djr-apply-btn');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          applyInstant();
          const settings = getFormSettings();
          applySCRSetting(settings.scrTabEnabled);
          showToast('Settings saved!');
        });
      }
      
      // Reset button
      const resetBtn = document.getElementById('djr-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          saveSettings(defaultSettings);
          applyBackground();
          
          // Reset form
          document.getElementById('djr-scr-enabled').checked = true;
          document.querySelector('input[name="djr-bg-type"][value="default"]').checked = true;
          document.getElementById('djr-bg-url').value = '';
          document.getElementById('djr-video-url').value = '';
          document.getElementById('djr-carousel-urls').value = '';
          document.getElementById('djr-carousel-interval').value = 30;
          document.getElementById('djr-interval-value').textContent = '30s';
          document.getElementById('djr-bg-opacity').value = 100;
          document.getElementById('djr-opacity-value').textContent = '100%';
          document.getElementById('djr-music-url').value = '';
          document.getElementById('djr-preview').style.display = 'none';
          document.getElementById('djr-bg-url-field').style.cssText = 'width: 100%; opacity: 0.5; pointer-events: none;';
          document.getElementById('djr-video-url-field').style.cssText = 'width: 100%; opacity: 0.5; pointer-events: none;';
          document.getElementById('djr-carousel-field').style.cssText = 'width: 100%; opacity: 0.5; pointer-events: none;';
          document.getElementById('djr-carousel-interval-field').style.cssText = 'width: 100%; opacity: 0.5; pointer-events: none;';
          
          // Restore default music
          applyMusicSettings(defaultSettings);
          
          // Trigger SCR tab update
          applySCRSetting(true);
          
          showToast('Settings reset to default');
        });
      }
      
      // ========== Splash Screen Handlers ==========
      let splashImageData = null; // Store the canvas data for download
      let splashTargetPath = 'StarCitizen\\LIVE\\EasyAntiCheat\\SplashScreen.png'; // Default path
      
      // Auto-detect library path using launcher API
      (async () => {
        const pathDisplay = document.getElementById('djr-splash-path');
        if (!pathDisplay) return;
        
        try {
          // Check if launcherAPI is available
          if (window.launcherAPI && window.launcherAPI.storage && window.launcherAPI.storage.getDefaultLibrary) {
            const library = await window.launcherAPI.storage.getDefaultLibrary();
            if (library && library.path) {
              splashTargetPath = library.path + '\\\\StarCitizen\\\\LIVE\\\\EasyAntiCheat\\\\SplashScreen.png';
              pathDisplay.textContent = splashTargetPath;
            } else {
              pathDisplay.textContent = 'StarCitizen\\\\LIVE\\\\EasyAntiCheat\\\\SplashScreen.png';
            }
          } else {
            pathDisplay.textContent = 'StarCitizen\\\\LIVE\\\\EasyAntiCheat\\\\SplashScreen.png';
          }
        } catch (err) {
          console.log('[DJRLincs] Could not detect library path:', err);
          pathDisplay.textContent = 'StarCitizen\\\\LIVE\\\\EasyAntiCheat\\\\SplashScreen.png';
        }
      })();
      
      // Copy path button handler
      const copyPathBtn = document.getElementById('djr-splash-copy-path');
      if (copyPathBtn) {
        copyPathBtn.addEventListener('click', () => {
          // Copy just the folder path, not the filename
          const folderPath = splashTargetPath.replace('\\\\SplashScreen.png', '');
          navigator.clipboard.writeText(folderPath).then(() => {
            showToast('Path copied to clipboard!');
          }).catch(() => {
            showToast('Failed to copy path');
          });
        });
      }
      
      // Splash screen file picker
      const splashFileInput = document.getElementById('djr-splash-file');
      if (splashFileInput) {
        splashFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const dataUrl = await fileToUrl(file);
            document.getElementById('djr-splash-url').value = dataUrl;
            showToast(`Loaded: ${file.name}`);
          } catch (err) {
            showToast('Failed to load image');
          }
        });
      }
      
      // Generate splash preview button
      const splashGenerateBtn = document.getElementById('djr-splash-generate-btn');
      if (splashGenerateBtn) {
        splashGenerateBtn.addEventListener('click', async () => {
          const imgUrl = document.getElementById('djr-splash-url')?.value;
          if (!imgUrl) {
            showToast('Enter an image URL or browse for a file first');
            return;
          }
          
          const canvas = document.getElementById('djr-splash-canvas');
          const preview = document.getElementById('djr-splash-preview');
          const downloadBtn = document.getElementById('djr-splash-download-btn');
          
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          showToast('Loading image...');
          
          img.onload = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 800, 450);
            
            // Calculate scaling to fill 800x450 (crop to fit)
            const sourceRatio = img.width / img.height;
            const targetRatio = 800 / 450;
            
            let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
            
            if (sourceRatio > targetRatio) {
              // Image is wider - crop width
              srcW = img.height * targetRatio;
              srcX = (img.width - srcW) / 2;
            } else {
              // Image is taller - crop height  
              srcH = img.width / targetRatio;
              srcY = (img.height - srcH) / 2;
            }
            
            // Draw cropped and scaled image
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 800, 450);
            
            // Store canvas data for download
            splashImageData = canvas.toDataURL('image/png');
            
            // Show preview and enable download
            preview.style.display = 'block';
            downloadBtn.disabled = false;
            
            showToast('Preview generated! Click Download to save.');
          };
          
          img.onerror = () => {
            showToast('Failed to load image - check URL or try a different image');
            downloadBtn.disabled = true;
          };
          
          img.src = imgUrl;
        });
      }
      
      // Download splash screen button
      const splashDownloadBtn = document.getElementById('djr-splash-download-btn');
      if (splashDownloadBtn) {
        splashDownloadBtn.addEventListener('click', () => {
          if (!splashImageData) {
            showToast('Generate preview first');
            return;
          }
          
          // Create download link
          const link = document.createElement('a');
          link.download = 'SplashScreen.png';
          link.href = splashImageData;
          link.click();
          
          // Copy the folder path to clipboard automatically
          const folderPath = splashTargetPath.replace('\\\\SplashScreen.png', '');
          navigator.clipboard.writeText(folderPath).then(() => {
            showToast('Downloaded! Folder path copied - paste in File Explorer!');
          }).catch(() => {
            showToast('Downloaded! Copy to EasyAntiCheat folder.');
          });
        });
      }
    }, 100);
    
    return content;
  }
  
  // Simple toast notification
  function showToast(message) {
    const toasts = document.querySelector('.sol-c-toasts');
    if (!toasts) return;
    
    const toast = document.createElement('li');
    toast.className = 'sol-c-toast';
    toast.innerHTML = `
      <div class="sol-c-toast__content" style="background: linear-gradient(90deg, #f81f01, #f9004d); padding: 12px 20px; border-radius: 4px;">
        <span class="sol-c-text sol-c-text--body sol-c-text--body-m" style="color: white;">${message}</span>
      </div>
    `;
    toasts.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
  
  // Apply SCR tab setting - show or hide the SCR tab
  function applySCRSetting(enabled) {
    const existingTab = document.querySelector('.scr-tab-btn');
    
    if (enabled) {
      // If enabled and tab doesn't exist, the observer will create it
      // Force a page check to trigger injection
      if (!existingTab) {
        console.log('[DJRLincs] SCR tab enabled, will inject on next page update');
        // Dispatch a custom event that the SCR module can listen for
        window.dispatchEvent(new CustomEvent('djrlincs-scr-enabled'));
      }
    } else {
      // Remove SCR tab if it exists
      if (existingTab) {
        // Close SCR content if it's active
        const scrContent = document.getElementById('scr-content-panel');
        if (scrContent) {
          scrContent.remove();
        }
        // Show original content if hidden
        const originalContent = document.querySelector('.sol-c-game-page__content');
        if (originalContent) {
          originalContent.style.display = '';
        }
        existingTab.remove();
        console.log('[DJRLincs] SCR tab removed');
      }
    }
  }
  
  // Inject DJRLincs Tweaks shortcut into hamburger menu (NOT profile dropdown)
  function injectMenuShortcut() {
    const menu = document.querySelector('.sol-c-menu[role="menu"][data-sol-status="open"]');
    if (!menu) return;
    
    // Skip profile dropdown (has avatar-nickname or avatar-logout test IDs)
    if (menu.querySelector('[data-test-id="avatar-nickname"]') || 
        menu.querySelector('[data-test-id="avatar-logout"]')) {
      return;
    }
    
    // Always check and inject - menu is recreated each time it opens
    if (menu.querySelector('.djrlincs-menu-item')) return;
    
    // Find the Settings button in the menu (first button)
    const settingsBtn = menu.querySelector('button.sol-c-menu__item');
    if (!settingsBtn) return;
    
    // Create our menu item
    const tweaksItem = document.createElement('button');
    tweaksItem.type = 'button';
    tweaksItem.tabIndex = -1;
    tweaksItem.className = 'sol-c-button sol-c-button--align-start sol-c-button--full-width sol-c-button--plain sol-c-menu__item djrlincs-menu-item';
    tweaksItem.setAttribute('role', 'menuitem');
    tweaksItem.innerHTML = `
      <span class="sol-c-text sol-c-text--button sol-c-text--button-m sol-c-text--offset sol-c-button__content" aria-hidden="false"><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f339.svg" alt="" style="width: 1em; height: 1em; vertical-align: -0.1em; margin-right: 0.25em;"><span style="background: linear-gradient(90deg, #f81f01, #f9004d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DJRLincs Tweaks</span></span>
    `;
    
    tweaksItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Close the menu by clicking elsewhere
      document.body.click();
      
      // Navigate to valid settings route first
      window.location.hash = '#/settings';
      
      // Wait for settings page to load, then inject nav and click it
      const waitForSettings = () => {
        const nav = document.querySelector('.sol-c-settings__navigation');
        if (nav) {
          injectTweaksNav();
          setTimeout(() => {
            const tweaksNavItem = document.querySelector('.djrlincs-tweaks-nav');
            if (tweaksNavItem) tweaksNavItem.click();
          }, 50);
        } else {
          setTimeout(waitForSettings, 100);
        }
      };
      setTimeout(waitForSettings, 100);
    });
    
    // Insert after Settings button
    settingsBtn.parentNode.insertBefore(tweaksItem, settingsBtn.nextSibling);
    console.log('[DJRLincs] Menu shortcut injected');
  }
  
  // Inject DJRLincs Tweaks into settings navigation
  function injectTweaksNav() {
    const nav = document.querySelector('.sol-c-settings__navigation');
    if (!nav || document.querySelector('.djrlincs-tweaks-nav')) return false;
    
    // Find the last navigation item
    const navItems = nav.querySelectorAll('.sol-c-settings__item');
    const lastItem = navItems[navItems.length - 1];
    
    if (!lastItem) return false;
    
    // Create DJRLincs Tweaks nav item
    const tweaksNav = document.createElement('a');
    tweaksNav.className = 'sol-c-button sol-c-button--align-start sol-c-button--full-width sol-c-button--plain sol-c-settings__item djrlincs-tweaks-nav';
    tweaksNav.href = '#/settings/djrlincs-tweaks';
    tweaksNav.setAttribute('aria-pressed', 'false');
    tweaksNav.innerHTML = `
      <span class="sol-c-text sol-c-text--button sol-c-text--button-m sol-c-text--offset sol-c-button__content" aria-hidden="false"><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f339.svg" alt="" style="width: 1em; height: 1em; vertical-align: -0.1em; margin-right: 0.25em;"><span style="background: linear-gradient(90deg, #f81f01, #f9004d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">DJRLincs Tweaks</span></span>
    `;
    
    // Insert after last item
    lastItem.parentNode.insertBefore(tweaksNav, lastItem.nextSibling);
    
    // Helper to show our content and hide React's
    function showTweaksContent() {
      const settingsContainer = document.querySelector('.sol-c-settings');
      if (!settingsContainer) return;
      
      // Hide React's content instead of removing it
      const reactContent = settingsContainer.querySelector('.sol-c-settings__content:not(.djrlincs-tweaks-content)');
      if (reactContent) {
        reactContent.style.display = 'none';
        reactContent.classList.add('djrlincs-hidden-content');
      }
      
      // Show or create our content
      let tweaksContent = settingsContainer.querySelector('.djrlincs-tweaks-content');
      if (!tweaksContent) {
        tweaksContent = createTweaksContent();
        settingsContainer.appendChild(tweaksContent);
      }
      tweaksContent.style.display = '';
    }
    
    // Helper to hide our content and restore React's
    function hideTweaksContent() {
      const settingsContainer = document.querySelector('.sol-c-settings');
      if (!settingsContainer) return;
      
      // Hide our content
      const tweaksContent = settingsContainer.querySelector('.djrlincs-tweaks-content');
      if (tweaksContent) {
        tweaksContent.style.display = 'none';
      }
      
      // Restore React's content
      const reactContent = settingsContainer.querySelector('.djrlincs-hidden-content');
      if (reactContent) {
        reactContent.style.display = '';
        reactContent.classList.remove('djrlincs-hidden-content');
      }
      
      // Deselect our nav item
      tweaksNav.setAttribute('aria-pressed', 'false');
      tweaksNav.setAttribute('aria-current', 'false');
      tweaksNav.classList.remove('djrlincs-tweaks-nav-active');
    }
    
    // Handle click on our nav item
    tweaksNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Deselect all native nav items
      nav.querySelectorAll('.sol-c-settings__item:not(.djrlincs-tweaks-nav)').forEach(item => {
        item.setAttribute('aria-pressed', 'false');
        item.setAttribute('aria-current', 'false');
      });
      
      // Select this nav item visually
      tweaksNav.setAttribute('aria-pressed', 'true');
      tweaksNav.setAttribute('aria-current', 'true');
      tweaksNav.classList.add('djrlincs-tweaks-nav-active');
      
      showTweaksContent();
    });
    
    // Listen for clicks on other nav items to restore React content
    nav.querySelectorAll('.sol-c-settings__item:not(.djrlincs-tweaks-nav)').forEach(item => {
      item.addEventListener('click', () => {
        hideTweaksContent();
      });
    });
    
    console.log('[DJRLincs] Tweaks nav injected');
    return true;
  }
  
  // Watch for settings page and apply background
  function initTweaks() {
    console.log('[DJRLincs] Initializing tweaks...');
    
    // Store original sources first
    storeOriginalSources();
    
    // Apply saved settings
    applyBackground();
    
    // Try to inject nav if on settings page
    if (window.location.hash.startsWith('#/settings')) {
      injectTweaksNav();
    }
  }
  
  // Watch for game page background to appear and store original sources
  function waitForGamePage() {
    const bgContainer = document.querySelector('.sol-c-game-page__background');
    if (bgContainer) {
      console.log('[DJRLincs] Game page background found, initializing...');
      storeOriginalSources();
      applyBackground();
    }
  }
  
  // Main observer for page changes
  function setupObserver() {
    let lastHash = window.location.hash;
    let bgApplied = false;
    
    const observer = new MutationObserver((mutations) => {
      // Check for settings navigation
      if (window.location.hash.startsWith('#/settings')) {
        injectTweaksNav();
      }
      
      // Check for hamburger menu opening - look for menu status changes
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-sol-status') {
          const target = mutation.target;
          if (target.matches && target.matches('.sol-c-menu[role="menu"]') && target.getAttribute('data-sol-status') === 'open') {
            // Menu just opened, inject with small delay to ensure it's populated
            setTimeout(injectMenuShortcut, 10);
          }
        }
        // Also check for new menu nodes being added
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches && node.matches('.sol-c-menu[role="menu"][data-sol-status="open"]')) {
                setTimeout(injectMenuShortcut, 10);
              } else if (node.querySelector && node.querySelector('.sol-c-menu[role="menu"][data-sol-status="open"]')) {
                setTimeout(injectMenuShortcut, 10);
              }
            }
          });
        }
      }
      
      // Also call it directly on any mutation (fallback)
      injectMenuShortcut();
      
      // Check for game page background (may appear after navigation)
      const bgContainer = document.querySelector('.sol-c-game-page__background');
      if (bgContainer && !bgApplied) {
        storeOriginalSources();
        applyBackground();
        bgApplied = true;
      }
      
      // Reset flag if hash changed (navigated away)
      if (lastHash !== window.location.hash) {
        lastHash = window.location.hash;
        bgApplied = false;
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sol-status'] });
  }
  
  // Initialize on various load events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initTweaks, 500);
      setTimeout(waitForGamePage, 1000);
      setupObserver();
    });
  } else {
    setTimeout(initTweaks, 500);
    setTimeout(waitForGamePage, 1000);
    setupObserver();
  }
  
  window.addEventListener('load', () => {
    setTimeout(initTweaks, 1000);
    setTimeout(waitForGamePage, 1500);
  });
  
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      if (window.location.hash.startsWith('#/settings')) {
        injectTweaksNav();
      }
      waitForGamePage();
    }, 300);
  });
  
  console.log('[DJRLincs] Tweaks module loaded');
})();
