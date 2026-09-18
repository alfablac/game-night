// ==UserScript==
// @name         DODI Repacks Modern UI & Shortlink Bypass
// @namespace    dodi.modern.ui
// @version      1.5.4
// @description  Modern responsive dark UI for DODI Repacks using Inter typography, exact ElAmigos card layout (poster + description + compact collapsible sections for Information, Repack Features, Backwards Compatibility & Download Links), enlarged game details modal for Free Activation, Exclusive & Trending tabs, persistent pinned posts across pagination and search, auto-loading search 5-by-5, IndexedDB persistent link cache, batch mirror resolution, and direct background HTTP shortlink bypass.
// @author       alfablac
// @downloadURL  https://raw.githubusercontent.com/alfablac/game-night/main/dodi.user.js
// @updateURL    https://raw.githubusercontent.com/alfablac/game-night/main/dodi.user.js
// @match        https://dodi-repacks.site/*
// @match        https://www.dodi-repacks.site/*
// @match        *://go.zovo.ink/*
// @match        *://zovo2.top/*
// @match        *://*.zovo.ink/*
// @match        *://*.zovo2.top/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @connect      dodi-repacks.site
// @connect      www.dodi-repacks.site
// @connect      game-repack.site
// @connect      zovo.ink
// @connect      go.zovo.ink
// @connect      zovo2.top
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /* =========================================================================
       1. INDEXEDDB PERSISTENT STORAGE FOR PARSED ZOVO LINKS
       ========================================================================= */
    var dbPromise = null;
    function getDB() {
        if (!dbPromise) {
            dbPromise = new Promise(function (resolve, reject) {
                if (!window.indexedDB) {
                    return reject(new Error('IndexedDB not supported'));
                }
                var req = indexedDB.open('DODICacheDB', 1);
                req.onupgradeneeded = function (e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains('zovo_links')) {
                        db.createObjectStore('zovo_links', { keyPath: 'zovoUrl' });
                    }
                };
                req.onsuccess = function (e) {
                    resolve(e.target.result);
                };
                req.onerror = function (e) {
                    reject(e.target.error);
                };
            });
        }
        return dbPromise;
    }

    function idbGetZovo(zovoUrl) {
        return getDB().then(function (db) {
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction('zovo_links', 'readonly');
                    var store = tx.objectStore('zovo_links');
                    var cleanKey = (zovoUrl || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
                    var normUrl = (zovoUrl || '').replace(/^http:\/\//i, 'https://');
                    var req1 = store.get(zovoUrl);
                    req1.onsuccess = function () {
                        if (req1.result && req1.result.targetUrl) {
                            return resolve(req1.result.targetUrl);
                        }
                        try {
                            var req2 = store.get(cleanKey);
                            req2.onsuccess = function () {
                                if (req2.result && req2.result.targetUrl) {
                                    return resolve(req2.result.targetUrl);
                                }
                                try {
                                    var req3 = store.get(normUrl);
                                    req3.onsuccess = function () {
                                        resolve(req3.result ? req3.result.targetUrl : null);
                                    };
                                    req3.onerror = function () { resolve(null); };
                                } catch (e3) {
                                    resolve(null);
                                }
                            };
                            req2.onerror = function () { resolve(null); };
                        } catch (e2) {
                            resolve(null);
                        }
                    };
                    req1.onerror = function () { resolve(null); };
                } catch (e) {
                    resolve(null);
                }
            });
        }).catch(function () { return null; });
    }

    function idbSetZovo(zovoUrl, targetUrl) {
        return getDB().then(function (db) {
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction('zovo_links', 'readwrite');
                    var store = tx.objectStore('zovo_links');
                    var cleanKey = (zovoUrl || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
                    store.put({ zovoUrl: zovoUrl, targetUrl: targetUrl, time: Date.now() });
                    store.put({ zovoUrl: cleanKey, targetUrl: targetUrl, time: Date.now() });
                    tx.oncomplete = function () { resolve(true); };
                    tx.onerror = function () { resolve(false); };
                } catch (e) {
                    resolve(false);
                }
            });
        }).catch(function () { return false; });
    }

    /* =========================================================================
       2. ZOVO SHORTLINK AUTO-BYPASS ENGINE (Active on Zovo domains)
       ========================================================================= */
    var isZovoDomain = /(?:^|\.)(?:zovo\.(?:ink|top)|zovo2\.top|go\.zovo\.ink)$/i.test(location.hostname) ||
                       /zovo/i.test(location.hostname);

    if (isZovoDomain) {
        runZovoBypass();
        return;
    }

    function runZovoBypass() {
        console.log('[DODI Bypass] Zovo bypass active on', location.href);

        var noop = function () {};

        // 1. Prevent countdown pause: neutralize window.blurred
        try {
            Object.defineProperty(window, 'blurred', {
                get: function () { return false; },
                set: noop,
                configurable: true
            });
        } catch (e) {
            window.blurred = false;
        }
        window.onblur = null;

        // 2. Prevent rogue ad scripts from closing the window or tab
        try {
            if (typeof unsafeWindow !== 'undefined') {
                Object.defineProperty(unsafeWindow, 'close', {
                    get: function () { return function () { console.log('[DODI Bypass] Intercepted and blocked unsafeWindow.close()'); }; },
                    set: noop,
                    configurable: true
                });
            }
        } catch (e) {}
        window.close = function () {
            console.log('[DODI Bypass] Intercepted and blocked window.close()');
        };

        // 3. Suppress popup ads safely without redirecting the main window
        var dummyWin = { focus: noop, blur: noop, close: noop, closed: false };
        try {
            if (typeof unsafeWindow !== 'undefined') {
                unsafeWindow.open = function () {
                    console.log('[DODI Bypass] Blocked unsafeWindow.open popup');
                    return dummyWin;
                };
            }
        } catch (e) {}
        window.open = function () {
            console.log('[DODI Bypass] Blocked window.open popup');
            return dummyWin;
        };

        // 4. Prevent anti-adblock replacement of the download button
        function ensureFakeAdBanner() {
            if (!document.getElementById('ad-banner')) {
                var ad = document.createElement('div');
                ad.id = 'ad-banner';
                ad.className = 'ad-banner ad-box';
                ad.style.cssText = 'height:10px;width:10px;position:absolute;top:0;opacity:0.01;pointer-events:none;z-index:99999;';
                (document.body || document.documentElement).appendChild(ad);
            }
        }
        ensureFakeAdBanner();

        // 5. Intercept XMLHttpRequest to catch /links/go AJAX JSON responses instantly
        var resolved = false;

        function purgeAndUnlockGetLink(targetUrl) {
            var oldLinks = document.querySelectorAll('a.get-link');
            oldLinks.forEach(function (old) {
                var clone = old.cloneNode(true);
                clone.href = targetUrl;
                clone.classList.remove('disabled');
                clone.innerText = 'Get Link';
                clone.style.cssText = 'pointer-events:auto !important; cursor:pointer !important; opacity:1 !important; background:#28a745 !important; color:#ffffff !important; display:inline-block !important;';
                clone.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[DODI Bypass] Get Link clicked -> Navigating directly to', targetUrl);
                    window.location.assign(targetUrl);
                };
                if (old.parentNode) {
                    old.parentNode.replaceChild(clone, old);
                }
            });
        }

        function notifyResolved(targetUrl) {
            if (resolved || !targetUrl || targetUrl.includes('javascript:') || targetUrl.includes('/undefined')) return;
            resolved = true;
            console.log('[DODI Bypass] Destination link resolved:', targetUrl);

            var cleanKey = (location.href || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();

            // Store in GM storage & IndexedDB
            if (typeof GM_setValue === 'function') {
                try {
                    GM_setValue('dodi_zovo_' + location.href, targetUrl);
                    GM_setValue('dodi_zovo_' + cleanKey, targetUrl);
                    GM_setValue('dodi_zovo_latest', { orig: location.href, target: targetUrl, time: Date.now() });
                } catch (e) {}
            }
            idbSetZovo(location.href, targetUrl);

            // Replace button and purge rogue click listeners
            purgeAndUnlockGetLink(targetUrl);

            // Automatically redirect tab
            showHud('Link unlocked! Redirecting...');
            setTimeout(function () {
                window.location.assign(targetUrl);
            }, 600);
        }

        var origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                try {
                    var data = JSON.parse(this.responseText);
                    if (data && data.url) {
                        notifyResolved(data.url);
                    }
                } catch (e) {}
            });
            return origSend.apply(this, arguments);
        };

        // UI HUD
        function showHud(msg) {
            var hud = document.getElementById('dodi-zovo-hud');
            if (!hud) {
                hud = document.createElement('div');
                hud.id = 'dodi-zovo-hud';
                hud.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;padding:10px 16px;background:#17212b;color:#e8f5fa;border:1px solid #3f5a6d;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.6);font-family:Inter,sans-serif;font-size:13px;display:flex;align-items:center;gap:8px;';
                (document.body || document.documentElement).appendChild(hud);
            }
            hud.innerHTML = '<span style="color:#82d8ff;font-weight:700;">&gt;</span> <span>' + msg + '</span>';
        }

        function onReady() {
            ensureFakeAdBanner();
            showHud('Bypassing Zovo shortlink...');

            // Step 1: Check for continue button
            var page1Timer = setInterval(function () {
                var btn = document.querySelector('#form-continue button, button.btn:nth-child(4), button.btn-primary[type="submit"], #form-continue input[type="submit"]');
                var form = document.querySelector('#form-continue');
                if (btn) {
                    clearInterval(page1Timer);
                    showHud('Step 1: Submitting continue form...');
                    btn.click();
                } else if (form) {
                    clearInterval(page1Timer);
                    showHud('Step 1: Submitting continue form...');
                    form.submit();
                }
            }, 100);
            setTimeout(function () { clearInterval(page1Timer); }, 6000);

            // Step 2: Allow the 5-second countdown to progress naturally without "Bad Request."
            var page2Timer = setInterval(function () {
                ensureFakeAdBanner();

                // Check for unlocked link
                var link = document.querySelector('a.get-link:not(.disabled), a.get-link[href^="http"]:not([href*="javascript:"])');
                if (link && link.href && !link.href.includes('javascript:') && !link.href.includes('/undefined')) {
                    clearInterval(page2Timer);
                    notifyResolved(link.href);
                }

                // If link button says "Get Link" and has http href
                var anyGetLink = document.querySelector('a.get-link');
                if (anyGetLink && anyGetLink.textContent.includes('Get Link')) {
                    if (anyGetLink.href && anyGetLink.href.startsWith('http') && !anyGetLink.href.includes('javascript:')) {
                        clearInterval(page2Timer);
                        notifyResolved(anyGetLink.href);
                    }
                }
            }, 300);

            // Safety fallback: if after 6.5 seconds the form hasn't submitted yet, trigger submit
            setTimeout(function () {
                var goLink = document.querySelector('#go-link');
                if (goLink && !goLink.dataset.dodiSubmitted && !resolved) {
                    goLink.dataset.dodiSubmitted = '1';
                    goLink.classList.add('go-link');
                    showHud('Step 2: Requesting destination link...');
                    if (window.$ && typeof window.$.fn.submit === 'function') {
                        window.$('#go-link.go-link').submit();
                    } else {
                        goLink.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                }
            }, 6500);

            setTimeout(function () { clearInterval(page2Timer); }, 30000);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady, { once: true });
        } else {
            onReady();
        }
    }

    /* =========================================================================
       3. DODI REPACKS MODERN UI APPLICATION
       ========================================================================= */

    // Re-enable contextmenu and text dragging
    window.addEventListener('contextmenu', function (e) {
        e.stopImmediatePropagation();
    }, true);
    document.oncontextmenu = null;
    document.ondragstart = null;

    // Standalone Inline SVG Icons (100% reliable, zero external font dependencies)
    var SVG_ICONS = {
        search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        download: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        open_in_new: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
        copy: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
        bolt: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
        chevron_down: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" class="dodi-chevron"><polyline points="6 9 12 15 18 9"/></svg>',
        star: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        fire: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.18-.6-1.61L12 11.88l-.9 1.01c-.38.43-.6 1-.6 1.61zM12 2c-.3 0-.6.1-.85.3A12.7 12.7 0 0 0 7 10.4c0 3.65 2.24 6.78 5 7.6 2.76-.82 5-3.95 5-7.6 0-3.3-1.85-6.27-4.15-8.1A1.4 1.4 0 0 0 12 2z"/></svg>',
        lock_open: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
        view_quilt: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
        check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        close: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        apps: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        info: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        help: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    function svg(name) {
        var markup = SVG_ICONS[name] || '';
        var span = document.createElement('span');
        span.className = 'dodi-svg-icon';
        span.innerHTML = markup;
        return span;
    }

    // DOM Utilities
    var q = function (selector, root) { return (root || document).querySelector(selector); };
    var qa = function (selector, root) { return [].slice.call((root || document).querySelectorAll(selector)); };
    var txt = function (el) { return (el ? el.textContent || '' : '').replace(/\s+/g, ' ').trim(); };
    var abs = function (url, base) {
        try { return new URL(url, base || location.href).href; } catch (e) { return url || ''; }
    };

    var E = function (tag, attributes, children) {
        var el = document.createElement(tag);
        var attrs = attributes || {};
        Object.keys(attrs).forEach(function (name) {
            if (name === 'text') {
                el.textContent = attrs[name];
            } else if (name === 'html') {
                el.innerHTML = attrs[name];
            } else if (name.slice(0, 2) === 'on') {
                el.addEventListener(name.slice(2), attrs[name]);
            } else if (name === 'style' && typeof attrs[name] === 'object') {
                Object.assign(el.style, attrs[name]);
            } else {
                el.setAttribute(name, attrs[name]);
            }
        });
        (children || []).forEach(function (child) {
            if (child != null) {
                if (child.nodeType) {
                    el.appendChild(child);
                } else if (typeof child === 'string' || typeof child === 'number') {
                    el.appendChild(document.createTextNode(String(child)));
                }
            }
        });
        return el;
    };

    function showToast(message, duration) {
        var existing = document.getElementById('dodi-toast');
        if (existing) existing.remove();
        var toast = E('div', { id: 'dodi-toast', class: 'dodi-toast', text: message });
        document.body.append(toast);
        requestAnimationFrame(function () { toast.classList.add('show'); });
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, duration || 2500);
    }

    function copyText(str) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(str);
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(str);
        } else {
            var ta = document.createElement('textarea');
            ta.value = str;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
    }

    // Load Google Fonts Inter via <link>
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    (document.head || document.documentElement).append(fontLink);

    // CSS Styles - Compact FitGirl details.fg-extra & ElAmigos Cards
    var styles = `
        :root {
            color-scheme: dark;
            --dodi-font: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --dodi-bg: #111822;
            --dodi-surface: #17212b;
            --dodi-panel: #1b2632;
            --dodi-panel-raised: #243140;
            --dodi-panel-hover: #2b3a4a;
            --dodi-border: #2b3a48;
            --dodi-border-strong: #3f5a6d;
            --dodi-text: #e8f5fa;
            --dodi-text-strong: #ffffff;
            --dodi-muted: #8ca3b3;
            --dodi-accent: #82d8ff;
            --dodi-green: #81d742;
            --dodi-green-dark: #224222;
            --dodi-purple: #c084fc;
            --dodi-gold: #fbbf24;
            --dodi-red: #ff5e5e;
        }

        html.dodi-on {
            background: var(--dodi-bg) !important;
            overflow-y: scroll !important;
            scrollbar-gutter: stable;
        }

        html.dodi-on body {
            margin: 0 !important;
            padding: 0 !important;
            background: var(--dodi-bg) !important;
            color: var(--dodi-text) !important;
            font: 14px/1.5 var(--dodi-font) !important;
            -webkit-font-smoothing: antialiased;
        }

        html.dodi-on body > *:not(#dodi-app):not(.dodi-toast) {
            display: none !important;
        }

        #dodi-app {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: var(--dodi-bg);
            color: var(--dodi-text);
            font-family: var(--dodi-font);
        }

        .dodi-svg-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            flex-shrink: 0;
        }

        .dodi-svg-icon svg {
            display: block;
        }

        /* Header Navigation */
        .dodi-head-wrap {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(23, 33, 43, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--dodi-border);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .dodi-head {
            max-width: 1440px;
            margin: 0 auto;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .dodi-brand-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .dodi-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            color: var(--dodi-text-strong);
            font-weight: 800;
            font-size: 19px;
            letter-spacing: -0.3px;
        }

        .dodi-brand-logo {
            background: linear-gradient(135deg, #82d8ff 0%, #3b82f6 100%);
            color: #0b131e;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 0.5px;
        }

        .dodi-brand-badge {
            background: rgba(130, 216, 255, 0.12);
            color: var(--dodi-accent);
            border: 1px solid rgba(130, 216, 255, 0.3);
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 600;
        }

        /* Search Bar with zero icon overlap */
        .dodi-search-bar {
            flex: 1;
            max-width: 540px;
            position: relative;
            display: flex;
            align-items: center;
        }

        .dodi-search-icon {
            position: absolute !important;
            left: 12px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: var(--dodi-muted) !important;
            pointer-events: none !important;
            z-index: 10 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        .dodi-search-input {
            width: 100% !important;
            height: 38px !important;
            padding: 0 75px 0 38px !important;
            background: var(--dodi-panel) !important;
            border: 1px solid var(--dodi-border) !important;
            border-radius: 10px !important;
            color: var(--dodi-text-strong) !important;
            font-size: 13.5px !important;
            box-sizing: border-box !important;
            outline: none !important;
            margin: 0 !important;
            line-height: normal !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }

        .dodi-search-input::placeholder {
            color: var(--dodi-muted) !important;
            opacity: 1 !important;
        }

        .dodi-search-input:focus {
            border-color: var(--dodi-accent) !important;
            box-shadow: 0 0 0 3px rgba(130, 216, 255, 0.15) !important;
            background: var(--dodi-panel-raised) !important;
        }

        .dodi-search-btn {
            position: absolute !important;
            right: 4px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 10 !important;
            height: 30px !important;
            padding: 0 10px !important;
            background: var(--dodi-panel-raised) !important;
            border: 1px solid var(--dodi-border-strong) !important;
            border-radius: 7px !important;
            color: var(--dodi-text) !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
        }

        .dodi-search-btn:hover {
            background: var(--dodi-accent) !important;
            border-color: var(--dodi-accent) !important;
            color: #0b131e !important;
        }

        .dodi-btn-toggle {
            padding: 7px 12px;
            border-radius: 8px;
            background: var(--dodi-panel);
            border: 1px solid var(--dodi-border);
            color: var(--dodi-muted);
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .dodi-btn-toggle:hover {
            border-color: var(--dodi-border-strong);
            color: var(--dodi-text-strong);
            background: var(--dodi-panel-raised);
        }

        /* Nav Tabs Bar */
        .dodi-nav-bar {
            background: var(--dodi-surface);
            border-bottom: 1px solid var(--dodi-border);
        }

        .dodi-tabs-wrap {
            max-width: 1440px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .dodi-tabs-wrap::-webkit-scrollbar { display: none; }

        .dodi-tab {
            padding: 11px 16px;
            color: var(--dodi-muted);
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border-bottom: 2.5px solid transparent;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s ease;
        }

        .dodi-tab:hover {
            color: var(--dodi-text-strong);
            background: rgba(255, 255, 255, 0.03);
        }

        .dodi-tab.active {
            color: var(--dodi-accent);
            border-bottom-color: var(--dodi-accent);
            background: rgba(130, 216, 255, 0.06);
        }

        .dodi-tab-badge {
            background: var(--dodi-panel-raised);
            border: 1px solid var(--dodi-border-strong);
            color: var(--dodi-text);
            font-size: 11px;
            padding: 1px 6px;
            border-radius: 999px;
            font-weight: 600;
        }

        /* Main View Container */
        .dodi-main {
            flex: 1;
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
            padding: 20px 20px 60px;
        }

        .dodi-section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 12px;
        }

        .dodi-section-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--dodi-text-strong);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .dodi-section-desc {
            color: var(--dodi-muted);
            font-size: 12px;
            margin-top: 3px;
        }

        /* =========================================================================
           ELAMIGOS-STYLE CARD LAYOUT (.ea-card & .ea-panel)
           ========================================================================= */
        .dodi-cards-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
        }

        @media (min-width: 900px) {
            .dodi-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        .ea-card {
            margin: 0;
            padding: 12px;
            background: var(--dodi-panel);
            border: 1px solid var(--dodi-border);
            border-radius: 10px;
            box-shadow: inset 0 1px #ffffff08, 0 4px 12px rgba(0, 0, 0, 0.25);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ea-card:hover {
            border-color: var(--dodi-border-strong);
            box-shadow: inset 0 1px #ffffff0d, 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .ea-panel {
            display: grid;
            grid-template-columns: 140px minmax(0, 1fr);
            grid-template-areas:
                "title title"
                "poster info"
                "collapsible collapsible";
            gap: 10px;
        }

        .ea-title {
            grid-area: title;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .ea-title-text {
            font-size: 14.5px;
            font-weight: 700;
            color: var(--dodi-text-strong);
            line-height: 1.35;
            margin: 0;
        }

        .ea-title-text a {
            color: var(--dodi-text-strong);
            text-decoration: none;
        }

        .ea-title-text a:hover {
            color: var(--dodi-accent);
        }

        .ea-meta-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .ea-badge {
            padding: 2px 7px;
            border: 1px solid var(--dodi-border-strong);
            border-radius: 999px;
            background: var(--dodi-panel-raised);
            color: var(--dodi-text);
            font-size: 10.5px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .ea-badge-repack {
            border-color: var(--dodi-accent);
            color: var(--dodi-accent);
            background: rgba(130, 216, 255, 0.1);
        }

        .ea-badge-green {
            border-color: var(--dodi-green);
            color: var(--dodi-green);
            background: rgba(129, 215, 66, 0.1);
        }

        .ea-poster {
            grid-area: poster;
            min-width: 0;
        }

        .ea-cover {
            width: 100%;
            aspect-ratio: 3 / 4;
            object-fit: cover;
            border-radius: 7px;
            background: var(--dodi-panel-raised);
            border: 1px solid var(--dodi-border);
            display: block;
        }

        .ea-poster-ph {
            width: 100%;
            aspect-ratio: 3 / 4;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--dodi-panel-raised);
            border: 1px solid var(--dodi-border);
            border-radius: 7px;
            color: var(--dodi-muted);
            font-size: 26px;
            font-weight: 700;
        }

        .ea-info-column {
            grid-area: info;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 5px;
            font-size: 12px;
            line-height: 1.4;
        }

        .ea-specs {
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin: 0;
        }

        .ea-spec {
            font-size: 12px;
            color: var(--dodi-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .ea-spec b {
            color: var(--dodi-muted);
            font-weight: 600;
            margin-right: 5px;
        }

        .ea-spec span {
            color: var(--dodi-text-strong);
        }

        .ea-description-snippet {
            color: var(--dodi-muted);
            font-size: 11.5px;
            line-height: 1.4;
            margin-top: 3px;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.15);
            padding: 5px 7px;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        /* =========================================================================
           COMPACT COLLAPSIBLE SECTIONS (Information, Features, Backwards, Downloads)
           Clean, sleek, white text with preserved red warnings
           ========================================================================= */
        .ea-collapsible-stack {
            grid-area: collapsible;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 2px;
        }

        details.fg-extra {
            background: #1b2632 !important;
            border: 1px solid #3a4d5d !important;
            border-radius: 8px !important;
            margin: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }

        details.fg-extra > summary {
            background: #243140 !important;
            color: #e8f5fa !important;
            list-style: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: left !important;
            margin: 0 !important;
            padding: .45rem .75rem !important;
            cursor: pointer !important;
            font: 600 12.5px Inter, sans-serif !important;
            user-select: none !important;
            transition: background 0.15s ease, color 0.15s ease !important;
        }

        details.fg-extra > summary:hover {
            background: #2c7894 !important;
            color: #fff !important;
        }

        details.fg-extra[open] > summary {
            border-bottom: 1px solid #3a4d5d !important;
        }

        details.fg-extra > summary::-webkit-details-marker {
            display: none !important;
        }

        details.fg-extra > summary .dodi-chevron {
            transition: transform 0.2s ease;
        }

        details.fg-extra[open] > summary .dodi-chevron {
            transform: rotate(180deg);
        }

        .ea-section-summary-left {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .ea-section-summary-count {
            background: rgba(130, 216, 255, 0.15);
            color: var(--dodi-accent);
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
        }

        /* Compact, clean typography inside collapsible bodies */
        .fg-extra-body {
            margin: 0 !important;
            padding: .45rem .75rem !important;
            font-size: 12px !important;
            line-height: 1.45 !important;
            color: #e8f5fa !important;
            font-family: var(--dodi-font) !important;
            overflow-x: auto;
        }

        .fg-extra-body *:not(.ea-btn):not(.ea-btn *):not(a) {
            color: #e8f5fa !important;
            font-size: 12px !important;
            line-height: 1.45 !important;
            font-family: var(--dodi-font) !important;
        }

        .fg-extra-body strong,
        .fg-extra-body b {
            color: #ffffff !important;
            font-weight: 700 !important;
        }

        /* Preserve ONLY red warnings */
        .fg-extra-body .dodi-warning,
        .fg-extra-body [style*="color: #ff0000"],
        .fg-extra-body [style*="color:#ff0000"],
        .fg-extra-body [style*="color: #f00"],
        .fg-extra-body [style*="color:#f00"],
        .fg-extra-body [style*="color: red"],
        .fg-extra-body [style*="color:red"],
        .fg-extra-body [style*="rgb(255, 0, 0)"],
        .fg-extra-body [style*="rgb(255,0,0)"] {
            color: #ff5e5e !important;
            font-weight: 700 !important;
        }

        .fg-extra-body p {
            margin: 0 0 4px 0 !important;
        }

        .fg-extra-body p:last-child {
            margin-bottom: 0 !important;
        }

        .fg-extra-body ul, .fg-extra-body ol {
            margin: 0 0 4px 0 !important;
            padding-left: 18px !important;
        }

        .fg-extra-body a {
            color: var(--dodi-accent) !important;
            text-decoration: underline !important;
        }

        /* Backwards Compatibility special highlight styling from fit.user.js */
        details.fg-extra.fg-backwards {
            background: #223442 !important;
            border-color: #6a8ca3 !important;
            border-left: 3px solid #82b8d3 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }

        details.fg-extra.fg-backwards > summary {
            background: #304b5c !important;
            color: #f0f8fc !important;
        }

        details.fg-extra.fg-backwards > summary:hover {
            background: #3a5b70 !important;
            color: #fff !important;
        }

        /* Batch Resolve Toolbar */
        .ea-dl-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--dodi-border);
            flex-wrap: wrap;
        }

        .ea-dl-toolbar-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--dodi-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 2px;
        }

        /* Download Links rows */
        .ea-dl-cat-title {
            font-size: 11.5px;
            font-weight: 700;
            color: var(--dodi-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 5px 0 2px 0;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .ea-dl-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            padding: 5px 8px;
            background: var(--dodi-panel);
            border: 1px solid var(--dodi-border);
            border-radius: 6px;
            flex-wrap: wrap;
            margin-bottom: 4px;
        }

        .ea-dl-title {
            font-size: 11.5px;
            font-weight: 600;
            color: var(--dodi-text-strong);
            max-width: 55%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .ea-dl-actions {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }

        /* Buttons with guaranteed non-clashing colors (NO white-on-white) */
        .ea-btn {
            display: inline-flex !important;
            align-items: center !important;
            gap: 5px !important;
            padding: 3px 8px !important;
            border: 1px solid var(--dodi-border-strong) !important;
            border-radius: 5px !important;
            background: #243140 !important;
            color: #e8f5fa !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            text-decoration: none !important;
            line-height: 1.3 !important;
            transition: all 0.15s ease !important;
            box-shadow: none !important;
        }

        .ea-btn:hover {
            border-color: var(--dodi-accent) !important;
            color: #ffffff !important;
            background: #2c3e50 !important;
        }

        .ea-btn-direct {
            background: #193a21 !important;
            border-color: #81d742 !important;
            color: #c9f7a6 !important;
        }

        .ea-btn-direct:hover {
            background: #255230 !important;
            color: #ffffff !important;
        }

        .ea-btn-zovo {
            background: #173244 !important;
            border-color: #3b82f6 !important;
            color: #bde9ff !important;
        }

        .ea-btn-zovo:hover {
            background: #20455d !important;
            border-color: var(--dodi-accent) !important;
            color: #ffffff !important;
        }

        .ea-btn-resolve {
            background: #2c2710 !important;
            border-color: #8c7924 !important;
            color: #ffe66d !important;
        }

        .ea-btn-resolve:hover {
            background: #423b18 !important;
            border-color: #fbbf24 !important;
            color: #ffffff !important;
        }

        .ea-btn-resolve span, .ea-btn-resolve svg {
            color: #ffe66d !important;
            fill: currentColor !important;
        }

        .ea-btn-resolve:hover span, .ea-btn-resolve:hover svg {
            color: #ffffff !important;
            fill: currentColor !important;
        }

        .ea-btn-resolve:disabled,
        .ea-btn-resolve[disabled] {
            background: #1f1b0a !important;
            border-color: #554a16 !important;
            color: #b5a44c !important;
            opacity: 0.75 !important;
            cursor: wait !important;
            pointer-events: none !important;
        }

        .ea-btn-resolve:disabled span,
        .ea-btn-resolve:disabled svg {
            color: #b5a44c !important;
        }

        .ea-btn:disabled,
        .ea-btn[disabled] {
            opacity: 0.65 !important;
            cursor: wait !important;
            pointer-events: none !important;
        }

        .ea-btn-copy {
            padding: 3px 6px !important;
            background: #1b2632 !important;
            border: 1px solid #3a4d5d !important;
            color: #8ca3b3 !important;
        }

        .ea-btn-copy:hover {
            background: #243140 !important;
            border-color: #82d8ff !important;
            color: #ffffff !important;
        }

        .ea-btn-copy span, .ea-btn-copy svg {
            color: inherit !important;
            stroke: currentColor !important;
        }

        .ea-btn-resolve-all {
            background: #1c2b38 !important;
            border: 1px solid #3b82f6 !important;
            color: #82d8ff !important;
            padding: 3px 8px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            border-radius: 5px !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            transition: all 0.15s ease !important;
        }

        .ea-btn-resolve-all:hover {
            background: #274157 !important;
            color: #ffffff !important;
            border-color: #82d8ff !important;
        }

        .ea-btn-primary {
            background: #173244 !important;
            border-color: #3b82f6 !important;
            color: #bde9ff !important;
        }

        .ea-btn-primary:hover {
            background: #20455d !important;
            border-color: var(--dodi-accent) !important;
            color: #ffffff !important;
        }

        .ea-btn-ghost {
            background: transparent !important;
            border-color: var(--dodi-border) !important;
            color: var(--dodi-muted) !important;
            padding: 3px 6px !important;
        }

        .ea-btn-ghost:hover {
            background: var(--dodi-panel-raised) !important;
            border-color: var(--dodi-border-strong) !important;
            color: var(--dodi-text-strong) !important;
        }

        .dodi-clickable-card {
            cursor: pointer;
        }

        .dodi-clickable-card:hover {
            border-color: var(--dodi-accent) !important;
        }

        /* Ranked Trending Items */
        .dodi-ranked-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .dodi-ranked-card {
            background: var(--dodi-panel);
            border: 1px solid var(--dodi-border);
            border-radius: 10px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.15s ease;
        }

        .dodi-ranked-card:hover {
            border-color: var(--dodi-border-strong);
            background: var(--dodi-panel-raised);
            transform: translateX(4px);
        }

        .dodi-rank-num {
            font-size: 15px;
            font-weight: 800;
            min-width: 32px;
            height: 32px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--dodi-panel-raised);
            border: 1px solid var(--dodi-border);
            color: var(--dodi-muted);
        }

        .dodi-rank-top1 {
            background: #4a280c;
            border-color: var(--dodi-gold);
            color: var(--dodi-gold);
        }

        .dodi-rank-top2 {
            background: #252e3d;
            border-color: #8da4be;
            color: #edf3fb;
        }

        .dodi-rank-top3 {
            background: #3b1d12;
            border-color: #cb7445;
            color: #ffd8c4;
        }

        .dodi-ranked-info {
            flex: 1;
            min-width: 0;
        }

        .dodi-ranked-title {
            font-size: 13.5px;
            font-weight: 700;
            color: var(--dodi-text-strong);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dodi-ranked-title a {
            color: inherit;
            text-decoration: none;
        }

        .dodi-ranked-title a:hover {
            color: var(--dodi-accent);
        }

        /* Search Results View */
        .dodi-search-summary {
            background: var(--dodi-surface);
            border: 1px solid var(--dodi-border);
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }

        .dodi-load-more-btn {
            width: 100%;
            margin-top: 20px;
            padding: 12px 18px;
            background: var(--dodi-surface);
            border: 1.5px solid var(--dodi-border-strong);
            border-radius: 8px;
            color: var(--dodi-accent);
            font-weight: 700;
            font-size: 13.5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.15s ease;
        }

        .dodi-load-more-btn:hover {
            background: var(--dodi-panel-raised);
            border-color: var(--dodi-accent);
            color: #fff;
        }

        /* Pagination */
        .dodi-pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 28px;
            flex-wrap: wrap;
        }

        .dodi-page-item {
            padding: 6px 11px;
            background: var(--dodi-panel);
            border: 1px solid var(--dodi-border);
            border-radius: 6px;
            color: var(--dodi-muted);
            text-decoration: none;
            font-weight: 600;
            font-size: 12.5px;
        }

        .dodi-page-item:hover {
            border-color: var(--dodi-border-strong);
            color: var(--dodi-text-strong);
            background: var(--dodi-panel-raised);
        }

        .dodi-page-item.active {
            background: var(--dodi-accent);
            border-color: var(--dodi-accent);
            color: #09131d;
        }

        /* Toast */
        .dodi-toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--dodi-surface);
            border: 1px solid var(--dodi-accent);
            color: var(--dodi-text-strong);
            padding: 9px 18px;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            font-size: 13px;
            font-weight: 600;
            z-index: 999999;
            opacity: 0;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }

        .dodi-toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .dodi-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(130, 216, 255, 0.2);
            border-top-color: var(--dodi-accent);
            border-radius: 50%;
            animation: dodiSpin 0.7s linear infinite;
        }

        @keyframes dodiSpin {
            to { transform: rotate(360deg); }
        }

        .dodi-loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            gap: 12px;
            color: var(--dodi-muted);
        }

        /* =========================================================================
           MODAL OVERLAY & ENLARGED GAME CARD (.dodi-modal & .ea-card-modal)
           ========================================================================= */
        .dodi-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            background: rgba(8, 12, 18, 0.85);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: opacity 0.2s ease;
        }

        .dodi-modal[hidden] {
            display: none !important;
        }

        .dodi-modal-box {
            position: relative;
            width: min(1040px, 100%);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            background: var(--dodi-surface);
            border: 1px solid var(--dodi-border-strong);
            border-radius: 14px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }

        .dodi-modal-head {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 12px 18px;
            background: #141c26;
            border-bottom: 1px solid var(--dodi-border);
        }

        .dodi-modal-title-area {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            flex: 1;
        }

        .dodi-modal-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--dodi-text-strong);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0;
        }

        .dodi-modal-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .dodi-modal-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            padding: 0;
            background: #1c2734;
            border: 1px solid var(--dodi-border);
            border-radius: 8px;
            color: var(--dodi-text);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .dodi-modal-close:hover {
            background: #e04545;
            border-color: #e04545;
            color: #ffffff;
        }

        .dodi-modal-body {
            padding: 18px;
            overflow-y: auto;
            max-height: calc(90vh - 58px);
            min-height: 180px;
        }

        .dodi-modal-body::-webkit-scrollbar {
            width: 7px;
        }

        .dodi-modal-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .dodi-modal-body::-webkit-scrollbar-thumb {
            background: #2b394a;
            border-radius: 4px;
        }

        .dodi-modal-body::-webkit-scrollbar-thumb:hover {
            background: var(--dodi-accent);
        }

        /* Enlarged Card inside Modal */
        .ea-card-modal {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }

        .ea-panel-modal {
            grid-template-columns: 220px minmax(0, 1fr) !important;
            gap: 18px !important;
        }

        .ea-panel-modal .ea-title-text {
            font-size: 19px !important;
            font-weight: 800 !important;
            line-height: 1.3 !important;
        }

        .ea-panel-modal .ea-badge {
            padding: 3px 9px !important;
            font-size: 11.5px !important;
        }

        .ea-panel-modal .ea-specs {
            gap: 6px !important;
        }

        .ea-panel-modal .ea-spec {
            font-size: 13.5px !important;
            white-space: normal !important;
            line-height: 1.45 !important;
        }

        .ea-panel-modal .ea-description-snippet {
            font-size: 13px !important;
            line-height: 1.55 !important;
            -webkit-line-clamp: 8 !important;
            padding: 10px 12px !important;
        }

        .ea-panel-modal details.fg-extra > summary {
            font-size: 13.5px !important;
            padding: .55rem .85rem !important;
        }

        .ea-panel-modal .fg-extra-body {
            font-size: 13px !important;
        }

        @media (max-width: 720px) {
            .ea-panel-modal {
                grid-template-columns: 1fr !important;
                grid-template-areas:
                    "title"
                    "poster"
                    "info"
                    "collapsible" !important;
                gap: 12px !important;
            }
            .ea-panel-modal .ea-poster {
                max-width: 200px;
            }
        }
    `;

    if (typeof GM_addStyle === 'function') {
        GM_addStyle(styles);
    } else {
        var styleEl = document.createElement('style');
        styleEl.textContent = styles;
        (document.head || document.documentElement).appendChild(styleEl);
    }

    document.documentElement.classList.add('dodi-on');

    /* =========================================================================
       4. DATA PARSERS (DOM Extraction of Posters, Specs, Sections, and Links)
       ========================================================================= */

    // Parse Sticky Pinned Post (Free Offline Activation, Exclusive, Trending)
    function parseStickyPost(rootDoc) {
        var stickyArticle = q('article.sticky', rootDoc) ||
                            qa('article', rootDoc).find(function (art) {
                                var text = art.textContent || '';
                                return text.includes('Free Offline Activation') && text.includes('Trending Repacks');
                            });

        var result = { freeActivation: [], exclusive: [], trending: [] };
        if (!stickyArticle) return result;

        var content = q('.entry-content', stickyArticle) || stickyArticle;
        var headings = qa('h1, h2, h3', content);

        headings.forEach(function (h) {
            var hText = txt(h);

            // Free Offline Activation
            if (/Free Offline Activation/i.test(hText)) {
                var nextEl = h.nextElementSibling;
                while (nextEl && nextEl.tagName !== 'UL' && nextEl.tagName !== 'OL' && !/^H[1-3]$/i.test(nextEl.tagName)) {
                    nextEl = nextEl.nextElementSibling;
                }
                if (nextEl && (nextEl.tagName === 'UL' || nextEl.tagName === 'OL')) {
                    qa('li', nextEl).forEach(function (li) {
                        var a = q('a', li);
                        if (!a) return;
                        var rawText = txt(li);
                        var aText = txt(a);
                        var title = (aText && !/^Available Now$/i.test(aText)) ? aText : rawText;
                        var cleanTitle = title.replace(/\s*[\u2013-]\s*Available Now/i, '').trim();
                        result.freeActivation.push({
                            title: cleanTitle,
                            url: a.href,
                            isAvailable: /Available Now/i.test(rawText)
                        });
                    });
                }
            }

            // Exclusive Repacks
            if (/Exclusive Repacks/i.test(hText)) {
                var nextExclusive = h.nextElementSibling;
                while (nextExclusive && nextExclusive.tagName !== 'UL' && nextExclusive.tagName !== 'OL' && !/^H[1-3]$/i.test(nextExclusive.tagName)) {
                    nextExclusive = nextExclusive.nextElementSibling;
                }
                if (nextExclusive && (nextExclusive.tagName === 'UL' || nextExclusive.tagName === 'OL')) {
                    qa('a', nextExclusive).forEach(function (a) {
                        var title = txt(a);
                        if (!title || title.length < 2) return;
                        result.exclusive.push({ title: title, url: a.href });
                    });
                }
            }

            // Trending Repacks
            if (/Trending Repacks/i.test(hText)) {
                var nextTrending = h.nextElementSibling;
                while (nextTrending && nextTrending.tagName !== 'OL' && nextTrending.tagName !== 'UL' && !/^H[1-3]$/i.test(nextTrending.tagName)) {
                    nextTrending = nextTrending.nextElementSibling;
                }
                if (nextTrending && (nextTrending.tagName === 'OL' || nextTrending.tagName === 'UL')) {
                    qa('li', nextTrending).forEach(function (li, idx) {
                        var a = q('a', li);
                        if (!a) return;
                        var fullText = txt(li);
                        var sizeMatch = fullText.match(/\((?:From\s+)?([0-9.]+\s*(?:GB|MB))\)/i);
                        result.trending.push({
                            rank: idx + 1,
                            title: txt(a) || fullText,
                            url: a.href,
                            size: sizeMatch ? sizeMatch[1] : ''
                        });
                    });
                }
            }
        });

        return result;
    }

    // Check if pinned dataset has at least one valid item in any category
    function hasPinnedItems(data) {
        if (!data) return false;
        return (Array.isArray(data.freeActivation) && data.freeActivation.length > 0) ||
               (Array.isArray(data.exclusive) && data.exclusive.length > 0) ||
               (Array.isArray(data.trending) && data.trending.length > 0);
    }

    // Persist pinned threads to GM_setValue and localStorage so they survive pagination
    function savePinnedData(data) {
        if (!hasPinnedItems(data)) return;
        var payload = {
            data: {
                freeActivation: Array.isArray(data.freeActivation) ? data.freeActivation : [],
                exclusive: Array.isArray(data.exclusive) ? data.exclusive : [],
                trending: Array.isArray(data.trending) ? data.trending : []
            },
            timestamp: Date.now()
        };
        try {
            var json = JSON.stringify(payload);
            if (typeof GM_setValue === 'function') {
                GM_setValue('dodi_pinned_data', json);
            }
            if (window.localStorage) {
                localStorage.setItem('dodi_pinned_data', json);
            }
        } catch (e) {
            console.error('[DODI Storage] Error saving pinned data:', e);
        }
    }

    // Load persisted pinned threads from storage
    function loadSavedPinnedData() {
        try {
            var raw = null;
            if (typeof GM_getValue === 'function') {
                raw = GM_getValue('dodi_pinned_data', null);
            }
            if (!raw && window.localStorage) {
                raw = localStorage.getItem('dodi_pinned_data');
            }
            if (raw) {
                var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                var data = (parsed && parsed.data) ? parsed.data : parsed;
                if (hasPinnedItems(data)) {
                    return {
                        data: {
                            freeActivation: Array.isArray(data.freeActivation) ? data.freeActivation : [],
                            exclusive: Array.isArray(data.exclusive) ? data.exclusive : [],
                            trending: Array.isArray(data.trending) ? data.trending : []
                        },
                        timestamp: (parsed && parsed.timestamp) ? parsed.timestamp : 0
                    };
                }
            }
        } catch (e) {
            console.error('[DODI Storage] Error loading saved pinned data:', e);
        }
        return null;
    }

    // Fetch pinned threads from home page in background when on a page without sticky post
    function fetchHomePagePinned() {
        requestPage('https://dodi-repacks.site/').then(function (html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var remotePinned = parseStickyPost(doc);
            if (hasPinnedItems(remotePinned)) {
                state.pinnedData = remotePinned;
                savePinnedData(remotePinned);
                updateTabBadges();
                if (state.activeTab === 'activation' || state.activeTab === 'exclusive' || state.activeTab === 'trending') {
                    renderCurrentTab();
                }
            }
        }).catch(function (err) {
            console.warn('[DODI] Failed to background fetch pinned threads:', err);
        });
    }

    // Sanitize HTML inside collapsible buttons: convert text to white, maintaining ONLY red warnings
    function sanitizeCollapsibleHtml(html) {
        if (!html) return '';
        var temp = document.createElement('template'); // inert: no resource loading, no script execution
        temp.innerHTML = html;

        qa('script, iframe, frame, object, embed, base, meta, link', temp.content).forEach(function (el) {
            el.remove();
        });

        qa('*', temp.content).forEach(function (el) {
            Array.prototype.slice.call(el.attributes).forEach(function (attr) {
                // URL parsers drop control characters and spaces, so strip them before the scheme check.
                // eslint-disable-next-line no-control-regex
                var value = attr.value.replace(/[ - ]/g, '');
                if (/^on/i.test(attr.name) || attr.name === 'srcdoc' || /^javascript:/i.test(value)) {
                    el.removeAttribute(attr.name);
                }
            });

            // Normalize oversized headings
            if (/^H[1-6]$/i.test(el.tagName)) {
                el.style.fontSize = '12.5px';
                el.style.margin = '6px 0 3px 0';
                el.style.fontWeight = '700';
            }

            var style = el.getAttribute('style') || '';
            if (style) {
                var isRed = /color\s*:\s*(?:#ff0000|#f00|red|rgb\(\s*255\s*,\s*0\s*,\s*0\s*\))/i.test(style);
                if (isRed) {
                    el.style.color = '#ff5e5e';
                    el.style.fontWeight = '700';
                    el.classList.add('dodi-warning');
                } else {
                    // Remove clashing inline color (e.g. #003300 dark green, #00ff00 neon, #00ffff)
                    el.style.color = '';
                }
                // Remove inline font sizes to match the site font size
                el.style.fontSize = '';
            }
        });

        return temp.innerHTML;
    }

    // Extract Collapsible Sections (.sp-wrap, Repack Features, Backwards Compatibility)
    function extractArticleSections(contentEl) {
        var sections = {
            spoilers: [],
            repackFeaturesHtml: '',
            backwardsHtml: ''
        };
        if (!contentEl) return sections;

        var html = contentEl.innerHTML || '';

        // 1. Spoilers (.sp-wrap)
        var spWraps = qa('.sp-wrap', contentEl);
        spWraps.forEach(function (sp) {
            var headEl = q('.sp-head', sp);
            var bodyEl = q('.sp-body', sp);
            var head = txt(headEl) || 'Information';
            var bodyHtml = bodyEl ? bodyEl.innerHTML.trim() : '';
            if (head && bodyHtml) {
                sections.spoilers.push({ title: head, html: bodyHtml });
            }
        });

        // 2. Repack Features
        var rfMatch = html.match(/(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*Repack Features[\s\S]*?(?=(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*(?:Backwards Compatibility|Download Links)|$)/i);
        if (rfMatch) {
            sections.repackFeaturesHtml = rfMatch[0]
                .replace(/^(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*Repack Features[\s\S]*?<\/(?:p|h[1-6])>/i, '')
                .trim();
        }

        // 3. Backwards Compatibility
        var bcMatch = html.match(/(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*Backwards Compatibility[\s\S]*?(?=(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*Download Links|$)/i);
        if (bcMatch) {
            sections.backwardsHtml = bcMatch[0]
                .replace(/^(?:<p[^>]*>|<h[1-6][^>]*>)\s*(?:<[^>]+>)*\s*Backwards Compatibility[\s\S]*?<\/(?:p|h[1-6])>/i, '')
                .trim();
        }

        return sections;
    }

    // Clean single spec field value, terminating at next headings or specs
    function cleanSpecVal(val) {
        if (!val) return '';
        return val.replace(/<[^>]+>/g, '')
                  .replace(/\s*(?:SYSTEM REQUIREMENTS|MINIMUM|RECOMMENDED|Genre|Developer|Publisher|Release Date|Repack Size|Language|Interface|Version|Storage|Memory|OS:).*/is, '')
                  .trim()
                  .substring(0, 45);
    }

    // Extract structured specs & description from .entry-content
    function extractArticleInfo(contentEl) {
        var info = {
            genre: '',
            developer: '',
            publisher: '',
            releaseDate: '',
            repackSize: '',
            finalSize: '',
            descriptionSnippet: ''
        };

        if (!contentEl) return info;

        var html = contentEl.innerHTML || '';
        var fullText = txt(contentEl);

        // Extract from innerHTML where < tags (like </span>, </p>, <br>) and lines are preserved
        var genreM = html.match(/(?:Genre|GENRE)\s*:\s*([^<\n\r\t]+)/i);
        if (genreM) info.genre = cleanSpecVal(genreM[1]);

        var devM = html.match(/(?:Developer|DEVELOPER)\s*:\s*([^<\n\r\t]+)/i);
        if (devM) info.developer = cleanSpecVal(devM[1]);

        var pubM = html.match(/(?:Publisher|Publishers|PUBLISHER)\s*:\s*([^<\n\r\t]+)/i);
        if (pubM) info.publisher = cleanSpecVal(pubM[1]);

        var dateM = html.match(/(?:Release\s*Date|RELEASE\s*DATE)\s*:\s*([^<\n\r\t]+)/i);
        if (dateM) info.releaseDate = cleanSpecVal(dateM[1]);

        var sizeM = html.match(/Repack\s*Size\s*:\s*(?:from\s*)?([0-9.]+\s*(?:GB|MB))/i) ||
                    fullText.match(/Repack\s*Size\s*:\s*(?:from\s*)?([0-9.]+\s*(?:GB|MB))/i) ||
                    fullText.match(/\((?:From\s*)?([0-9.]+\s*(?:GB|MB))\)/i);
        if (sizeM) info.repackSize = sizeM[1];

        // Description snippet from sp-wrap purple, game description or general text
        var descWrap = q('.sp-wrap.sp-wrap-purple, .sp-wrap:not(.sp-wrap-green)', contentEl);
        if (descWrap) {
            var body = q('.sp-body', descWrap) || descWrap;
            info.descriptionSnippet = txt(body).replace(/GAME DESCRIPTION/i, '').replace(/Description/i, '').trim();
        } else {
            var spWraps = qa('.sp-wrap', contentEl);
            var descSp = spWraps.find(function (s) { return /Description/i.test(txt(q('.sp-head', s))); });
            if (descSp) {
                var dBody = q('.sp-body', descSp) || descSp;
                info.descriptionSnippet = txt(dBody).replace(/GAME DESCRIPTION/i, '').replace(/Description/i, '').trim();
            } else {
                var infoWrap = q('.sp-wrap-green, .sp-wrap', contentEl);
                if (infoWrap) {
                    var lines = txt(infoWrap).split(/(?:SYSTEM REQUIREMENTS|MINIMUM|Repack Features)/i);
                    info.descriptionSnippet = (lines[0] || '').replace(/Information/i, '').trim();
                }
            }
        }

        if (!info.descriptionSnippet || info.descriptionSnippet.length < 15) {
            var pList = qa('p', contentEl);
            for (var i = 0; i < pList.length; i++) {
                var pText = txt(pList[i]);
                if (pText && !pText.includes('Repack Features') && !pText.includes('Download Links') && !pText.includes('SYSTEM REQUIREMENTS') && pText.length > 30) {
                    info.descriptionSnippet = pText.substring(0, 300);
                    break;
                }
            }
        }

        if (!info.descriptionSnippet) {
            info.descriptionSnippet = fullText.substring(0, 250);
        }

        return info;
    }

    // Parse Download Links from Content element
    function parseDownloadLinksFromContent(contentEl) {
        var groups = [];
        if (!contentEl) return groups;

        var html = contentEl.innerHTML || '';
        var dlIndex = html.search(/Download Links/i);
        if (dlIndex === -1) dlIndex = 0;

        var sectionHtml = html.substring(dlIndex);
        var tempDiv = document.createElement('template'); // inert: no resource loading, no script execution
        tempDiv.innerHTML = sectionHtml;

        var currentCategory = 'Direct & Torrent Downloads';
        var elements = qa('p, ol, ul, h2, h3, h4', tempDiv.content);

        elements.forEach(function (el) {
            var text = txt(el);
            if (!text) return;

            if (/Download Links/i.test(text) || text.includes("Don't download") || /PLZ SEED/i.test(text) || /Backwards Compatibility/i.test(text)) {
                return;
            }

            if (/elamigos Updates?/i.test(text)) {
                currentCategory = 'ElAmigos Updates';
                return;
            }
            if (/RUNE Updates?/i.test(text)) {
                currentCategory = 'RUNE Updates';
                return;
            }
            if (/New DLC/i.test(text)) return;

            // Stop at footer or comments
            if (el.closest('.tolstoycomments-feed, .cat-links, .entry-footer, .nav-links')) return;

            // Handle list items
            if (el.tagName === 'OL' || el.tagName === 'UL') {
                qa('li', el).forEach(function (li) {
                    var liLinks = qa('a', li);
                    if (!liLinks.length) return;
                    var title = txt(li).replace(/Click\s*Here[\s\S]*/i, '').replace(/[-\u2013\u2014]\s*$/, '').trim() || currentCategory;

                    var mirrors = [];
                    liLinks.forEach(function (a, mIdx) {
                        var url = a.getAttribute('href') || '';
                        if (!url || url.startsWith('javascript:') || /dodi-repacks\.site\/(?:category|tag|author)/i.test(url)) return;
                        mirrors.push({
                            url: url,
                            label: 'Mirror ' + (mIdx + 1),
                            host: getHostName(url),
                            isZovo: /zovo/i.test(url)
                        });
                    });

                    // Link fallback URLs across mirrors in the same row
                    var zovoRowUrls = mirrors.filter(function (m) { return m.isZovo; }).map(function (m) { return m.url; });
                    mirrors.forEach(function (m) {
                        if (m.isZovo) {
                            m.fallbackUrls = zovoRowUrls.filter(function (u) { return u !== m.url; });
                        }
                    });

                    if (mirrors.length) {
                        groups.push({ category: currentCategory, title: title, mirrors: mirrors });
                    }
                });
                return;
            }

            // Handle paragraphs
            var links = qa('a', el);
            if (!links.length) return;

            var title = text.replace(/Click\s*Here[\s\S]*/i, '').replace(/[-\u2013\u2014]\s*$/, '').trim() || 'Download Option';
            if (title.length > 60) title = 'Download';

            var mirrors = [];
            links.forEach(function (a, mIdx) {
                var url = a.getAttribute('href') || '';
                if (!url || url.startsWith('javascript:') || /dodi-repacks\.site\/(?:category|tag|author)/i.test(url)) return;
                mirrors.push({
                    url: url,
                    label: mirrors.length === 0 ? 'Download' : 'Mirror ' + (mIdx + 1),
                    host: getHostName(url),
                    isZovo: /zovo/i.test(url)
                });
            });

            // Link fallback URLs across mirrors in the same row
            var pZovoUrls = mirrors.filter(function (m) { return m.isZovo; }).map(function (m) { return m.url; });
            mirrors.forEach(function (m) {
                if (m.isZovo) {
                    m.fallbackUrls = pZovoUrls.filter(function (u) { return u !== m.url; });
                }
            });

            if (mirrors.length) {
                groups.push({ category: currentCategory, title: title, mirrors: mirrors });
            }
        });

        return groups;
    }

    function getHostName(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
            return 'Link';
        }
    }

    // Parse an Article that is ALREADY on the current DOM page
    function parseArticleFromDOM(articleEl) {
        var id = articleEl.id || '';
        var titleEl = q('.entry-title a', articleEl) || q('.entry-title', articleEl);
        var title = txt(titleEl) || 'Untitled Release';
        var url = titleEl && titleEl.getAttribute('href') ? abs(titleEl.getAttribute('href')) : location.href;

        var dateEl = q('time.entry-date', articleEl) || q('time', articleEl);
        var date = txt(dateEl) || '';

        var contentEl = q('.entry-content', articleEl);

        // Poster image
        var imgEl = contentEl ? q('img', contentEl) : q('img', articleEl);
        var poster = imgEl ? (imgEl.getAttribute('data-original') || imgEl.getAttribute('src') || '') : '';

        // Clean title & Repack #
        var repackNum = (title.match(/^(\d+)[-\u2013\s]/) || [])[1] || '';
        var cleanTitle = title.replace(/^\d+[-\u2013\s]+/, '').trim();

        // Extract specs and description
        var info = extractArticleInfo(contentEl);

        // Extract collapsible sections (.sp-wrap, Repack Features, Backwards Compatibility)
        var sections = extractArticleSections(contentEl);

        // Parse download links
        var downloads = parseDownloadLinksFromContent(contentEl);

        return {
            id: id,
            title: title,
            cleanTitle: cleanTitle,
            repackNum: repackNum,
            url: url,
            date: date,
            poster: poster,
            info: info,
            sections: sections,
            downloads: downloads,
            isSticky: articleEl.classList.contains('sticky')
        };
    }

    // Parse an Article from fetched HTML string (for search results)
    function parseArticleFromHtml(html, pageUrl) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        var titleEl = q('.entry-title', doc);
        var title = txt(titleEl);
        var dateEl = q('time.entry-date', doc);
        var date = txt(dateEl);
        var contentEl = q('.entry-content', doc);

        var imgEl = contentEl ? q('img', contentEl) : null;
        var poster = imgEl ? (imgEl.getAttribute('data-original') || imgEl.getAttribute('src') || '') : '';

        var repackNum = (title.match(/^(\d+)[-\u2013\s]/) || [])[1] || '';
        var cleanTitle = title.replace(/^\d+[-\u2013\s]+/, '').trim();

        var info = extractArticleInfo(contentEl);
        var sections = extractArticleSections(contentEl);
        var downloads = parseDownloadLinksFromContent(contentEl);

        return {
            title: title,
            cleanTitle: cleanTitle,
            repackNum: repackNum,
            url: pageUrl,
            date: date,
            poster: poster,
            info: info,
            sections: sections,
            downloads: downloads
        };
    }

    /* =========================================================================
       5. DIRECT BACKGROUND HTTP RESOLVER (With IndexedDB Persistent Caching)
       ========================================================================= */

    function resolveZovoSilently(zovoUrl, fallbackUrls, onDone, onError) {
        // Normalize arguments if fallbackUrls was omitted (compatibility)
        if (typeof fallbackUrls === 'function') {
            onError = onDone;
            onDone = fallbackUrls;
            fallbackUrls = [];
        }
        fallbackUrls = Array.isArray(fallbackUrls) ? fallbackUrls : (fallbackUrls ? [fallbackUrls] : []);

        console.log('[DODI Resolver] Resolving silently via background HTTP:', zovoUrl);
        showToast('[Bypass] Resolving Zovo shortlink in background...');

        var cleanKey = (zovoUrl || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();

        // 1. Check GM storage cache first
        if (typeof GM_getValue === 'function') {
            var gmCached = GM_getValue('dodi_zovo_' + cleanKey) || GM_getValue('dodi_zovo_' + zovoUrl);
            if (gmCached) {
                console.log('[DODI Resolver] Found in GM cache:', gmCached);
                onDone(gmCached);
                return;
            }
        }

        // 2. Check IndexedDB persistent cache
        idbGetZovo(zovoUrl).then(function (idbCached) {
            if (idbCached) {
                console.log('[DODI Resolver] Found in IndexedDB cache:', idbCached);
                if (typeof GM_setValue === 'function') {
                    GM_setValue('dodi_zovo_' + cleanKey, idbCached);
                    GM_setValue('dodi_zovo_' + zovoUrl, idbCached);
                }
                onDone(idbCached);
                return;
            }

            // Build list of candidate URLs to try: primary first, then fallbacks
            var candidates = [zovoUrl].concat(fallbackUrls);
            attemptResolution(candidates, 0, cleanKey, onDone, onError);
        }).catch(function () {
            var candidates = [zovoUrl].concat(fallbackUrls);
            attemptResolution(candidates, 0, cleanKey, onDone, onError);
        });
    }

    function attemptResolution(candidates, index, cleanKey, onDone, onError) {
        if (index >= candidates.length) {
            var finalErr = new Error('No CSRF token found in Step 1 (All mirrors exhausted or blocked by DNS/AdBlock)');
            console.error('[DODI Resolver] All candidates failed:', finalErr);
            if (onError) onError(finalErr);
            return;
        }

        var currentUrl = candidates[index];
        runHttpResolution(currentUrl, cleanKey, onDone, function (err) {
            console.warn('[DODI Resolver] Candidate ' + (index + 1) + '/' + candidates.length + ' (' + currentUrl + ') failed:', err);
            if (index + 1 < candidates.length) {
                console.log('[DODI Resolver] Trying alternate mirror:', candidates[index + 1]);
                attemptResolution(candidates, index + 1, cleanKey, onDone, onError);
            } else {
                if (onError) onError(err);
            }
        });
    }

    function runHttpResolution(zovoUrl, cleanKey, onDone, onError) {
        function gmReq(opts) {
            return new Promise(function (resolve, reject) {
                if (typeof GM_xmlhttpRequest !== 'function') {
                    return reject(new Error('GM_xmlhttpRequest is not available'));
                }
                GM_xmlhttpRequest(Object.assign({}, opts, {
                    onload: function (res) {
                        if (res.status >= 200 && res.status < 400) {
                            resolve(res);
                        } else {
                            reject(new Error('HTTP status ' + res.status));
                        }
                    },
                    onerror: reject,
                    ontimeout: reject
                }));
            });
        }

        // Step 1: GET initial page
        gmReq({
            method: 'GET',
            url: zovoUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }).then(function (res1) {
            var html1 = res1.responseText || '';
            var tokenMatch = html1.match(/name="_csrfToken"[^>]*value="([^"]+)"/i);
            var tokenFieldsMatch = html1.match(/name="_Token\[fields\]"[^>]*value="([^"]+)"/i);
            var tokenUnlockedMatch = html1.match(/name="_Token\[unlocked\]"[^>]*value="([^"]+)"/i);

            if (!tokenMatch) {
                var reason = (!html1 || html1.length < 50) ? 'Page empty (blocked by NextDNS / Adblock)' : 'No CSRF token found in Step 1';
                throw new Error(reason);
            }

            var finalUrl1 = res1.finalUrl || zovoUrl;

            // Step 2: POST form-continue (page 2)
            var body2 = '_method=POST' +
                '&_csrfToken=' + encodeURIComponent(tokenMatch[1]) +
                '&action=continue' +
                '&page=2' +
                '&_Token%5Bfields%5D=' + (tokenFieldsMatch ? encodeURIComponent(decodeURIComponent(tokenFieldsMatch[1])) : '') +
                '&_Token%5Bunlocked%5D=' + (tokenUnlockedMatch ? encodeURIComponent(decodeURIComponent(tokenUnlockedMatch[1])) : '');

            return gmReq({
                method: 'POST',
                url: finalUrl1,
                data: body2,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': finalUrl1
                }
            });
        }).then(function (res2) {
            var html2 = res2.responseText || '';
            var csrfMatch = html2.match(/id="go-link"[\s\S]*?name="_csrfToken"[^>]*value="([^"]+)"/i) ||
                            html2.match(/name="_csrfToken"[^>]*value="([^"]+)"/i);
            var adFormDataMatch = html2.match(/name="ad_form_data"[^>]*value="([^"]+)"/i);
            var fieldsMatch = html2.match(/id="go-link"[\s\S]*?name="_Token\[fields\]"[^>]*value="([^"]+)"/i) ||
                              html2.match(/name="_Token\[fields\]"[^>]*value="([^"]+)"/i);
            var unlockedMatch = html2.match(/id="go-link"[\s\S]*?name="_Token\[unlocked\]"[^>]*value="([^"]+)"/i);

            if (!adFormDataMatch) {
                throw new Error('No ad_form_data found in Step 2');
            }

            var finalUrl2 = res2.finalUrl || zovoUrl;
            var origin = (new URL(finalUrl2)).origin;

            // Step 3: Wait 5.3s to satisfy server-side elapsed time requirement
            return new Promise(function (resolveWait) {
                setTimeout(function () {
                    var bodyGo = '_method=POST' +
                        '&_csrfToken=' + encodeURIComponent(csrfMatch ? csrfMatch[1] : '') +
                        '&ad_form_data=' + encodeURIComponent(adFormDataMatch[1]) +
                        '&_Token%5Bfields%5D=' + (fieldsMatch ? encodeURIComponent(decodeURIComponent(fieldsMatch[1])) : '') +
                        '&_Token%5Bunlocked%5D=' + (unlockedMatch ? encodeURIComponent(decodeURIComponent(unlockedMatch[1])) : '');

                    resolveWait(gmReq({
                        method: 'POST',
                        url: origin + '/links/go',
                        data: bodyGo,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Referer': finalUrl2,
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json, text/javascript, */*; q=0.01'
                        }
                    }));
                }, 5300);
            });
        }).then(function (resGo) {
            var dataGo = resGo.responseText || '';
            var json = JSON.parse(dataGo);
            if (json && json.url) {
                console.log('[DODI Resolver] Destination link resolved:', json.url);
                if (typeof GM_setValue === 'function') {
                    GM_setValue('dodi_zovo_' + cleanKey, json.url);
                    GM_setValue('dodi_zovo_' + zovoUrl, json.url);
                }
                // Save to IndexedDB
                idbSetZovo(zovoUrl, json.url);
                onDone(json.url);
            } else {
                throw new Error(json.message || 'No destination URL returned');
            }
        }).catch(function (err) {
            console.error('[DODI Resolver] Error:', err);
            if (onError) onError(err);
        });
    }

    /* =========================================================================
       6. APPLICATION STATE & ROUTING
       ========================================================================= */

    var state = {
        activeTab: 'main',
        pinnedData: { freeActivation: [], exclusive: [], trending: [] },
        mainArticles: [],
        pagination: [],
        searchQuery: '',
        searchAllResults: [],
        searchLoadedCount: 0,
        searchSeq: 0,
        isSearching: false,
        articleCache: {}
    };

    var appRoot = null;
    var mainViewContainer = null;

    function requestPage(url) {
        return new Promise(function (resolve, reject) {
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: function (res) {
                        if (res.status >= 200 && res.status < 400) {
                            resolve(res.responseText);
                        } else {
                            reject(new Error('HTTP status ' + res.status));
                        }
                    },
                    onerror: function (res) {
                        reject(new Error('Network error' + (res && res.statusText ? ': ' + res.statusText : '')));
                    }
                });
            } else {
                fetch(url).then(function (res) {
                    if (!res.ok) throw new Error('HTTP status ' + res.status);
                    return res.text();
                }).then(resolve).catch(reject);
            }
        });
    }

    function switchTab(tabName) {
        state.activeTab = tabName;
        qa('.dodi-tab', appRoot).forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
        });
        renderCurrentTab();
    }

    /* =========================================================================
       7. UI RENDERERS (ElAmigos Card Format: Poster + Description + FitGirl Sections)
       ========================================================================= */

    function renderHeader() {
        var header = E('header', { class: 'dodi-head-wrap' });
        var headInner = E('div', { class: 'dodi-head' });

        // Brand
        var brand = E('div', { class: 'dodi-brand-area' }, [
            E('a', { class: 'dodi-brand', href: 'https://dodi-repacks.site/' }, [
                E('span', { class: 'dodi-brand-logo', text: 'DODI' }),
                E('span', { text: 'REPACKS' }),
                E('span', { class: 'dodi-brand-badge', text: 'Modern UI' })
            ])
        ]);

        // Search Bar with zero icon overlap
        var searchInput = E('input', {
            class: 'dodi-search-input',
            type: 'text',
            placeholder: 'Search repacks (e.g. the sims, stalker)...',
            value: state.searchQuery,
            onkeydown: function (e) {
                if (e.key === 'Enter') {
                    performSearch(searchInput.value.trim());
                }
            }
        });

        var searchBtn = E('button', {
            class: 'dodi-search-btn',
            text: 'Search',
            onclick: function () {
                performSearch(searchInput.value.trim());
            }
        });

        var searchBar = E('div', { class: 'dodi-search-bar' }, [
            E('span', { class: 'dodi-search-icon' }, [svg('search')]),
            searchInput,
            searchBtn
        ]);

        // Toggle Native View Button
        var toggleBtn = E('button', {
            class: 'dodi-btn-toggle',
            title: 'Switch to original WordPress site layout',
            onclick: function () {
                var on = document.documentElement.classList.toggle('dodi-on');
                showToast(on ? 'Modern Dark UI Enabled' : 'Original Site Layout Enabled');
            }
        }, [
            svg('view_quilt'),
            E('span', { text: 'Original Site' })
        ]);

        headInner.append(brand, searchBar, toggleBtn);
        header.append(headInner);

        // Tabs
        var navBar = E('nav', { class: 'dodi-nav-bar' });
        var tabsWrap = E('div', { class: 'dodi-tabs-wrap' });

        var tabs = [
            { id: 'main', icon: 'apps', label: 'Main Releases' },
            { id: 'activation', icon: 'lock_open', label: 'Free Offline Activation', count: state.pinnedData.freeActivation.length },
            { id: 'exclusive', icon: 'star', label: 'Exclusive Repacks', count: state.pinnedData.exclusive.length },
            { id: 'trending', icon: 'fire', label: 'Trending', count: state.pinnedData.trending.length }
        ];

        if (state.searchAllResults.length > 0 || state.isSearching) {
            tabs.push({ id: 'search', icon: 'search', label: 'Search Results', count: state.searchAllResults.length });
        }

        tabs.forEach(function (tab) {
            var tabEl = E('div', {
                class: 'dodi-tab' + (state.activeTab === tab.id ? ' active' : ''),
                'data-tab': tab.id,
                onclick: function () { switchTab(tab.id); }
            }, [
                svg(tab.icon),
                E('span', { text: tab.label })
            ]);

            if (tab.count != null && tab.count > 0) {
                tabEl.append(E('span', { class: 'dodi-tab-badge', text: String(tab.count) }));
            }

            tabsWrap.append(tabEl);
        });

        navBar.append(tabsWrap);
        header.append(navBar);

        return header;
    }

    function ensureSearchTabInNav() {
        var tabsWrap = q('.dodi-tabs-wrap', appRoot);
        if (!tabsWrap) return;

        var searchTab = q('.dodi-tab[data-tab="search"]', tabsWrap);
        if (!searchTab) {
            searchTab = E('div', {
                class: 'dodi-tab active',
                'data-tab': 'search',
                onclick: function () { switchTab('search'); }
            }, [
                svg('search'),
                E('span', { text: 'Search Results' })
            ]);
            tabsWrap.append(searchTab);
        }

        qa('.dodi-tab', tabsWrap).forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === 'search');
        });

        updateSearchTabBadge();
    }

    function updateSearchTabBadge() {
        var searchTab = q('.dodi-tab[data-tab="search"]', appRoot);
        if (!searchTab) return;

        var existingBadge = q('.dodi-tab-badge', searchTab);
        if (existingBadge) existingBadge.remove();

        if (state.searchAllResults.length > 0) {
            searchTab.append(E('span', { class: 'dodi-tab-badge', text: String(state.searchAllResults.length) }));
        }
    }

    function updateTabBadges() {
        if (!appRoot) return;
        var tabDefs = [
            { id: 'activation', count: (state.pinnedData.freeActivation || []).length },
            { id: 'exclusive', count: (state.pinnedData.exclusive || []).length },
            { id: 'trending', count: (state.pinnedData.trending || []).length }
        ];

        tabDefs.forEach(function (t) {
            var tabEl = q('.dodi-tab[data-tab="' + t.id + '"]', appRoot);
            if (!tabEl) return;
            var badge = q('.dodi-tab-badge', tabEl);
            if (badge) badge.remove();
            if (t.count > 0) {
                tabEl.append(E('span', { class: 'dodi-tab-badge', text: String(t.count) }));
            }
        });
    }

    // Helper: create a compact collapsible block styled like fit.user.js details.fg-extra with sanitized white text
    function createCollapsibleSection(title, iconName, bodyContent, extraClass) {
        var details = E('details', { class: 'fg-extra' + (extraClass ? ' ' + extraClass : '') });
        var summary = E('summary', {}, [
            E('span', { class: 'ea-section-summary-left' }, [
                svg(iconName || 'info'),
                E('span', { text: title })
            ]),
            svg('chevron_down')
        ]);

        var body = E('div', { class: 'fg-extra-body' });
        if (typeof bodyContent === 'string') {
            body.innerHTML = sanitizeCollapsibleHtml(bodyContent);
        } else if (bodyContent && bodyContent.nodeType) {
            body.innerHTML = sanitizeCollapsibleHtml(bodyContent.innerHTML || bodyContent.textContent);
        }

        details.append(summary, body);
        return details;
    }

    function createBatchResolveToolbar(mirrorColumns) {
        var colNames = Object.keys(mirrorColumns || {});
        if (!colNames.length) return null;

        var toolbar = document.createElement('div');
        toolbar.className = 'ea-dl-toolbar';
        var toolbarLabel = document.createElement('span');
        toolbarLabel.className = 'ea-dl-toolbar-label';
        toolbarLabel.textContent = 'Batch Resolve:';
        toolbar.appendChild(toolbarLabel);

        for (var c = 0; c < colNames.length; c++) {
            (function (colName) {
                var colItems = mirrorColumns[colName];
                if (!colItems || !colItems.length) return;

                var btnAll = document.createElement('button');
                btnAll.className = 'ea-btn-resolve-all';
                btnAll.title = 'Resolve all ' + colName + ' links silently in background';
                btnAll.appendChild(svg('bolt'));
                var btnAllText = document.createElement('span');
                btnAllText.textContent = 'Resolve ' + colName;
                btnAll.appendChild(btnAllText);

                btnAll.onclick = function () {
                    btnAll.disabled = true;
                    btnAllText.textContent = 'Resolving ' + colName + '...';

                    var idx = 0;
                    var step = function () {
                        if (idx >= colItems.length) {
                            btnAllText.textContent = colName + ' Done';
                            showToast('All ' + colName + ' links resolved!');
                            return;
                        }
                        var item = colItems[idx];
                        if (!item.linkBtn || !item.linkBtn.classList.contains('ea-btn-zovo')) {
                            idx++;
                            step();
                            return;
                        }

                        btnAllText.textContent = 'Resolving ' + colName + ' (' + (idx + 1) + '/' + colItems.length + ')...';

                        resolveZovoSilently(item.mirror.url, item.mirror.fallbackUrls, function (directUrl) {
                            item.linkBtn.href = directUrl;
                            item.linkBtn.className = 'ea-btn ea-btn-direct';
                            item.linkBtn.innerHTML = '';
                            item.linkBtn.appendChild(svg('check'));
                            var dlSpan = document.createElement('span');
                            dlSpan.textContent = getHostName(directUrl) + ' (Direct)';
                            item.linkBtn.appendChild(dlSpan);
                            if (item.resolveBtn) item.resolveBtn.remove();
                            idx++;
                            step();
                        }, function () {
                            idx++;
                            step();
                        });
                    };
                    step();
                };

                toolbar.appendChild(btnAll);
            })(colNames[c]);
        }

        return toolbar;
    }

    // ELAMIGOS CARD COMPONENT: Poster on Left, Description on Right, Compact Sections Stack at Bottom
    function renderGameCard(art, isModal) {
        var card = E('article', { class: 'ea-card' + (isModal ? ' ea-card-modal' : '') });
        var panel = E('div', { class: 'ea-panel' + (isModal ? ' ea-panel-modal' : '') });

        // 1. Title Area
        var titleArea = E('div', { class: 'ea-title' });
        var metaRow = E('div', { class: 'ea-meta-row' });

        if (art.repackNum) {
            metaRow.append(E('span', { class: 'ea-badge ea-badge-repack', text: '#' + art.repackNum }));
        }
        if (art.date) {
            metaRow.append(E('span', { class: 'ea-badge', text: art.date }));
        }
        if (art.info && art.info.repackSize) {
            metaRow.append(E('span', { class: 'ea-badge ea-badge-green', text: art.info.repackSize }));
        }

        var titleEl = E('h3', { class: 'ea-title-text' }, [
            E('a', { href: art.url, target: '_blank', rel: 'noopener', text: art.cleanTitle || art.title })
        ]);

        titleArea.append(metaRow, titleEl);

        // 2. Poster on Left (140px format)
        var posterArea = E('div', { class: 'ea-poster' });
        if (art.poster) {
            var img = E('img', {
                class: 'ea-cover',
                src: art.poster,
                loading: 'lazy',
                alt: art.cleanTitle || art.title
            });
            posterArea.append(img);
        } else {
            posterArea.append(E('div', { class: 'ea-poster-ph', text: '#' + (art.repackNum || 'DODI') }));
        }

        // 3. Description / Info on Right next to Poster
        var infoArea = E('div', { class: 'ea-info-column' });
        var specsList = E('div', { class: 'ea-specs' });

        if (art.info && art.info.genre) {
            specsList.append(E('div', { class: 'ea-spec' }, [
                E('b', { text: 'Genre:' }),
                E('span', { text: art.info.genre })
            ]));
        }
        if (art.info && art.info.developer) {
            specsList.append(E('div', { class: 'ea-spec' }, [
                E('b', { text: 'Developer:' }),
                E('span', { text: art.info.developer })
            ]));
        }
        if (art.info && art.info.releaseDate) {
            specsList.append(E('div', { class: 'ea-spec' }, [
                E('b', { text: 'Release Date:' }),
                E('span', { text: art.info.releaseDate })
            ]));
        }

        infoArea.append(specsList);

        if (art.info && art.info.descriptionSnippet) {
            infoArea.append(E('div', { class: 'ea-description-snippet', text: art.info.descriptionSnippet }));
        }

        // 4. Compact Collapsible Sections Stack
        var stack = E('div', { class: 'ea-collapsible-stack' });

        // Section A: Spoilers parsed from .sp-wrap (Information, Game Description, How To Install)
        if (art.sections && art.sections.spoilers && art.sections.spoilers.length > 0) {
            art.sections.spoilers.forEach(function (sp) {
                var icon = /Install/i.test(sp.title) ? 'help' : 'info';
                stack.append(createCollapsibleSection(sp.title, icon, sp.html));
            });
        }

        // Section B: Repack Features
        if (art.sections && art.sections.repackFeaturesHtml) {
            stack.append(createCollapsibleSection('Repack Features', 'star', art.sections.repackFeaturesHtml));
        }

        // Section C: Backwards Compatibility (with fg-backwards accent styling from fit.user.js)
        if (art.sections && art.sections.backwardsHtml) {
            stack.append(createCollapsibleSection('Backwards Compatibility', 'bolt', art.sections.backwardsHtml, 'fg-backwards'));
        }

        // Section D: Download Links
        var countTotal = 0;
        (art.downloads || []).forEach(function (grp) { countTotal += grp.mirrors.length; });

        var dlDetails = E('details', { class: 'fg-extra fg-downloads' });
        var dlSummary = E('summary', {}, [
            E('span', { class: 'ea-section-summary-left' }, [
                svg('download'),
                E('span', { text: 'Download Links' }),
                countTotal > 0 ? E('span', { class: 'ea-section-summary-count', text: countTotal + ' mirrors' }) : null
            ]),
            svg('chevron_down')
        ]);

        var dlBody = E('div', { class: 'fg-extra-body' });

        if (!art.downloads || art.downloads.length === 0) {
            dlBody.append(E('div', { style: { color: 'var(--dodi-muted)', padding: '4px 0', fontSize: '12px' }, text: 'No direct download mirrors parsed in this card. Open original post for links.' }));
        } else {
            // Group mirrors by category
            var catMap = {};
            art.downloads.forEach(function (grp) {
                var c = grp.category || 'Direct Downloads';
                if (!catMap[c]) catMap[c] = [];
                catMap[c].push(grp);
            });

            // Map mirror columns for batch resolve
            var mirrorColumns = {};

            Object.keys(catMap).forEach(function (cat) {
                var catTitle = E('div', { class: 'ea-dl-cat-title' }, [
                    svg('info'),
                    E('span', { text: cat })
                ]);

                var catRows = [];

                catMap[cat].forEach(function (row) {
                    var dlRow = E('div', { class: 'ea-dl-row' });
                    var name = E('div', { class: 'ea-dl-title', text: row.title });
                    var actions = E('div', { class: 'ea-dl-actions' });

                    row.mirrors.forEach(function (mirror) {
                        var isZovo = mirror.isZovo;
                        var colLabel = mirror.label || 'Mirror 1';

                        var linkBtn = E('a', {
                            class: isZovo ? 'ea-btn ea-btn-zovo' : 'ea-btn ea-btn-direct',
                            href: mirror.url,
                            target: '_blank',
                            rel: 'noopener',
                            title: isZovo ? 'Zovo link (bypassed automatically)' : mirror.host
                        }, [
                            isZovo ? svg('bolt') : svg('download'),
                            E('span', { text: mirror.label || mirror.host })
                        ]);

                        actions.append(linkBtn);

                        // If Zovo, add individual Silent Resolve button & register for Batch Resolve
                        if (isZovo) {
                            var resolveBtn = document.createElement('button');
                            resolveBtn.type = 'button';
                            resolveBtn.className = 'ea-btn ea-btn-resolve';
                            resolveBtn.title = 'Resolve direct link silently in background without opening any ads or tabs';
                            resolveBtn.appendChild(svg('bolt'));
                            var resolveBtnLabel = document.createElement('span');
                            resolveBtnLabel.textContent = 'Silent Resolve';
                            resolveBtn.appendChild(resolveBtnLabel);

                            resolveBtn.onclick = function (e) {
                                if (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                                if (resolveBtn.disabled || !linkBtn.classList.contains('ea-btn-zovo')) return;
                                resolveBtn.disabled = true;
                                resolveBtnLabel.textContent = 'Resolving...';

                                resolveZovoSilently(mirror.url, mirror.fallbackUrls, function (directUrl) {
                                    linkBtn.href = directUrl;
                                    linkBtn.className = 'ea-btn ea-btn-direct';
                                    linkBtn.innerHTML = '';
                                    linkBtn.appendChild(svg('check'));
                                    var directLabel = document.createElement('span');
                                    directLabel.textContent = getHostName(directUrl) + ' (Direct)';
                                    linkBtn.appendChild(directLabel);
                                    resolveBtn.remove();
                                    showToast('Link resolved successfully: ' + getHostName(directUrl));
                                }, function (err) {
                                    resolveBtn.disabled = false;
                                    resolveBtnLabel.textContent = 'Retry Resolve';
                                    showToast('Silent resolve failed: ' + (err && err.message ? err.message : 'Timed out. Try clicking link directly.'));
                                });
                            };
                            actions.appendChild(resolveBtn);

                            if (!mirrorColumns[colLabel]) mirrorColumns[colLabel] = [];
                            mirrorColumns[colLabel].push({
                                mirror: mirror,
                                linkBtn: linkBtn,
                                resolveBtn: resolveBtn
                            });
                        }

                        // Copy button
                        var copyBtn = document.createElement('button');
                        copyBtn.type = 'button';
                        copyBtn.className = 'ea-btn ea-btn-copy';
                        copyBtn.title = 'Copy link';
                        copyBtn.appendChild(svg('copy'));
                        copyBtn.onclick = function (e) {
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            copyText(linkBtn.href);
                            showToast('Copied to clipboard!');
                        };

                        actions.appendChild(copyBtn);
                    });

                    dlRow.append(name, actions);
                    catRows.push(dlRow);
                });

                dlBody.append(catTitle);
                catRows.forEach(function (r) { dlBody.append(r); });
            });

            // If there are Zovo mirrors in multiple columns, add Batch Resolve toolbar at top of downloads
            var batchToolbar = createBatchResolveToolbar(mirrorColumns);
            if (batchToolbar) {
                dlBody.prepend(batchToolbar);
            }
        }

        dlDetails.append(dlSummary, dlBody);
        stack.append(dlDetails);

        panel.append(titleArea, posterArea, infoArea, stack);
        card.append(panel);

        return card;
    }

    /* =========================================================================
       7. GAME DETAILS MODAL (Enlarged Card Display)
       ========================================================================= */

    var modalOverlay = null;
    var modalBox = null;
    var modalTitle = null;
    var modalBody = null;
    var modalDirectLink = null;
    var modalSeq = 0;

    function ensureModal() {
        if (modalOverlay) return;

        modalOverlay = E('div', {
            class: 'dodi-modal',
            hidden: ''
        });

        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        modalBox = E('div', { class: 'dodi-modal-box' });

        var head = E('div', { class: 'dodi-modal-head' });

        var titleArea = E('div', { class: 'dodi-modal-title-area' });
        modalTitle = E('h3', { class: 'dodi-modal-title', text: 'Game Details' });
        titleArea.append(modalTitle);

        var actions = E('div', { class: 'dodi-modal-actions' });

        modalDirectLink = E('a', {
            class: 'ea-btn ea-btn-ghost',
            href: '#',
            target: '_blank',
            rel: 'noopener',
            title: 'Open original web page in new tab'
        }, [
            svg('open_in_new'),
            E('span', { text: 'Open Original' })
        ]);

        var closeBtn = E('button', {
            class: 'dodi-modal-close',
            type: 'button',
            title: 'Close modal (Esc)'
        }, [
            svg('close')
        ]);
        closeBtn.addEventListener('click', closeModal);

        actions.append(modalDirectLink, closeBtn);
        head.append(titleArea, actions);

        modalBody = E('div', { class: 'dodi-modal-body' });

        modalBox.append(head, modalBody);
        modalOverlay.append(modalBox);

        if (appRoot) {
            appRoot.append(modalOverlay);
        } else if (document.body) {
            document.body.append(modalOverlay);
        }

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalOverlay && !modalOverlay.hidden) {
                closeModal();
            }
        });
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.hidden = true;
        document.body.style.overflow = '';
    }

    function openGameModal(url, fallbackTitle) {
        ensureModal();
        modalOverlay.hidden = false;
        document.body.style.overflow = 'hidden';

        var seq = ++modalSeq;

        modalTitle.textContent = fallbackTitle || 'Game Details';
        modalDirectLink.href = url || '#';
        modalBody.innerHTML = '';

        // 1. Check if full article is already in cache or in mainArticles
        var cached = state.articleCache[url] || (state.mainArticles || []).find(function (a) { return a.url === url; });
        if (cached && cached.downloads && cached.downloads.length > 0) {
            modalTitle.textContent = cached.cleanTitle || cached.title || fallbackTitle;
            modalBody.append(renderGameCard(cached, true));
            return;
        }

        // 2. Otherwise show spinner and fetch page asynchronously
        var loadingEl = E('div', { class: 'dodi-loading-state' }, [
            E('div', { class: 'dodi-spinner' }),
            E('span', { text: 'Loading release details for "' + (fallbackTitle || 'game') + '"...' })
        ]);
        modalBody.append(loadingEl);

        requestPage(url).then(function (html) {
            if (seq !== modalSeq) return;
            var art = parseArticleFromHtml(html, url);
            if (!art.title && fallbackTitle) {
                art.title = fallbackTitle;
                art.cleanTitle = fallbackTitle;
            }
            state.articleCache[url] = art;
            modalTitle.textContent = art.cleanTitle || art.title || fallbackTitle;
            modalBody.innerHTML = '';
            modalBody.append(renderGameCard(art, true));
        }).catch(function (err) {
            if (seq !== modalSeq) return;
            modalBody.innerHTML = '';
            var errorEl = E('div', { class: 'dodi-loading-state' }, [
                E('span', { style: { color: '#ff6b6b', fontWeight: 'bold' }, text: 'Failed to load release details: ' + (err.message || 'Network error') }),
                E('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [
                    (function () {
                        var retryBtn = E('button', { class: 'ea-btn ea-btn-primary', text: 'Retry' });
                        retryBtn.addEventListener('click', function () {
                            openGameModal(url, fallbackTitle);
                        });
                        return retryBtn;
                    })(),
                    E('a', { class: 'ea-btn ea-btn-direct', href: url, target: '_blank', rel: 'noopener', text: 'Open Original Web Page' })
                ])
            ]);
            modalBody.append(errorEl);
        });
    }

    function renderCurrentTab() {
        if (!mainViewContainer) return;
        mainViewContainer.innerHTML = '';

        if (state.activeTab === 'main') {
            renderMainTab();
        } else if (state.activeTab === 'activation') {
            renderActivationTab();
        } else if (state.activeTab === 'exclusive') {
            renderExclusiveTab();
        } else if (state.activeTab === 'trending') {
            renderTrendingTab();
        } else if (state.activeTab === 'search') {
            renderSearchTab();
        }
    }

    // 1. Main Releases Tab (Cards load with info ALREADY on the page)
    function renderMainTab() {
        var head = E('div', { class: 'dodi-section-head' }, [
            E('div', {}, [
                E('h2', { class: 'dodi-section-title' }, [
                    svg('apps'),
                    E('span', { text: 'Latest Releases' })
                ]),
                E('div', { class: 'dodi-section-desc', text: 'All releases on the current page with full poster, specifications, and collapsible sections' })
            ])
        ]);

        var grid = E('div', { class: 'dodi-cards-grid' });

        state.mainArticles.forEach(function (art) {
            grid.append(renderGameCard(art));
        });

        mainViewContainer.append(head, grid);

        // Pagination
        if (state.pagination.length > 0) {
            var pagEl = E('div', { class: 'dodi-pagination' });
            state.pagination.forEach(function (p) {
                pagEl.append(E('a', {
                    class: 'dodi-page-item' + (p.isCurrent ? ' active' : ''),
                    href: p.url || '#',
                    text: p.text
                }));
            });
            mainViewContainer.append(pagEl);
        }
    }

    // 2. Free Offline Activation Tab
    function renderActivationTab() {
        var head = E('div', { class: 'dodi-section-head' }, [
            E('div', {}, [
                E('h2', { class: 'dodi-section-title' }, [
                    svg('lock_open'),
                    E('span', { text: 'Free Offline Activation Releases' })
                ]),
                E('div', { class: 'dodi-section-desc', text: 'Releases available with free offline account activations. Click any game to view details and downloads in modal.' })
            ])
        ]);

        var grid = E('div', { class: 'dodi-cards-grid' });

        if (!state.pinnedData.freeActivation || state.pinnedData.freeActivation.length === 0) {
            grid.append(E('div', { class: 'dodi-loading-state' }, [
                E('div', { class: 'dodi-spinner' }),
                E('span', { text: 'Loading Free Offline Activation releases from home page...' })
            ]));
        } else {
            state.pinnedData.freeActivation.forEach(function (item) {
                var card = E('article', { class: 'ea-card dodi-clickable-card' });
                var panel = E('div', { class: 'ea-panel', style: { gridTemplateColumns: '1fr', gridTemplateAreas: '"title" "info"' } });

                var titleLink = E('a', { href: item.url, text: item.title });
                titleLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    openGameModal(item.url, item.title);
                });

                var titleArea = E('div', { class: 'ea-title' }, [
                    E('div', { class: 'ea-meta-row' }, [
                        E('span', { class: 'ea-badge ea-badge-green', text: 'Free Activation' }),
                        item.isAvailable ? E('span', { class: 'ea-badge ea-badge-repack', text: 'Available Now' }) : null
                    ]),
                    E('h3', { class: 'ea-title-text' }, [titleLink])
                ]);

                var viewBtn = E('button', {
                    class: 'ea-btn ea-btn-primary',
                    type: 'button',
                    title: 'Open full release card in modal'
                }, [
                    svg('apps'),
                    E('span', { text: 'View Release' })
                ]);
                viewBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openGameModal(item.url, item.title);
                });

                var extBtn = E('a', {
                    class: 'ea-btn ea-btn-ghost',
                    href: item.url,
                    target: '_blank',
                    rel: 'noopener',
                    title: 'Open original web page in new tab'
                }, [
                    svg('open_in_new'),
                    E('span', { text: 'Original' })
                ]);
                extBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                });

                var infoArea = E('div', { class: 'ea-info-column' }, [
                    E('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' } }, [
                        viewBtn,
                        extBtn
                    ])
                ]);

                card.addEventListener('click', function (e) {
                    if (e.target.closest('a, button')) return;
                    openGameModal(item.url, item.title);
                });

                panel.append(titleArea, infoArea);
                card.append(panel);
                grid.append(card);
            });
        }

        mainViewContainer.append(head, grid);
    }

    // 3. Exclusive Repacks Tab
    function renderExclusiveTab() {
        var head = E('div', { class: 'dodi-section-head' }, [
            E('div', {}, [
                E('h2', { class: 'dodi-section-title' }, [
                    svg('star'),
                    E('span', { text: 'Exclusive Repacks' })
                ]),
                E('div', { class: 'dodi-section-desc', text: 'Exclusive repack editions by DODI and trusted release partners. Click any game to view details and downloads in modal.' })
            ])
        ]);

        var grid = E('div', { class: 'dodi-cards-grid' });

        if (!state.pinnedData.exclusive || state.pinnedData.exclusive.length === 0) {
            grid.append(E('div', { class: 'dodi-loading-state' }, [
                E('div', { class: 'dodi-spinner' }),
                E('span', { text: 'Loading Exclusive Repacks from home page...' })
            ]));
        } else {
            state.pinnedData.exclusive.forEach(function (item) {
                var card = E('article', { class: 'ea-card dodi-clickable-card' });
                var panel = E('div', { class: 'ea-panel', style: { gridTemplateColumns: '1fr', gridTemplateAreas: '"title" "info"' } });

                var titleLink = E('a', { href: item.url, text: item.title });
                titleLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    openGameModal(item.url, item.title);
                });

                var titleArea = E('div', { class: 'ea-title' }, [
                    E('div', { class: 'ea-meta-row' }, [
                        E('span', { class: 'ea-badge ea-badge-repack', text: 'Exclusive' })
                    ]),
                    E('h3', { class: 'ea-title-text' }, [titleLink])
                ]);

                var viewBtn = E('button', {
                    class: 'ea-btn ea-btn-primary',
                    type: 'button',
                    title: 'Open full release card in modal'
                }, [
                    svg('apps'),
                    E('span', { text: 'View Release' })
                ]);
                viewBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openGameModal(item.url, item.title);
                });

                var extBtn = E('a', {
                    class: 'ea-btn ea-btn-ghost',
                    href: item.url,
                    target: '_blank',
                    rel: 'noopener',
                    title: 'Open original web page in new tab'
                }, [
                    svg('open_in_new'),
                    E('span', { text: 'Original' })
                ]);
                extBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                });

                var infoArea = E('div', { class: 'ea-info-column' }, [
                    E('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' } }, [
                        viewBtn,
                        extBtn
                    ])
                ]);

                card.addEventListener('click', function (e) {
                    if (e.target.closest('a, button')) return;
                    openGameModal(item.url, item.title);
                });

                panel.append(titleArea, infoArea);
                card.append(panel);
                grid.append(card);
            });
        }

        mainViewContainer.append(head, grid);
    }

    // 4. Trending Repacks Tab (Ranked)
    function renderTrendingTab() {
        var head = E('div', { class: 'dodi-section-head' }, [
            E('div', {}, [
                E('h2', { class: 'dodi-section-title' }, [
                    svg('fire'),
                    E('span', { text: 'Trending Repacks' })
                ]),
                E('div', { class: 'dodi-section-desc', text: 'Top community releases ranked by activity and popularity. Click any game to view details and downloads in modal.' })
            ])
        ]);

        var list = E('div', { class: 'dodi-ranked-list' });

        if (!state.pinnedData.trending || state.pinnedData.trending.length === 0) {
            list.append(E('div', { class: 'dodi-loading-state' }, [
                E('div', { class: 'dodi-spinner' }),
                E('span', { text: 'Loading Trending Repacks from home page...' })
            ]));
        } else {
            state.pinnedData.trending.forEach(function (item) {
                var card = E('div', { class: 'dodi-ranked-card dodi-clickable-card' });

                var rankClass = 'dodi-rank-num';
                if (item.rank === 1) rankClass += ' dodi-rank-top1';
                else if (item.rank === 2) rankClass += ' dodi-rank-top2';
                else if (item.rank === 3) rankClass += ' dodi-rank-top3';

                var rankEl = E('div', { class: rankClass, text: '#' + item.rank });

                var info = E('div', { class: 'dodi-ranked-info' });
                var meta = E('div', { class: 'ea-meta-row' });
                if (item.size) {
                    meta.append(E('span', { class: 'ea-badge ea-badge-green', text: item.size }));
                }

                var titleLink = E('a', { href: item.url, text: item.title });
                titleLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    openGameModal(item.url, item.title);
                });

                var titleEl = E('h3', { class: 'dodi-ranked-title' }, [titleLink]);

                info.append(meta, titleEl);

                var actions = E('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } });

                var viewBtn = E('button', {
                    class: 'ea-btn ea-btn-primary',
                    type: 'button',
                    title: 'Open full release card in modal'
                }, [
                    svg('apps'),
                    E('span', { text: 'View Details' })
                ]);
                viewBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openGameModal(item.url, item.title);
                });

                var extBtn = E('a', {
                    class: 'ea-btn ea-btn-ghost',
                    href: item.url,
                    target: '_blank',
                    rel: 'noopener',
                    title: 'Open original web page in new tab'
                }, [
                    svg('open_in_new')
                ]);
                extBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                });

                actions.append(viewBtn, extBtn);

                card.addEventListener('click', function (e) {
                    if (e.target.closest('a, button')) return;
                    openGameModal(item.url, item.title);
                });

                card.append(rankEl, info, actions);
                list.append(card);
            });
        }

        mainViewContainer.append(head, list);
    }

    // 5. Search Tab (Auto-load first 5, then load next 5 on demand)
    function renderSearchTab() {
        if (state.isSearching) {
            mainViewContainer.append(E('div', { class: 'dodi-loading-state' }, [
                E('div', { class: 'dodi-spinner' }),
                E('span', { text: 'Searching and loading first 5 articles for "' + state.searchQuery + '"...' })
            ]));
            return;
        }

        var total = state.searchAllResults.length;
        var summary = E('div', { class: 'dodi-search-summary' }, [
            E('div', {}, [
                E('h2', { class: 'dodi-section-title' }, [
                    svg('search'),
                    E('span', { text: 'Search Results for "' + state.searchQuery + '"' })
                ]),
                E('div', { class: 'dodi-section-desc', text: 'Showing ' + state.searchLoadedCount + ' of ' + total + ' articles found' })
            ]),
            E('span', { class: 'ea-badge ea-badge-repack', text: total + ' Total Results' })
        ]);

        mainViewContainer.append(summary);

        if (total === 0) {
            mainViewContainer.append(E('div', { class: 'dodi-loading-state' }, [
                E('span', { text: 'No articles found matching "' + state.searchQuery + '".' })
            ]));
            return;
        }

        var grid = E('div', { class: 'dodi-cards-grid', id: 'dodi-search-grid' });

        // Render loaded articles
        var loadedCount = Math.min(state.searchLoadedCount, state.searchAllResults.length);
        for (var i = 0; i < loadedCount; i++) {
            var artData = state.articleCache[state.searchAllResults[i].url];
            if (artData) {
                grid.append(renderGameCard(artData));
            }
        }

        mainViewContainer.append(grid);

        // "Load Next 5 Results" Button
        if (state.searchLoadedCount < total) {
            var remaining = total - state.searchLoadedCount;
            var nextBatchCount = Math.min(5, remaining);

            var loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'dodi-load-more-btn';
            loadMoreBtn.appendChild(svg('download'));
            var loadMoreText = document.createElement('span');
            loadMoreText.textContent = 'Load Next 5 Results (' + remaining + ' remaining)';
            loadMoreBtn.appendChild(loadMoreText);

            loadMoreBtn.addEventListener('click', function () {
                loadMoreBtn.disabled = true;
                loadMoreBtn.innerHTML = '';
                loadMoreBtn.appendChild(E('div', { class: 'dodi-spinner' }));
                var loadingSpan = document.createElement('span');
                loadingSpan.textContent = 'Loading next ' + nextBatchCount + ' games...';
                loadMoreBtn.appendChild(loadingSpan);
                loadSearchBatch(state.searchLoadedCount, nextBatchCount);
            });

            mainViewContainer.append(loadMoreBtn);
        }
    }

    /* =========================================================================
       8. SEARCH ENGINE & BATCH LOADING (5 by 5)
       ========================================================================= */

    function performSearch(query) {
        if (!query) return;
        state.searchQuery = query;
        state.isSearching = true;
        state.activeTab = 'search';
        state.searchAllResults = [];
        state.searchLoadedCount = 0;
        var seq = ++state.searchSeq;

        ensureSearchTabInNav();
        renderCurrentTab();

        var searchUrl = 'https://dodi-repacks.site/?s=' + encodeURIComponent(query);
        try {
            history.pushState(null, '', searchUrl);
        } catch (e) {}

        requestPage(searchUrl).then(function (html) {
            if (seq !== state.searchSeq) return;
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');

            var articles = qa('article', doc);
            var results = [];

            articles.forEach(function (art) {
                var titleEl = q('.entry-title a, .entry-title', art);
                var title = txt(titleEl);
                var url = titleEl && titleEl.getAttribute('href') ? abs(titleEl.getAttribute('href')) : '';
                if (title && url && !results.some(function (r) { return r.url === url; })) {
                    results.push({ title: title, url: url });
                }
            });

            if (results.length === 0) {
                qa('.entry-title a', doc).forEach(function (a) {
                    var title = txt(a);
                    var url = a.getAttribute('href') ? abs(a.getAttribute('href')) : '';
                    if (title && url && !results.some(function (r) { return r.url === url; })) {
                        results.push({ title: title, url: url });
                    }
                });
            }

            state.searchAllResults = results;

            // Automatically load the FIRST 5 results
            var initialCount = Math.min(5, results.length);
            loadSearchBatch(0, initialCount, seq);

        }).catch(function (err) {
            if (seq !== state.searchSeq) return;
            state.isSearching = false;
            showToast('Search failed: ' + err.message);
            if (state.activeTab === 'search') renderCurrentTab();
        });
    }

    function loadSearchBatch(startIndex, count, seq) {
        if (seq === undefined) seq = state.searchSeq;
        var batch = state.searchAllResults.slice(startIndex, startIndex + count);
        if (batch.length === 0) {
            state.isSearching = false;
            if (state.activeTab === 'search') renderCurrentTab();
            return;
        }

        var promises = batch.map(function (item) {
            // Check if full article is already cached
            if (state.articleCache[item.url] && state.articleCache[item.url].downloads && state.articleCache[item.url].downloads.length > 0) {
                return Promise.resolve(state.articleCache[item.url]);
            }
            return requestPage(item.url).then(function (html) {
                var parsed = parseArticleFromHtml(html, item.url);
                state.articleCache[item.url] = parsed;
                return parsed;
            }).catch(function () {
                // Fallback basic item
                var fb = {
                    title: item.title,
                    cleanTitle: item.title,
                    url: item.url,
                    poster: '',
                    info: { descriptionSnippet: 'Click to open release.' },
                    sections: { spoilers: [], repackFeaturesHtml: '', backwardsHtml: '' },
                    downloads: []
                };
                state.articleCache[item.url] = fb;
                return fb;
            });
        });

        Promise.all(promises).then(function () {
            if (seq !== state.searchSeq) return;
            state.searchLoadedCount = startIndex + batch.length;
            state.isSearching = false;
            updateSearchTabBadge();
            if (state.activeTab === 'search') renderCurrentTab();
        });
    }

    /* =========================================================================
       9. INITIALIZATION & DOM MOUNTING
       ========================================================================= */

    function init() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', init, { once: true });
            return;
        }

        try {
            // 1. Parse Sticky Pinned post for Activation, Exclusive, Trending (with cross-page persistence)
            var localPinned = parseStickyPost(document);
            if (hasPinnedItems(localPinned)) {
                state.pinnedData = localPinned;
                savePinnedData(localPinned);
            } else {
                var savedRecord = loadSavedPinnedData();
                if (savedRecord && hasPinnedItems(savedRecord.data)) {
                    state.pinnedData = savedRecord.data;
                    // If cached data is older than 2 hours, refresh from home page in background
                    if (Date.now() - savedRecord.timestamp > 2 * 60 * 60 * 1000) {
                        fetchHomePagePinned();
                    }
                } else {
                    // Direct visit to page 2 or search with empty cache - fetch in background
                    fetchHomePagePinned();
                }
            }

            // 2. Parse main articles ALREADY on the current page with full poster, specs, sections, and links
            var articles = qa('article', document);
            var parsedArticles = [];

            // Check if arriving via search URL (?s=query)
            var searchParam = new URLSearchParams(location.search).get('s');

            articles.forEach(function (art) {
                var p = parseArticleFromDOM(art);
                if (!p.isSticky && p.title) {
                    parsedArticles.push(p);
                    // Only cache as complete article if it's NOT a search summary page
                    if (!searchParam) {
                        state.articleCache[p.url] = p;
                    }
                }
            });

            state.mainArticles = parsedArticles;

            // 3. Parse Pagination
            var pagLinks = qa('.navigation.pagination .page-numbers', document);
            state.pagination = pagLinks.map(function (pl) {
                return {
                    text: txt(pl),
                    url: pl.getAttribute('href'),
                    isCurrent: pl.classList.contains('current')
                };
            });

            // 4. Handle Search Page Arrival (?s=query)
            if (searchParam) {
                state.searchQuery = searchParam;
                state.activeTab = 'search';
                state.searchAllResults = parsedArticles.map(function (a) { return { title: a.title, url: a.url }; });
                state.isSearching = true;
                var initCount = Math.min(5, state.searchAllResults.length);
                loadSearchBatch(0, initCount);
            }

            // 5. Mount Modern Application
            appRoot = E('div', { id: 'dodi-app' });
            var headerEl = renderHeader();
            mainViewContainer = E('main', { class: 'dodi-main' });

            appRoot.append(headerEl, mainViewContainer);
            document.body.append(appRoot);

            ensureModal();

            renderCurrentTab();
            console.log('[DODI Modern UI] Mounted with modal dialogs, compact sections, IndexedDB cache, batch resolution, and fixed search.');

        } catch (error) {
            document.documentElement.classList.remove('dodi-on');
            console.error('[DODI Modern UI] Init error:', error);
        }
    }

    init();

})();
