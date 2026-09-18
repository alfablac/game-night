// ==UserScript==
// @name         FitGirl Modern Dark UI
// @author       alfablac
// @version      1.6.3
// @namespace    fitgirl.modern.violentmonkey
// @downloadURL  https://raw.githubusercontent.com/alfablac/game-night/main/fitgirl.user.js
// @updateURL    https://raw.githubusercontent.com/alfablac/game-night/main/fitgirl.user.js
// @match        https://fitgirl-repacks.site/*
// @match        https://www.fitgirl-repacks.site/*
// @match        https://web.tolstoycomments.com/widget/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @description  Tema escuro uniforme, tipografia moderna, carrosséis com swipe no touch e secções recolhíveis nos posts da FitGirl.
// ==/UserScript==

(() => {


  // Tolstoy is rendered in a cross-origin iframe, so its document needs its
  // own scoped stylesheet. Keep the main FitGirl UI untouched in this frame.
  if (window.top !== window.self && /(^|\.)tolstoycomments\.com$/i.test(location.hostname)) {
    GM_addStyle(`
      :root { color-scheme: dark !important; }

      html,
      body {
        background: #171f28 !important;
        color: #dce6ed !important;
        font-size: 14px !important;
        line-height: 1.35 !important;
      }

      body,
      body * {
        border-color: #2b3a48 !important;
      }

      body div,
      body section,
      body main,
      body header,
      body footer,
      body article,
      body form {
        background-color: #171f28 !important;
        color: #dce6ed !important;
      }

      body input,
      body textarea,
      body [contenteditable="true"] {
        background: #243140 !important;
        color: #e8f5fa !important;
      }

      body button {
        background: #243140 !important;
        color: #e8f5fa !important;
      }

      body h1,
      body h2,
      body h3,
      body p,
      body a,
      body button,
      body input,
      body textarea,
      body [contenteditable="true"] {
        font-size: 14px !important;
        line-height: 1.35 !important;
      }

      body textarea,
      body [contenteditable="true"] {
        min-height: 52px !important;
        padding: 8px 10px !important;
        resize: vertical !important;
      }

      .app,
      .app-comments {
        width: 100% !important;
        max-width: 100% !important;
      }

      .app-chat-group-child.app-chat-py {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }

      .app-chat-editor-padding {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }

      .app-comment {
        margin: 0 !important;
        padding: 0 0 8px !important;
      }

      .app-comment + .app-comment {
        margin-top: 2px !important;
      }

      .app-comment__root {
        margin: 0 !important;
        padding: 0 !important;
      }

      .app-comment__root.child {
        margin-top: 4px !important;
      }

      .app-comment__action {
        margin-top: 2px !important;
      }

      body a {
        color: #82d8ff !important;
      }

      body ::placeholder {
        color: #91a6b5 !important;
      }
    `);
    return;
  }

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,500,0,0');

[style*="garold1-1.jpg"],
[style*="garold4.jpg"] {
  background-image: none !important;
}

:root {
  color-scheme: dark;
  --fg-font: Inter, system-ui, sans-serif;
}

html,
body,
#page,
#page .site,
#main,
#content,
.site-content,
.site-main,
.content-area,
#primary,
#secondary,
.site-footer,
.site-info,
#colophon,
#masthead,
.nav-menu,
.widget,
.widget *,
.hentry,
.entry-header,
.entry-content,
.entry-content > div,
.entry-content > section,
.entry-meta,
.entry-meta *,
.cat-links,
.cat-links a,
.comments-area,
.comment-list,
.comment-content {
  background: #171f28 !important;
  color: #dce6ed !important;
  border-color: #2b3a48 !important;
}

body {
  font-family: var(--fg-font) !important;
  font-size: 15px !important;
}

body,
body * {
  font-family: var(--fg-font) !important;
}

html {
  font-size: 15px !important;
}

.site {
  max-width: 1380px !important;
}

.header-main {
  display: flex !important;
  align-items: center !important;
  gap: 1.1rem !important;
  min-height: 56px !important;
  margin: .5rem 0 !important;
  padding: .55rem .8rem !important;
  box-sizing: border-box !important;
  background: #141c25 !important;
  border: 1px solid #2b3a48 !important;
  border-radius: 10px !important;
  width: 100% !important;
}

#masthead.site-header {
  height: auto !important;
  overflow: visible !important;
  padding: 0 !important;
  width: var(--fg-content-width, auto) !important;
  max-width: none !important;
  transform: translateX(var(--fg-content-offset, 0)) !important;
}

#masthead .header-main,
#masthead .header-main * {
  font-family: Inter, system-ui, sans-serif !important;
}

.header-main .site-title {
  flex: 0 0 auto !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.header-main .site-title a {
  color: #e8f5fa !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  text-decoration: none !important;
}

.header-main .site-title a:hover {
  color: #82d8ff !important;
}

.header-main .primary-navigation {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.header-main .primary-navigation .nav-menu {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: .2rem !important;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
}

.header-main .nav-menu > li {
  display: flex !important;
  align-items: center !important;
  position: relative !important;
  margin: 0 !important;
}

.header-main .nav-menu a {
  display: flex !important;
  align-items: center !important;
  min-height: 32px !important;
  padding: .5rem .65rem !important;
  border-radius: 7px !important;
  color: #dce6ed !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}

.header-main .nav-menu > li > a:hover,
.header-main .nav-menu > li:focus-within > a {
  background: #243140 !important;
  color: #82d8ff !important;
}

.header-main .nav-menu .menu-item-has-children > a::after {
  content: '' !important;
  position: absolute !important;
  top: 50% !important;
  right: .58rem !important;
  display: block !important;
  width: 5px !important;
  height: 5px !important;
  margin: 0 !important;
  background: none !important;
  border: solid #9fdcff !important;
  border-width: 0 1.5px 1.5px 0 !important;
  transform: translateY(-65%) rotate(45deg) !important;
}

.header-main .nav-menu .menu-item-has-children > a {
  position: relative !important;
  padding-right: 1.45rem !important;
}

.header-main .nav-menu .sub-menu {
  position: absolute !important;
  top: calc(100% + .25rem) !important;
  left: 0 !important;
  z-index: 10000 !important;
  display: none !important;
  min-width: 220px !important;
  margin: 0 !important;
  padding: .35rem !important;
  background: #1b2632 !important;
  border: 1px solid #3a4d5d !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 20px #0008 !important;
  list-style: none !important;
}

.header-main .nav-menu li:hover > .sub-menu,
.header-main .nav-menu li:focus-within > .sub-menu {
  display: block !important;
}

.header-main .nav-menu .sub-menu a {
  white-space: normal !important;
}

.header-main .nav-menu .sub-menu a:hover,
.header-main .nav-menu .sub-menu li:focus-within > a {
  background: #243140 !important;
  color: #82d8ff !important;
}

.header-main .menu-toggle {
  font-family: Inter, system-ui, sans-serif !important;
}

.header-main .search-toggle {
  flex: 0 0 42px !important;
  width: 42px !important;
  height: 42px !important;
  margin: 0 !important;
  background: #243140 !important;
  border: 1px solid #3f5a6d !important;
  border-radius: 8px !important;
}

.header-main .search-toggle a {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  font-size: 0 !important;
  text-decoration: none !important;
}

.header-main .search-toggle a::before {
  content: 'search';
  display: block !important;
  color: #e8f5fa !important;
  font-family: 'Material Symbols Outlined' !important;
  font-size: 21px !important;
  line-height: 40px !important;
  text-align: center !important;
  font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20;
}

.header-main .search-toggle:hover,
.header-main .search-toggle.active {
  background: #2c7894 !important;
  border-color: #82d8ff !important;
}

#search-container.search-box-wrapper {
  position: static !important;
  inset: auto !important;
  clear: both !important;
  width: 100% !important;
  height: auto !important;
  background: #141c25 !important;
  border: 1px solid #2b3a48 !important;
  border-radius: 0 0 10px 10px !important;
  box-sizing: border-box !important;
  margin: .35rem 0 .7rem !important;
  padding: .55rem .8rem !important;
}

#search-container .search-box,
#search-container .search-form {
  background: transparent !important;
}

#search-container .search-form {
  display: flex !important;
  align-items: center !important;
  gap: .5rem !important;
  margin: 0 !important;
}

#search-container .search-form label {
  flex: 1 1 auto !important;
  margin: 0 !important;
}

#search-container .search-field {
  width: 100% !important;
  box-sizing: border-box !important;
  padding: .55rem .7rem !important;
  background: #1b2632 !important;
  color: #e8f5fa !important;
  border: 1px solid #3f5a6d !important;
  border-radius: 7px !important;
  font: 400 14px Inter, system-ui, sans-serif !important;
}

#search-container .search-field::placeholder {
  color: #91a6b5 !important;
}

#search-container .search-submit {
  padding: .55rem .8rem !important;
  background: #243140 !important;
  color: #e8f5fa !important;
  border: 1px solid #3f5a6d !important;
  border-radius: 7px !important;
  font: 600 13px Inter, system-ui, sans-serif !important;
  cursor: pointer !important;
}

#search-container .search-submit:hover {
  background: #2c7894 !important;
  color: #fff !important;
}

@media (max-width: 900px) {
  .header-main {
    align-items: flex-start !important;
    flex-wrap: wrap !important;
  }

  .header-main .primary-navigation {
    flex-basis: 100% !important;
  }

  .header-main .primary-navigation .nav-menu {
    justify-content: flex-start !important;
    flex-wrap: wrap !important;
  }
}

#secondary {
  display: none !important;
}

#page::before,
.site::before {
  display: none !important;
}

:is(#main, .main-content, .site-main):has(> #content-sidebar) {
  display: flex !important;
  align-items: flex-start !important;
  gap: 26px !important;
  float: none !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

:is(#main, .main-content, .site-main):has(> #content-sidebar) > #primary,
:is(#main, .main-content, .site-main):has(> #content-sidebar) > .content-area {
  flex: 1 1 0% !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 100% !important;
  float: none !important;
}

:is(#main, .main-content, .site-main):has(> #content-sidebar) > #content-sidebar,
:is(#main, .main-content, .site-main):has(> #content-sidebar) > .content-sidebar {
  flex: 0 0 300px !important;
  width: 300px !important;
  margin: 0 !important;
  float: none !important;
  padding-left: 0 !important;
}

.content-area > #content,
:is(#main, .main-content, .site-main) > #content,
#content.site-content {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: auto !important;
  max-width: 100% !important;
  float: none !important;
  box-sizing: border-box !important;
}

.entry-header,
.site-content {
  padding: 0 !important;
}

.entry-header {
  margin-bottom: .25rem !important;
}

.footer-sidebar {
    padding-top: 0px !important;
}

.entry-title {
  margin: 0 0 .25rem !important;
}

.entry-meta {
  margin: 0 !important;
  line-height: 1.2 !important;
}

.entry-content {
  margin-top: .25rem !important;
  padding: 1px 10px 0 !important;
}

#primary,
#content-sidebar {
  padding-top: 16px !important;
}

.entry-header,
.entry-content,
.entry-meta,
.entry-footer {
  margin-left: 0 !important;
  margin-right: 0 !important;
  max-width: none !important;
  padding-bottom: 5px !important;
}

.entry-content {
  padding-left: 12px !important;
  padding-right: 12px !important;
}

.entry-content p,
.entry-content li,
.entry-content ul,
.entry-content ol,
.entry-content td,
.comment-content p,
.comment-content li {
  font-size: 15px !important;
}

.hentry {
  border: 1px solid #2b3a48 !important;
  border-radius: 12px !important;
  padding: .9rem 1rem !important;
  margin-bottom: .9rem !important;
}

.entry-title,
.entry-title a {
  font-family: Inter, system-ui, sans-serif !important;
  font-size: 1.55rem !important;
  line-height: 1.22 !important;
  font-weight: 700 !important;
  color: #aebdca !important;
}

.entry-title a:hover {
  color: #e6f6ff !important;
}

.entry-title.fg-title-off {
  display: none !important;
}

.entry-content > h3.fg-post-title,
.entry-content > h3.fg-post-title a {
  font-family: Inter, system-ui, sans-serif !important;
  font-size: 1.55rem !important;
  line-height: 1.24 !important;
  font-weight: 700 !important;
  color: #e2eef7 !important;
  text-decoration: none !important;
  margin: .15rem 0 .6rem !important;
}

.entry-content > h3.fg-post-title a:hover {
  color: #fff !important;
}

.tolstoycomments-cc {
  color: #aebdca !important;
}

iframe[id^="tolstoycommentsiframe"],
iframe[src*="web.tolstoycomments.com/widget/"] {
  display: block !important;
  position: static !important;
  width: 100% !important;
  max-width: 100% !important;
  background: #171f28 !important;
  border: 0 !important;
  border-radius: 10px !important;
  color-scheme: dark !important;
}

.tolstoycomments-feed,
.comments-area,
iframe[id^="tolstoycommentsiframe"],
iframe[src*="web.tolstoycomments.com/widget/"] {
  width: 100% !important;
  max-width: none !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  box-sizing: border-box !important;
}

article.hentry .post-navigation,
article.hentry .comments-area,
article.hentry .tolstoycomments-feed {
  width: 100% !important;
  max-width: none !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  box-sizing: border-box !important;
}

#jBnskDj9 {
  display: none !important;
}

.post-navigation {
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
  margin: .8rem 0 1rem !important;
  padding: .8rem 0 !important;
  border-top: 1px solid #2b3a48 !important;
  border-bottom: 1px solid #2b3a48 !important;
}

.post-navigation .nav-links {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: .8rem !important;
}

.post-navigation a {
  display: block !important;
  padding: .7rem .8rem !important;
  background: #1b2632 !important;
  border: 1px solid #2b3a48 !important;
  border-radius: 8px !important;
  color: #82d8ff !important;
  line-height: 1.4 !important;
  text-decoration: none !important;
}

.post-navigation a:hover {
  background: #243140 !important;
  border-color: #82d8ff !important;
  color: #e8f5fa !important;
}

.post-navigation .meta-nav {
  display: block !important;
  margin-bottom: .3rem !important;
  color: #9fb5c4 !important;
  font-size: .78rem !important;
  font-weight: 700 !important;
  letter-spacing: .04em !important;
  text-transform: uppercase !important;
}

@media (max-width: 700px) {
  .post-navigation .nav-links {
    grid-template-columns: 1fr !important;
  }
}

.entry-content a,
.widget-area a,
.primary-sidebar a {
  color: #82d8ff !important;
}

.entry-content p,
.entry-content ul,
.entry-content ol {
  margin: .45rem 0 !important;
}

.entry-content ul {
  list-style: none !important;
  padding-left: 0 !important;
}

.entry-content ul ul {
  padding-left: 1.1rem !important;
}

.entry-content img {
  border-radius: 12px !important;
  box-shadow: 0 3px 16px #0009 !important;
}

.entry-content img[src*="torrent-stats.info"] {
  filter: invert(.8) hue-rotate(180deg) brightness(.7) !important;
  background: #171f28 !important;
}

img[src*="support2.jpg"] {
  margin: 0 !important;
}

article.fg-upcoming-repacks .entry-content {
  margin-top: 0 !important;
}

article.fg-upcoming-repacks .entry-content > p {
  margin: .2rem 0 !important;
  line-height: 1.2 !important;
}

article.fg-upcoming-repacks .entry-content img {
  width: 130px !important;
  max-width: 130px !important;
  height: 180px !important;
  object-fit: cover !important;
}

article.fg-upcoming-repacks h3.fg-upcoming-games {
  margin: .1rem 0 !important;
  line-height: 1.12 !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 {
  min-height: 0 !important;
  margin: .25rem 0 !important;
  padding: .5rem !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 h2,
article.fg-upcoming-repacks .wplp_widget_13066 h3 {
  margin: .1rem 0 .35rem !important;
  line-height: 1.1 !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 .wpcu_block_title {
  display: block !important;
  margin: 0 0 .35rem !important;
  line-height: 1.1 !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 img {
  width: 110px !important;
  max-width: 110px !important;
  height: 150px !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 .swiper-slide {
  width: 118px !important;
  margin-right: 8px !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 a.thumbnail,
article.fg-upcoming-repacks .wplp_widget_13066 .img_cropper,
article.fg-upcoming-repacks .wplp_widget_13066 .wplp_thumb {
  display: block !important;
  width: 110px !important;
  max-width: 110px !important;
  height: 150px !important;
  max-height: 150px !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

article.fg-upcoming-repacks .wplp_widget_13066 .wplp_thumb {
  object-fit: cover !important;
}

.widget {
  border: 1px solid #2b3a48 !important;
  border-radius: 12px !important;
  padding: .7rem !important;
  margin-bottom: .8rem !important;
}

.wplp_outside {
  border: 1px solid #2b3a48 !important;
}

/* Latest Repacks: keep the cards in a simple, link-friendly scroll strip. */
.wplp_widget_13066 {
  overflow: hidden !important;
}

.wplp_widget_13066 .wplp_listposts {
  display: flex !important;
  flex-wrap: nowrap !important;
  width: auto !important;
  max-width: none !important;
  gap: 8px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding: .1rem 0 .35rem !important;
  transform: none !important;
  scroll-snap-type: x proximity !important;
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-x pan-y pinch-zoom !important;
  overscroll-behavior-x: contain !important;
}

.wplp_widget_13066 .swiper-wrapper {
  transform: none !important;
  touch-action: pan-x pan-y pinch-zoom !important;
}

.wplp_widget_13066 .wplp_listposts.fg-dragging {
  cursor: grabbing !important;
  user-select: none !important;
}

.wplp_widget_13066 .swiper-slide {
  display: block !important;
  flex: 0 0 110px !important;
  width: 110px !important;
  min-width: 110px !important;
  margin: 0 !important;
  scroll-snap-align: start !important;
}

.wplp_widget_13066 .swiper-slide-duplicate,
.wplp_widget_13066 .swiper-button-next,
.wplp_widget_13066 .swiper-button-prev,
.wplp_widget_13066 .swiper-pagination {
  display: none !important;
}

.wplp_widget_13066 .swiper-lazy-preloader,
.wplp_widget_13066 .swiper-lazy-preloader-white,
.wplp_widget_13066 .swiper-lazy-preloader-black {
  display: none !important;
  animation: none !important;
}

.wplp_widget_13066 .wplp_listposts::-webkit-scrollbar {
  height: 7px !important;
}

.wplp_widget_13066 .wplp_listposts::-webkit-scrollbar-thumb {
  background: #526675 !important;
  border-radius: 8px !important;
}

#content-sidebar .widget a {
  font-size: 14px !important;
}

#content-sidebar .widget a b,
#content-sidebar .widget a strong {
  font-size: 20px !important;
}

#content-sidebar #supplementary {
  margin: 0 !important;
  padding: 0 !important;
}

#content-sidebar #footer-sidebar {
  position: static !important;
  width: 100% !important;
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: .8rem !important;
}

#content-sidebar #footer-sidebar > aside {
  position: static !important;
  inset: auto !important;
  width: 100% !important;
  height: auto !important;
  margin: 0 !important;
}

#content-sidebar #footer-sidebar .footer-grid {
  width: 100% !important;
}

#content-sidebar #footer-sidebar .widget-grid-view-image {
  max-width: 18% !important;
  margin-right: 2% !important;
}

#content-sidebar #footer-sidebar img {
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
}

.fg-support-cause,
.fg-support-cause * {
  background: #1e2937 !important;
}

.fg-support-cause {
  border-color: #3d5568 !important;
}

#lbjoin,
#lbjoin2 {
  background: #24890d !important;
  color: #fff !important;
  border-radius: 8px !important;
}

.fg-top {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 1.1rem !important;
  align-items: flex-start !important;
  margin: .3rem 0 .8rem !important;
}

.fg-top-poster {
  flex: 0 0 auto !important;
  max-width: 220px !important;
}

.fg-top-poster img {
  float: none !important;
  margin: 0 !important;
  max-width: 220px !important;
}

.fg-top-info {
  flex: 1 1 280px !important;
  min-width: 0 !important;
}

.fg-top-info > p {
  margin: .1rem 0 !important;
}

.fg-tabs {
  display: flex !important;
  gap: .45rem !important;
  flex-wrap: wrap !important;
  margin: .7rem 0 0 !important;
  padding: .45rem !important;
  background: #141c25 !important;
  border: 1px solid #2b3a48 !important;
  border-radius: 10px !important;
}

.fg-tab,
.fg-toggle,
.su-spoiler-title,
.fg-copy {
  appearance: none !important;
  cursor: pointer !important;
  background: #243140 !important;
  color: #e8f5fa !important;
  border: 1px solid #3f5a6d !important;
  border-radius: 8px !important;
  padding: .55rem .85rem !important;
  font: 600 13px Inter, sans-serif !important;
}

.fg-toggle,
.su-spoiler-title {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: left !important;
}

.fg-tab,
.fg-toggle,
.fg-copy {
  text-transform: none !important;
  letter-spacing: .2px !important;
}

.fg-tab:hover,
.fg-tab.active,
.fg-toggle:hover,
.su-spoiler-title:hover {
  background: #2c7894 !important;
  color: #fff !important;
}

.fg-tab-direct {
  background: #245f78 !important;
}

.fg-tab-direct:hover,
.fg-tab-direct.active {
  background: #2c7894 !important;
}

details.fg-popular-repacks > summary {
  display: none !important;
}

details.fg-popular-repacks > .fg-popular-body {
  display: block !important;
}

details.fg-sidebar > summary {
  display: none !important;
}

#content-sidebar > details.fg-sidebar {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
}

details.fg-sidebar > .fg-sidebar-body {
  display: block !important;
}

@media (max-width: 900px) {
  html {
    font-size: 13px !important;
  }

  body {
    font-size: 13px !important;
  }

  :is(#main, .main-content, .site-main):has(> #content-sidebar) {
    flex-direction: column !important;
    gap: 4px !important;
  }

  :is(#main, .main-content, .site-main):has(> #content-sidebar) > #primary,
  :is(#main, .main-content, .site-main):has(> #content-sidebar) > .content-area,
  :is(#main, .main-content, .site-main):has(> #content-sidebar) > #content-sidebar,
  :is(#main, .main-content, .site-main):has(> #content-sidebar) > .content-sidebar {
    width: 100% !important;
    flex: 0 0 auto !important;
  }

  :is(#main, .main-content, .site-main):has(> #content-sidebar) > #content-sidebar,
  :is(#main, .main-content, .site-main):has(> #content-sidebar) > .content-sidebar {
    order: -1 !important;
    padding-top: 0 !important;
  }

  .header-main .menu-toggle {
    display: none !important;
  }

  #main,
  .main-content,
  .site-main,
  #primary,
  .content-area,
  .site-content,
  article {
    width: 100% !important;
    max-width: none !important;
    box-sizing: border-box !important;
  }

  body {
    overflow-x: hidden !important;
  }

  details.fg-popular-repacks .widgets-grid-layout {
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    overflow-x: auto !important;
    overscroll-behavior-x: contain !important;
    padding-bottom: 4px !important;
    scroll-snap-type: x proximity !important;
  }

  details.fg-popular-repacks .widget-grid-view-image {
    float: none !important;
    flex: 0 0 100px !important;
    width: 100px !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
    scroll-snap-align: start !important;
  }

  details.fg-popular-repacks .widget-grid-view-image img {
    display: block !important;
    width: 100% !important;
    min-width: 100% !important;
    max-width: none !important;
    height: 134px !important;
    max-height: 134px !important;
    object-fit: cover !important;
  }

  details.fg-popular-repacks .jetpack_top_posts_widget .widgettitle {
    margin: .2rem 0 .45rem !important;
    font-size: 16px !important;
    line-height: 1.1 !important;
  }

  #content-sidebar .footer-grid .widgets-grid-layout,
  #supplementary .footer-grid .widgets-grid-layout {
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    overflow-x: auto !important;
    overscroll-behavior-x: contain !important;
    padding-bottom: 4px !important;
    scroll-snap-type: x proximity !important;
  }

  #content-sidebar .footer-grid .widget-grid-view-image,
  #supplementary .footer-grid .widget-grid-view-image {
    float: none !important;
    flex: 0 0 100px !important;
    width: 100px !important;
    min-width: 0 !important;
    max-width: none !important;
    margin: 0 !important;
    scroll-snap-align: start !important;
  }

  #content-sidebar .footer-grid .widget-grid-view-image img,
  #supplementary .footer-grid .widget-grid-view-image img {
    display: block !important;
    width: 100% !important;
    min-width: 100% !important;
    max-width: none !important;
    height: 134px !important;
    max-height: 134px !important;
    object-fit: cover !important;
  }

  #content-sidebar .footer-grid .jetpack_top_posts_widget .widgettitle,
  #supplementary .footer-grid .jetpack_top_posts_widget .widgettitle {
    margin: .2rem 0 .45rem !important;
    font-size: 16px !important;
    line-height: 1.1 !important;
  }

  details.fg-sidebar > summary {
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: .55rem .75rem !important;
    border: 1px solid #3f5a6d !important;
    border-radius: 8px !important;
    background: #243140 !important;
    color: #e8f5fa !important;
    cursor: pointer !important;
    font: 600 13px Inter, sans-serif !important;
    list-style: none !important;
  }

  details.fg-sidebar > summary::-webkit-details-marker {
    display: none !important;
  }

  details.fg-sidebar > summary::before {
    content: 'widgets' !important;
    margin-right: .45rem !important;
    font-family: 'Material Symbols Outlined' !important;
    font-size: 16px !important;
  }

  details.fg-sidebar[open] > summary {
    border-radius: 8px 8px 0 0 !important;
    background: #2c7894 !important;
  }

  details.fg-sidebar > .fg-sidebar-body {
    display: none !important;
    padding: .2rem !important;
    border: 1px solid #3f5a6d !important;
    border-top: 0 !important;
    border-radius: 0 0 8px 8px !important;
    background: #192530 !important;
  }

  details.fg-sidebar[open] > .fg-sidebar-body {
    display: block !important;
  }

  details.fg-sidebar .widget {
    margin: 0 0 .3rem !important;
    padding: .35rem !important;
  }

  details.fg-sidebar .widget > p:empty,
  details.fg-sidebar #supplementary p:empty {
    display: none !important;
  }

  details.fg-sidebar #footer-sidebar {
    gap: .3rem !important;
  }

  details.fg-sidebar #supplementary {
    margin: 0 !important;
    padding: 0 !important;
  }

  #content-sidebar,
  details.fg-sidebar,
  details.fg-sidebar > .fg-sidebar-body {
    height: auto !important;
    min-height: 0 !important;
    margin-bottom: 0 !important;
  }

  details.fg-popular-repacks > summary {
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: .55rem .75rem !important;
    border: 1px solid #3f5a6d !important;
    border-radius: 8px !important;
    background: #243140 !important;
    color: #e8f5fa !important;
    cursor: pointer !important;
    font: 600 13px Inter, sans-serif !important;
    list-style: none !important;
  }

  details.fg-popular-repacks > summary::-webkit-details-marker {
    display: none !important;
  }

  details.fg-popular-repacks > summary::before {
    content: 'star' !important;
    margin-right: .45rem !important;
    font-family: 'Material Symbols Outlined' !important;
    font-size: 16px !important;
  }

  details.fg-popular-repacks[open] > summary {
    border-radius: 8px 8px 0 0 !important;
    background: #2c7894 !important;
  }

  details.fg-popular-repacks > .fg-popular-body {
    display: none !important;
    padding: .7rem !important;
    border: 1px solid #3f5a6d !important;
    border-top: 0 !important;
    border-radius: 0 0 8px 8px !important;
    background: #192530 !important;
  }

  details.fg-popular-repacks[open] > .fg-popular-body {
    display: block !important;
  }
}

@media (max-width: 768px) {
  html,
  body {
    font-size: 11px !important;
  }

  .header-main .site-title a {
    font-size: 1.1rem !important;
  }

  .header-main .nav-menu a,
  .header-main .menu-toggle,
  .header-main .search-field,
  .header-main .search-submit,
  .fg-tab,
  .fg-toggle,
  .su-spoiler-title,
  .fg-copy,
  .fg-popular-repacks > summary,
  .fg-sidebar > summary {
    font-size: 11px !important;
  }

  .entry-content,
  .entry-content p,
  .entry-content li,
  .entry-meta,
  .entry-meta *,
  #content-sidebar .widget,
  #content-sidebar .widget a {
    font-size: 11px !important;
  }

  details.fg-popular-repacks .widgets-grid-layout {
    gap: 7px !important;
  }

  details.fg-popular-repacks .widget-grid-view-image {
    flex-basis: 112px !important;
    width: 112px !important;
  }

  details.fg-popular-repacks .widget-grid-view-image img {
    width: 100% !important;
    min-width: 100% !important;
    max-width: none !important;
    height: 150px !important;
    max-height: 150px !important;
  }

  #content-sidebar .footer-grid .widgets-grid-layout,
  #supplementary .footer-grid .widgets-grid-layout {
    gap: 7px !important;
  }

  #content-sidebar .footer-grid .widget-grid-view-image,
  #supplementary .footer-grid .widget-grid-view-image {
    flex-basis: 112px !important;
    width: 112px !important;
  }

  #content-sidebar .footer-grid .widget-grid-view-image img,
  #supplementary .footer-grid .widget-grid-view-image img {
    height: 150px !important;
    max-height: 150px !important;
  }
}

.fg-tab-torrent {
  background: #405b4d !important;
}

.fg-tab-torrent:hover,
.fg-tab-torrent.active {
  background: #52745f !important;
}

.fg-tab-panel {
  margin: .15rem 0 .85rem !important;
  padding: .7rem .85rem !important;
  background: #192530 !important;
  border: 1px solid #39556a !important;
  border-top: 3px solid #3c8bb0 !important;
  border-radius: 0 0 12px 12px !important;
  box-shadow: inset 0 1px #ffffff08, 0 5px 14px #0003 !important;
}

.fg-tab-panel-torrent {
  border-top-color: #648d70 !important;
}

.fg-tab-panel > :first-child {
  margin-top: 0 !important;
}

.fg-tab-panel > :last-child {
  margin-bottom: 0 !important;
}

details.fg-extra.fg-backwards {
  background: #223442 !important;
  border-color: #6a8ca3 !important;
  border-left: 3px solid #82b8d3 !important;
  box-shadow: 0 2px 10px #0005 !important;
}

details.fg-extra.fg-backwards > summary {
  background: #304b5c !important;
  color: #f0f8fc !important;
}

.entry-content li[data-fg-copy] {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: center !important;
  column-gap: .65rem !important;
  padding-right: 0 !important;
}

.entry-content li[data-fg-copy] > .fg-hoster-info {
  grid-column: 1 !important;
  grid-row: 1 !important;
  min-width: 0 !important;
}

.entry-content li[data-fg-copy] > .fg-copy {
  grid-column: 2 !important;
  grid-row: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-self: end !important;
  margin: 0 !important;
  vertical-align: middle !important;
  padding: .3rem .6rem !important;
  font-size: 11.5px !important;
}

.entry-content li[data-fg-copy] > .su-spoiler,
.entry-content li[data-fg-copy] > details {
  grid-column: 1 / -1 !important;
  grid-row: 2 !important;
  min-width: 0 !important;
  width: 100% !important;
}

.fg-copy.ok {
  background: #2c7d5c !important;
}

.fg-ms {
  font-family: 'Material Symbols Outlined' !important;
  font-feature-settings: 'liga' !important;
  font-variant-ligatures: normal !important;
  font-size: 17px;
  line-height: 1;
  display: inline-block;
  vertical-align: -3px;
  margin-right: .35rem;
  font-variation-settings:
    'FILL' 0,
    'wght' 500,
    'GRAD' 0,
    'opsz' 20;
}

.fa,
[class^='fa-'],
[class*=' fa-'],
.fa::before,
.fa::after,
[class^='fa-']::before,
[class^='fa-']::after,
[class*=' fa-']::before,
[class*=' fa-']::after {
  font-family: FontAwesome !important;
  font-style: normal !important;
}

.fas,
[class^='fas-'],
[class*=' fas-'],
.fas::before,
.fas::after,
[class^='fas-']::before,
[class^='fas-']::after,
[class*=' fas-']::before,
[class*=' fas-']::after {
  display: inline-block !important;
  width: auto !important;
  height: .9em !important;
  font-family: 'Font Awesome 5 Free' !important;
  font-size: .9em !important;
  font-style: normal !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  vertical-align: -.05em !important;
}

/* Queue/send controls injected by the site's download helper. Use the
   already-loaded symbol font so missing Font Awesome files cannot render squares. */
html body i.fas.queue.base,
html body i.fas.send.base {
  display: inline-block !important;
  width: 1em !important;
  height: 1em !important;
  box-sizing: content-box !important;
  margin: 0 .3rem !important;
  padding: 0 .1rem !important;
  position: static !important;
  float: none !important;
  transform: none !important;
  color: #fcc533 !important;
  font-size: 0 !important;
  line-height: 1 !important;
  vertical-align: -.1em !important;
  white-space: nowrap !important;
}

html body i.fas.queue.base::before,
html body i.fas.send.base::before {
  display: inline-block !important;
  width: 1em !important;
  height: 1em !important;
  font-family: 'Material Symbols Outlined' !important;
  font-size: 14px !important;
  font-style: normal !important;
  font-weight: 500 !important;
  line-height: 1 !important;
  font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20 !important;
}

html body i.fas.queue.base::before { content: 'playlist_add' !important; }
html body i.fas.send.base::before { content: 'open_in_new' !important; }

.fg-hidden {
  display: none !important;
}

.fg-size {
  position: relative !important;
  display: inline-block !important;
  color: inherit !important;
  border-bottom: 1px dotted #82d8ff !important;
  cursor: help !important;
}

.fg-size::after {
  content: attr(data-bytes);
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: calc(100% + 7px);
  transform: translateX(-50%);
  width: min(280px, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  padding: .45rem .65rem;
  border: 1px solid #3f5a6d;
  border-radius: 7px;
  background: #243140;
  color: #e8f5fa;
  box-shadow: 0 5px 16px #0009;
  font: 500 12px/1.3 Inter, sans-serif;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .15s ease;
}

.fg-size:hover::after,
.fg-size:focus-visible::after {
  opacity: 1;
}

.fg-source,
.fg-release {
  position: relative !important;
  border-bottom: 1px dotted #82d8ff !important;
  cursor: help !important;
}

.fg-source::after,
.fg-release::after {
  content: attr(data-tooltip);
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: calc(100% + 7px);
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  padding: .45rem .65rem;
  border: 1px solid #3f5a6d;
  border-radius: 7px;
  background: #243140;
  color: #e8f5fa;
  box-shadow: 0 5px 16px #0009;
  font: 500 12px/1.3 Inter, sans-serif;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .15s ease;
}

.fg-source:hover::after,
.fg-source:focus-visible::after,
.fg-release:hover::after,
.fg-release:focus-visible::after {
  opacity: 1;
}

.fg-label {
  font-weight: 700 !important;
}

.fg-shot {
  cursor: zoom-in !important;
}

details.fg-extra {
  background: #1b2632 !important;
  border: 1px solid #3a4d5d !important;
  border-radius: 10px !important;
  margin: .55rem 0 !important;
  overflow: hidden !important;
  padding: 0 !important;
}

details.fg-extra > summary {
  background: #243140 !important;
  color: #e8f5fa !important;
  list-style: none !important;
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: left !important;
  margin: 0 !important;
  cursor: pointer !important;
  border: 0 !important;
  border-radius: 0 !important;
  padding: .55rem .85rem !important;
  font: 600 13px Inter, sans-serif !important;
  text-transform: none !important;
}

details.fg-extra[open] > summary {
  border-bottom: 1px solid #3a4d5d !important;
}

details.fg-extra > div,
details.fg-extra > ul {
  margin: 0 !important;
  padding: .35rem .85rem .65rem !important;
}

details.fg-extra > summary::-webkit-details-marker {
  display: none !important;
}

details.fg-extra > summary:hover {
  background: #2c7894 !important;
  color: #fff !important;
}

.su-spoiler {
  background: #1b2632 !important;
  border: 1px solid #3a4d5d !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  margin: .5rem 0 !important;
}

.su-spoiler-title {
  padding: .55rem .9rem .55rem 2.35rem !important;
  position: relative !important;
}

.su-spoiler-icon {
  left: .6rem !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  height: auto !important;
  line-height: 1 !important;
  color: #9fdcff !important;
}

.su-spoiler-icon::before {
  content: 'add' !important;
  font-family: 'Material Symbols Outlined' !important;
  font-size: 16px !important;
  font-style: normal !important;
  font-weight: 600 !important;
  line-height: 1 !important;
}

.su-spoiler-open .su-spoiler-icon::before,
.su-spoiler[open] .su-spoiler-icon::before {
  content: 'remove' !important;
}

.paging-navigation {
  margin: .35rem 0 .8rem !important;
  padding: .35rem 0 !important;
  border-top: 0 !important;
}

.paging-navigation .pagination {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-wrap: wrap !important;
  width: 100% !important;
  gap: .35rem !important;
}

.paging-navigation .page-numbers {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 2rem !important;
  min-height: 2rem !important;
  box-sizing: border-box !important;
  padding: .25rem .55rem !important;
  border: 1px solid #3f5a6d !important;
  border-radius: 7px !important;
  background: #243140 !important;
  color: #dceeff !important;
  text-decoration: none !important;
}

.paging-navigation .page-numbers:hover,
.paging-navigation .page-numbers.current {
  border-color: #82d8ff !important;
  background: #2c7894 !important;
  color: #fff !important;
}

.paging-navigation .page-numbers.dots {
  min-width: auto !important;
  border-color: transparent !important;
  background: transparent !important;
}

.su-spoiler-content {
  background: #1b2632 !important;
  color: #dce6ed !important;
}

.fg-modal {
  position: fixed !important;
  inset: 0 !important;
  z-index: 999999 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05080ed9;
  padding: 4vw;
}

.fg-modal img {
  max-width: 90vw !important;
  max-height: 84vh !important;
  border-radius: 14px !important;
}

.fg-modal button {
  position: fixed;
  background: #243b4a;
  color: #fff;
  border: 1px solid #628195;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 28px;
  cursor: pointer;
}

.fg-close {
  top: 3vh;
  right: 3vw;
}

.fg-prev {
  left: 3vw;
}

.fg-next {
  right: 3vw;
}
`);

  const T = e => (e?.textContent || '').replace(/\s+/g, ' ').trim();
  const K = c => [...c.children];

  // Some posts put the complete article body inside one or more formatting
  // wrappers. Parse the wrapper containing direct H3 sections while leaving
  // the original DOM structure intact.
  const contentRoot = c => {
    let root = c;

    while (![...root.children].some(e => e.tagName === 'H3')) {
      const wrappers = [...root.children].filter(
        e => e.tagName === 'DIV' && e.querySelector('h3')
      );

      if (wrappers.length !== 1) break;
      root = wrappers[0];
    }

    return root;
  };

  const HID = 'fg-hidden';

  const INTRO =
    /Updates for the following games have been added|All updates can be found on their own page|All links to updates are also posted|in the menus on the top and on the left/i;

  const EXTRA =
    /^(Having issues with my launcher\?|What is a Hypervisor Bypass\?|Why Monkey Repack\?|Game runs,\s+but\b)/i;

  const GAME_UPDATES = /^Game Updates\b/i;
  const BACKWARDS = /^Backwards Compatibility\b/i;

  const SUB =
    /^(Live Editor|The World.s Game|Squads Update)$/i;

  const MORE =
    /^(saiba mais|learn more|read more|show more|mostrar mais|ver mais|detalhes|details)$/i;

  const mk = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  };

  const ico = n => {
    const icon = mk('span', 'fg-ms', n);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  };

  const btn = (cls, icon, text) => {
    const b = mk('button', cls);

    b.type = 'button';
    b.append(ico(icon), document.createTextNode(text));

    return b;
  };

  const sum = (cls, icon, text) => {
    const s = mk('summary', cls);

    s.append(ico(icon), document.createTextNode(text));

    return s;
  };

  const isSub = e => e.tagName === 'P' &&
    !!e.querySelector('b,strong') && SUB.test(T(e.querySelector('b,strong')));
  const isExtra = e => {
    const label =
      e.tagName === 'H3'
        ? T(e)
        : e.tagName === 'P'
          ? T(e.querySelector('b,strong'))
          : '';

    return EXTRA.test(label) || GAME_UPDATES.test(label) || BACKWARDS.test(label);
  };

  const humanSize = bytes => {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }

    const digits = unit === 0 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(digits)} ${units[unit]}`;
  };

  const formatSizes = c => {
    if (c.dataset.fgSizes) return;
    c.dataset.fgSizes = '1';

    const re = /(\d[\d,]*)\s+bytes\b/gi;
    const walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;

      if (parent && !parent.closest('.fg-size,script,style')) {
        nodes.push(node);
      }
    }

    nodes.forEach(node => {
      const value = node.nodeValue;
      let match;
      let last = 0;
      let changed = false;
      const fragment = document.createDocumentFragment();

      re.lastIndex = 0;
      while ((match = re.exec(value))) {
        changed = true;
        fragment.append(value.slice(last, match.index));

        const bytes = Number(match[1].replace(/,/g, ''));
        const size = mk('span', 'fg-size', humanSize(bytes));
        size.tabIndex = 0;
        size.dataset.bytes = `${match[1]} bytes`;
        fragment.append(size);
        last = re.lastIndex;
      }

      if (changed) {
        fragment.append(value.slice(last));
        node.replaceWith(fragment);
      }
    });
  };

  const formatLabels = c => {
    if (c.dataset.fgLabels === '4') return;

    c.querySelectorAll('.fg-release').forEach(release => {
      release.replaceWith(release.textContent);
    });
    c.dataset.fgLabels = '4';

    const re = /(ISO release:|\brelease:|Game version(?::|\s+is\b))/gi;
    const walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;

      if (
        parent &&
        !parent.closest('a,code,pre,script,style,strong,b,.fg-size')
      ) {
        nodes.push(node);
      }
    }

    nodes.forEach(node => {
      const value = node.nodeValue;
      let match;
      let last = 0;
      let changed = false;
      const fragment = document.createDocumentFragment();

      re.lastIndex = 0;
      while ((match = re.exec(value))) {
        changed = true;
        let before = value.slice(last, match.index);

        const label = match[1].toLowerCase();

        if (
          (label.startsWith('iso release:') || label === 'release:') &&
          (before.trim() || node.previousSibling)
        ) {
          before = before.replace(/\s+$/, '');
          fragment.append(before, document.createElement('br'));
        } else {
          fragment.append(before);
        }

        if (label.startsWith('game version')) {
          fragment.append(mk('strong', 'fg-label', match[1]));
        } else if (label.startsWith('iso release:') || label === 'release:') {
          fragment.append(match[1]);

          const filename = value.slice(re.lastIndex).match(/^(\s+)([^\s(]+)/);
          const isIso = label.startsWith('iso release:') ||
            /\.iso(?:$|[),.;:!?])/i.test(filename?.[2] || '');

          if (filename && isIso) {
            const release = mk('span', 'fg-release', filename[2]);
            release.tabIndex = 0;
            release.dataset.tooltip = `Search ${filename[2]} on Google`;
            release.onclick = () => {
              window.open(
                `https://www.google.com/search?q=${encodeURIComponent(filename[2])}`,
                '_blank',
                'noopener,noreferrer'
              );
            };
            release.onkeydown = event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                release.click();
              }
            };
            fragment.append(filename[1], release);
            re.lastIndex += filename[0].length;
          }
        } else {
          fragment.append(match[1]);
        }

        last = re.lastIndex;
      }

      if (changed) {
        fragment.append(value.slice(last));
        node.replaceWith(fragment);
      }
    });
  };

  const nextHead = (l, f) => {
    for (let i = f + 1; i < l.length; i++) {
      if (
        l[i].tagName === 'H3' ||
        isSub(l[i]) ||
        isExtra(l[i]) ||
        l[i].matches?.('details.fg-extra, .fg-tab-panel, .fg-tabs')
      ) {
        return i;
      }
    }

    return -1;
  };

  const gallery = (imgs, start) => {
    const m = mk('div', 'fg-modal');
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', 'Image viewer');
    m.tabIndex = -1;

    let i = start;

    const pic = mk('img');

    const draw = () => {
      const href = imgs[i].closest('a[href]')?.href;
      const isImage = href && /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(href);
      pic.src = isImage ? href : imgs[i].currentSrc || imgs[i].src;
    };

    const go = s => {
      i = (s + imgs.length) % imgs.length;
      draw();
    };

    const close = mk('button', 'fg-close', '\u00d7');
    const prev = mk('button', 'fg-prev', '\u2039');
    const next = mk('button', 'fg-next', '\u203a');

    close.onclick = () => m.remove();

    prev.onclick = e => {
      e.stopPropagation();
      go(i - 1);
    };

    next.onclick = e => {
      e.stopPropagation();
      go(i + 1);
    };

    m.onclick = e => {
      if (e.target === m) {
        m.remove();
      }
    };

    m.onkeydown = e => {
      if (e.key === 'Escape') {
        m.remove();
      } else if (e.key === 'ArrowLeft') {
        go(i - 1);
      } else if (e.key === 'ArrowRight') {
        go(i + 1);
      }
    };

    m.append(pic, close, prev, next);

    document.body.append(m);
    m.focus();
    draw();
  };

  // remove envoltórios "Saiba mais" mantendo o conteúdo interior
  const unwrapMore = root =>
    root.querySelectorAll('details').forEach(d => {
      const s = d.querySelector(':scope>summary');

      if (!s || !MORE.test(T(s))) return;

      const f = document.createDocumentFragment();

      [...d.childNodes].forEach(n => {
        if (n !== s) {
          f.append(n);
        }
      });

      d.replaceWith(f);
    });

  // Digests: remove imagem e tudo o que antecede os spoilers
  const cleanDigest = c => {
    if (c.dataset.fgDigest) return;

    c.dataset.fgDigest = '1';

    c.querySelectorAll('img[src*="fg_updates"]').forEach(i => {
      const a = i.closest('a') || i;
      a.remove();
    });

    const first = c.querySelector('.su-spoiler');

    if (first) {
      const scope = first.parentElement;
      let n = scope.firstChild;
      let removed = 0;

      while (n && n !== first && removed < 40) {
        const nx = n.nextSibling;
        n.remove();
        n = nx;
        removed++;
      }
    }

    const w = document.createTreeWalker(
      c,
      NodeFilter.SHOW_TEXT
    );

    const tn = [];

    while (w.nextNode()) {
      const v = w.currentNode.nodeValue;

      if (v && INTRO.test(v)) {
        tn.push(w.currentNode);
      }
    }

    tn.forEach(n => n.remove());

    [...c.querySelectorAll('p,span,a,div')].forEach(e => {
      if (
        e.closest('.su-spoiler') ||
        e.querySelector('.su-spoiler')
      ) {
        return;
      }

      const s = T(e);

      if (s && s.length < 300 && INTRO.test(s)) {
        e.remove();
      }
    });
  };

  // título do post = nome do repack (#NNNN), mantendo o link
  const retitle = (a, c) => {
    if (c.dataset.fgTitle) return;

    const h = K(c).find(
      e =>
        e.tagName === 'H3' &&
        /^#\d+/.test(T(e))
    );

    const et = a.querySelector('.entry-title');

    if (!h || !et) return;

    c.dataset.fgTitle = '1';
    et.classList.add('fg-title-off');

    const al = et.querySelector('a[href]');

    if (al && !h.querySelector('a')) {
      const link = mk('a');

      link.href = al.href;

      while (h.firstChild) {
        link.append(h.firstChild);
      }

      h.append(link);
    }

    h.classList.add('fg-post-title');
  };

  // poster + info do repack + abas na mesma linha
  const topRow = c => {
    if (c.dataset.fgTop) return null;

    const kids = K(c);

    const p =
      kids.find(
        e =>
          e.tagName === 'P' &&
          e.querySelector('img.alignleft')
      ) ||
      kids.find(
        e =>
          e.tagName === 'P' &&
          e.querySelector('img')
      );

    if (!p) return null;

    const img = p.querySelector('img');
    const holder = img.closest('a') || img;

    c.dataset.fgTop = '1';

    const row = mk('div', 'fg-top');
    const left = mk('div', 'fg-top-poster');
    const right = mk('div', 'fg-top-info');

    left.append(holder);

    [...p.childNodes].forEach(n => {
      if (n !== holder) {
        right.append(n);
      }
    });

    row.append(left, right);
    p.replaceWith(row);

    return right;
  };

  // abas: Direct Links, Torrent e Screenshots (fechadas por defeito)
  const buildTabs = (c, host) => {
    if (c.dataset.fgTabs === '3') return;
    if (c.dataset.fgTabs) {
      c.querySelectorAll('.fg-tabs').forEach(bar => bar.remove());
      c.querySelectorAll('.fg-tab-panel').forEach(panel => panel.replaceWith(...panel.childNodes));
      c.querySelectorAll(`.${HID}`).forEach(node => node.classList.remove(HID));
    }

    const list = K(c);
    const targets = list.filter(h => h.tagName === 'H3' && (
      (/\bDownload Mirrors?\b/i.test(T(h)) &&
        !/^4K Videos Add-on Download Mirrors?/i.test(T(h))) ||
      /^Screenshots\b/i.test(T(h))
    ));

    if (!targets.length) return;
    c.dataset.fgTabs = '3';
    const groups = targets.map(h => {
      const s = list.indexOf(h);
      const e = list.findIndex((node, i) => i > s && node.tagName === 'H3');
      return { h, ns: list.slice(s, e < 0 ? list.length : e) };
    });

    const rank = g => /Screenshots/i.test(T(g.h)) ? 2 : /Direct/i.test(T(g.h)) ? 0 : 1;
    groups.sort((x, y) => rank(x) - rank(y));
    groups.forEach(g => {
      const label = T(g.h);
      const type = /Screenshots/i.test(label) ? 'screenshots' : /Direct/i.test(label) ? 'direct' : 'torrent';
      g.panel = mk('div', `fg-tab-panel fg-tab-panel-${type}`);
      g.ns[0].before(g.panel);
      g.ns.forEach(n => g.panel.append(n));
    });

    const bar = mk('div', 'fg-tabs');
    bar.setAttribute('role', 'tablist');

    const show = i => groups.forEach((g, j) => {
      const on = j === i;
      g.panel.classList.toggle(HID, !on);
      g.btn.classList.toggle('active', on);
      g.btn.setAttribute('aria-selected', String(on));
    });

    groups.forEach((g, i) => {
      const s = T(g.h);
      const shots = /Screenshots/i.test(s);
      const dir = /Direct/i.test(s);

      g.btn = btn('fg-tab', shots ? 'photo_library' : dir ? 'link' : 'download',
        shots ? 'Screenshots' : dir ? 'Direct Links' : 'Torrent');
      g.btn.classList.add(shots ? 'fg-tab-screenshots' : dir ? 'fg-tab-direct' : 'fg-tab-torrent');
      g.btn.setAttribute('role', 'tab');
      g.btn.onclick = () => show(g.btn.classList.contains('active') ? -1 : i);
      bar.append(g.btn);
    });

    show(-1);
    if (host) {
      host.append(bar);
    } else {
      groups[0].panel.before(bar);
    }

    const shot = groups.find(g => /Screenshots/i.test(T(g.h)));
    if (!shot) return;

    const imgs = shot.ns.flatMap(n => [...n.querySelectorAll('img')])
      .filter(im => !im.closest('.wplp_widget_13066'));
    imgs.forEach((im, i) => {
      if (im.dataset.fgShot) return;
      im.dataset.fgShot = '1';
      im.classList.add('fg-shot');
      const link = im.closest('a[href]');
      im.onclick = e => {
        if (link && (e.ctrlKey || e.metaKey || e.shiftKey)) return;
        e.preventDefault();
        gallery(imgs, i);
      };
    });
  };

  const wrapAddon = c => {
    if (c.dataset.fgAddon) return;

    const list = K(c);
    const h = list.find(e => /^4K Videos Add-on$/i.test(T(e)));

    if (!h) return;

    const start = list.indexOf(h);
    let end = list.length;

    for (let i = start + 1; i < list.length; i++) {
      if (
        list[i].tagName === 'H3' &&
        !/^4K Videos Add-on Download Mirrors?/i.test(T(list[i]))
      ) {
        end = i;
        break;
      }
    }

    c.dataset.fgAddon = '1';

    const details = mk('details', 'fg-extra');
    const box = mk('div', 'fg-addon-content');
    const nodes = list.slice(start + 1, end);

    details.append(sum('fg-toggle', 'movie', '4K Videos Add-on'), box);
    c.insertBefore(details, h);
    h.remove();
    nodes.forEach(node => box.append(node));

    buildTabs(box, null);
  };

  // Repack Features: dois itens visíveis, restante num recolhível
  const buildFeatures = c => {
    if (c.dataset.fgFeatures) return;
    const h = K(c).find(e => e.tagName === 'H3' && /^Repack Features/i.test(T(e)));
    if (!h) return;
    const ul = h.nextElementSibling;
    if (!ul || ul.tagName !== 'UL') return;
    c.dataset.fgFeatures = '1';
    const rest = [...ul.children].slice(2);
    if (!rest.length) return;
    const d = mk('details', 'fg-extra');
    const box = mk('ul', 'fg-features-more');
    rest.forEach(li => box.append(li));
    d.append(sum('fg-toggle', 'unfold_more', `More (${rest.length})`), box);
    ul.after(d);
  };

  // Blocos extra (hypervisor, launcher, etc.) em recolhíveis
  const buildExtras = c => {
    if (c.dataset.fgExtras === '3') return;
    c.dataset.fgExtras = '3';

    const wrap = container => {
      [...container.children].forEach(node => {
        if (node.parentElement !== container || node.dataset.fgExtra || !(isExtra(node) || isSub(node))) return;

        const list = [...container.children];
        const start = list.indexOf(node);
        const next = nextHead(list, start);
        const end = next < 0 ? list.length : next;
        const sub = isSub(node);
        const backwards = BACKWARDS.test(T(node));
        const d = mk('details', backwards ? 'fg-extra fg-backwards' : 'fg-extra');
        const box = mk('div');
        const label = sub ? T(node.querySelector('b,strong')) : T(node);
        const summary = sum('fg-toggle', sub ? 'segment' : 'help', label);
        d.append(summary, box);
        node.dataset.fgExtra = '1';
        container.insertBefore(d, node);
        list.slice(sub ? start : start + 1, end).forEach(n => box.append(n));
        if (!sub) node.remove();
        wrap(box);
        if (backwards && box.querySelector('details.fg-extra')) {
          summary.lastChild.nodeValue = 'Backwards Compatibility and other stuff';
        }
      });
    };
    wrap(c);
  };

  // Botão para copiar todos os links de cada filehoster
  const addCopy = c => {
    c
      .querySelectorAll('ul>li')
      .forEach(li => {
        if (li.dataset.fgCopy) return;

        if (
          !/^Filehoster:/i.test(
            T(li)
          )
        ) {
          return;
        }

        const spoiler = li.querySelector(
          ':scope > .su-spoiler, :scope > details'
        );
        const content = spoiler?.querySelector(
          '.su-spoiler-content, [data-fg-links]'
        ) || spoiler;
        const links = [
          ...(content?.querySelectorAll('a[href]') || [])
        ];

        const urls = [
          ...new Set(
            links
              .map(a => a.href)
              .filter(h =>
                /^https?:/i.test(h)
              )
          )
        ];

        if (!urls.length) {
          return;
        }

        li.dataset.fgCopy = '1';

        const info = mk('span', 'fg-hoster-info');
        [...li.childNodes].forEach(node => {
          if (node !== spoiler) info.append(node);
        });
        li.prepend(info);

        const b = btn('fg-copy', 'content_copy', `Copiar links (${urls.length})`);
        spoiler?.before(b);
        if (!spoiler) li.append(b);
        let resetTimer;

        b.onclick = async ev => {
          ev.preventDefault();

          const label =
            b.lastChild;

          try {
            const text = urls.join('\n');

            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
              await navigator.clipboard.writeText(text);
            } catch {
              GM_setClipboard(text);
            }

            b.classList.add('ok');

            label.nodeValue =
              'Copiado \u2713';
          } catch (err) {
            label.nodeValue =
              'Não foi possível copiar';
          }

          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            b.classList.remove('ok');

            label.nodeValue = `Copiar links (${urls.length})`;
          }, 1600);
        };

        li.prepend(b);
      });
  };

  const compactUpcoming = c => {
    const h = [...c.querySelectorAll('h3')].find(
      e => e.tagName === 'H3' && /^⇢\s*\S/.test(T(e))
    );

    if (!h || h.dataset.fgCompact) return;

    h.dataset.fgCompact = '1';
    h.classList.add('fg-upcoming-games');

    const trim = side => {
      let node = side === 'start' ? h.firstChild : h.lastChild;

      while (node) {
        const next = side === 'start' ? node.nextSibling : node.previousSibling;
        const removable =
          node.nodeType === Node.COMMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim()) ||
          node.nodeName === 'BR';

        if (!removable) break;
        node.remove();
        node = next;
      }
    };

    trim('start');
    trim('end');
  };

  const processArticle = a => {
    if (a.dataset.fgUi === '2') return;

    const c =
      a.querySelector(
        '.entry-content'
      );

    if (!c) return;

    const content = contentRoot(c);

    if (/^Upcoming Repacks$/i.test(T(a.querySelector('.entry-title')))) {
      a.classList.add('fg-upcoming-repacks');
      compactUpcoming(c);
    }

    if (
      /Updates Digest/i.test(
        T(
          a.querySelector(
            '.entry-title'
          )
        )
      )
    ) {
      cleanDigest(c);
    }

    formatSizes(c);
    formatSources(c);
    formatLabels(c);

    const game = !!K(content).find(
      e =>
        e.tagName === 'H3' &&
        /^Repack Features/i.test(
          T(e)
        )
    );

    if (game) {
      retitle(a, content);
    }

    buildTabs(
      content,
      game
        ? topRow(content)
        : null
    );

    wrapAddon(content);

    buildFeatures(content);
    buildExtras(content);
    addCopy(content);
    a.dataset.fgUi = '2';
  };

  const markWidgets = () =>
    document
      .querySelectorAll('.widget')
      .forEach(w => {
        if (
          /^Support the Cause$/i.test(
            T(
              w.querySelector(
                '.widget-title'
              )
            )
          )
        ) {
          w.classList.add(
            'fg-support-cause'
          );
        }
      });

  const collapsePopular = () =>
    document.querySelectorAll('#content-sidebar .widget').forEach(widget => {
      if (widget.dataset.fgPopular) return;
      const title = widget.querySelector('.widgettitle, .widget-title');
      if (!title || !/^Most Popular Repacks/i.test(T(title))) return;

      const details = mk('details', 'fg-popular-repacks');
      const body = mk('div', 'fg-popular-body');
      const summary = sum('fg-toggle', 'star', 'Most popular repacks');
      title.remove();
      [...widget.childNodes].forEach(node => body.append(node));
      details.append(summary, body);
      details.open = window.innerWidth > 900;
      widget.append(details);
      widget.dataset.fgPopular = '1';
    });

  const collapseSidebar = () => {
    const sidebar = document.querySelector('#content-sidebar, .content-sidebar');
    if (!sidebar || sidebar.dataset.fgSidebar) return;

    const details = mk('details', 'fg-sidebar');
    const body = mk('div', 'fg-sidebar-body');
    const summary = sum('fg-toggle', 'widgets', 'Sidebar / popular repacks');
    [...sidebar.childNodes].forEach(node => body.append(node));
    details.append(summary, body);
    details.open = window.innerWidth > 900;
    sidebar.append(details);
    sidebar.dataset.fgSidebar = '1';
  };

  const movePagination = () => {
    const header = document.querySelector('#masthead.site-header');
    const pagination = document.querySelector(
      '.paging-navigation:not([data-fg-pagination-clone])'
    );
    if (!header || !pagination || pagination.dataset.fgMoved) return;

    const parent = pagination.parentNode;
    const next = pagination.nextSibling;
    const clone = pagination.cloneNode(true);

    clone.dataset.fgPaginationClone = '1';
    header.after(pagination);
    parent?.insertBefore(clone, next);
    pagination.dataset.fgMoved = '1';
  };

  const expandPagination = () => {
    document.querySelectorAll('.paging-navigation').forEach(pagination => {
      const currentNode = pagination.querySelector('.page-numbers.current');
      const lastLink = [...pagination.querySelectorAll('a.page-numbers:not(.next):not(.prev)')]
        .sort((a, b) => Number(b.textContent) - Number(a.textContent))[0];
      if (!currentNode || !lastLink || pagination.dataset.fgExpanded) return;

      const current = Number(T(currentNode));
      const last = Number(T(lastLink));
      if (!Number.isInteger(current) || !Number.isInteger(last) || last < 2) return;

      const pages = last <= 10
        ? Array.from({ length: last }, (_, i) => i + 1)
        : current <= 4
          ? [...Array.from({ length: 10 }, (_, i) => i + 1), last]
          : current >= last - 3
            ? [1, ...Array.from({ length: 10 }, (_, i) => last - 9 + i)]
            : [1, current - 2, current - 1, current, current + 1, current + 2, last];
      const unique = [...new Set(pages.filter(n => n > 0 && n <= last))];
      const next = pagination.querySelector('.next.page-numbers');
      if (!next) return;

      pagination.querySelectorAll('.page-numbers:not(.next):not(.prev)').forEach(node => node.remove());

      const href = page => {
        const url = new URL(lastLink.href);
        url.pathname = url.pathname.replace(/page\/\d+\/?$/, page === 1 ? '' : `page/${page}/`);
        return url.href;
      };
      unique.forEach((page, i) => {
        if (i && page > unique[i - 1] + 1) {
          const dots = mk('span', 'page-numbers dots');
          dots.textContent = '…';
          next.before(dots);
        }
        const node = page === current ? mk('span', 'page-numbers current') : mk('a', 'page-numbers');
        node.textContent = String(page);
        if (node.tagName === 'A') node.href = href(page);
        node.setAttribute(page === current ? 'aria-current' : 'data-page', page === current ? 'page' : String(page));
        next.before(node);
      });
      pagination.dataset.fgExpanded = '1';
    });
  };

  const syncPagination = () => {
    const paginations = [...document.querySelectorAll('.paging-navigation')];
    const source = paginations.find(p => !p.dataset.fgPaginationClone);
    const sourceBody = source?.querySelector('.pagination');
    if (!sourceBody) return;

    paginations
      .filter(p => p !== source)
      .forEach(target => {
        const targetBody = target.querySelector('.pagination');
        if (!targetBody || targetBody.innerHTML === sourceBody.innerHTML) return;
        targetBody.replaceChildren(...sourceBody.cloneNode(true).childNodes);
        target.dataset.fgExpanded = source.dataset.fgExpanded || '';
      });
  };

  const moveSupplementary = () => {
    const sidebar = document.querySelector('#content-sidebar');
    const supplementary = document.querySelector('#supplementary');

    if (!sidebar || !supplementary || sidebar.contains(supplementary)) {
      return;
    }

    sidebar.append(supplementary);

    const footerSidebar = supplementary.querySelector('#footer-sidebar');
    footerSidebar?.style.removeProperty('position');
    footerSidebar?.style.removeProperty('height');

    footerSidebar?.querySelectorAll(':scope > aside').forEach(aside => {
      aside.style.removeProperty('position');
      aside.style.removeProperty('left');
      aside.style.removeProperty('top');
    });

    supplementary.querySelectorAll('.footer-grid').forEach(grid => {
      grid.style.removeProperty('width');
    });
  };

  const formatSources = c => {
    if (c.dataset.fgSources) return;
    c.dataset.fgSources = '1';

    const re = /(\bBased on\s+)([\w\s.-]*?)([A-Za-z0-9][A-Za-z0-9._-]*-[A-Za-z0-9]+)(?=\s+(?:ISO\s+)?release:)/i;
    const walker = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;

      if (parent && !parent.closest('a,code,pre,script,style,.fg-source')) {
        nodes.push(node);
      }
    }

    nodes.forEach(node => {
      const value = node.nodeValue;
      const match = re.exec(value);

      if (!match) return;

      const source = mk('span', 'fg-source', match[3]);
      source.tabIndex = 0;
      source.dataset.tooltip = `Release source: ${match[3]}`;
      source.onclick = () => {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(match[3])}`,
          '_blank',
          'noopener,noreferrer'
        );
      };
      source.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          source.click();
        }
      };

      const fragment = document.createDocumentFragment();
      fragment.append(value.slice(0, match.index), match[1], match[2], source, value.slice(match.index + match[0].length));
      node.replaceWith(fragment);
    });
  };

  const removeDuplicateCommentIcons = () => {
    document
      .querySelectorAll('i.fa.fa-comment')
      .forEach(icon => icon.remove());
  };

  const stabilizeLatestRepacks = () => {
    document.querySelectorAll('.wplp_widget_13066').forEach(widget => {
      widget
        .querySelectorAll('.swiper-container, .swiper, .wplp_listposts')
        .forEach(container => {
          const swiper = container.swiper;

          if (swiper && !swiper.destroyed) {
            swiper.destroy(false, true);
          }
        });

      widget
        .querySelectorAll('.swiper-lazy-preloader')
        .forEach(preloader => preloader.remove());

      widget
        .querySelectorAll('img[data-src], img[data-lazy-src], img[data-original]')
        .forEach(img => {
          const src =
            img.dataset.src ||
            img.dataset.lazySrc ||
            img.dataset.original;

          if (!src) return;

          if (img.getAttribute('src') !== src) {
            img.src = src;
          }

          img.classList.remove('swiper-lazy', 'swiper-lazy-loading');
          img.classList.add('swiper-lazy-loaded');
        });
    });
  };

  // Swiper is intentionally disabled above so the strip can be scrolled
  // naturally. Some mobile browsers still do not drag a scrollable element
  // when its children are links, so provide a small pointer-based fallback.
  const enableLatestRepacksTouch = () => {
    document
      .querySelectorAll('.wplp_widget_13066 .wplp_listposts')
      .forEach(list => {
        if (list.dataset.fgTouchReady === '1') return;
        list.dataset.fgTouchReady = '1';

        let active = false;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startScrollLeft = 0;
        let suppressClickUntil = 0;

        list.addEventListener('pointerdown', event => {
          if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
            return;
          }

          active = true;
          dragging = false;
          startX = event.clientX;
          startY = event.clientY;
          startScrollLeft = list.scrollLeft;
        }, { passive: true });

        list.addEventListener('pointermove', event => {
          if (!active) return;

          const deltaX = event.clientX - startX;
          const deltaY = event.clientY - startY;

          if (!dragging) {
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
              active = false;
              return;
            }

            if (Math.abs(deltaX) < 8) return;

            dragging = true;
            list.classList.add('fg-dragging');
            list.setPointerCapture?.(event.pointerId);
          }

          event.preventDefault();
          list.scrollLeft = startScrollLeft - deltaX;
        }, { passive: false });

        const finishDrag = () => {
          if (dragging) suppressClickUntil = Date.now() + 350;
          active = false;
          dragging = false;
          list.classList.remove('fg-dragging');
        };

        list.addEventListener('pointerup', finishDrag, { passive: true });
        list.addEventListener('pointercancel', finishDrag, { passive: true });
        list.addEventListener('lostpointercapture', finishDrag, { passive: true });
        list.addEventListener('click', event => {
          if (suppressClickUntil > Date.now()) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickUntil = 0;
          }
        }, true);
      });
  };

  const alignHeader = () => {
    const header = document.querySelector('#masthead.site-header');
    const site = document.querySelector('.site');
    if (!header || !site) return;

    header.style.removeProperty('--fg-content-width');
    header.style.removeProperty('--fg-content-offset');
    const from = header.getBoundingClientRect();
    const to = site.getBoundingClientRect();
    if (to.width < 1) return;

    header.style.setProperty('--fg-content-width', `${Math.round(to.width)}px`);
    header.style.setProperty('--fg-content-offset', `${Math.round(to.left - from.left)}px`);
  };

  let headerResizeQueued = false;
  let sidebarDesktop = window.innerWidth > 900;
  window.addEventListener('resize', () => {
    if (headerResizeQueued) return;
    headerResizeQueued = true;
    requestAnimationFrame(() => {
      headerResizeQueued = false;
      alignHeader();
      const isDesktop = window.innerWidth > 900;
      if (isDesktop !== sidebarDesktop) {
        document.querySelectorAll('details.fg-sidebar, details.fg-popular-repacks').forEach(sidebar => {
          sidebar.open = isDesktop;
        });
        sidebarDesktop = isDesktop;
      }
    });
  });

  let queued = false;

  const observer =
    new MutationObserver(
      muts => {
        const added =
          muts.some(m =>
            [...m.addedNodes].some(
              n =>
                n.nodeType === 1 &&
                (
                  n.tagName ===
                    'ARTICLE' ||
                  n.id === 'supplementary' ||
                  n.id === 'content-sidebar' ||
                  n.matches?.('i.fa.fa-comment') ||
                  n.matches?.('.wplp_widget_13066, .swiper-lazy-preloader') ||
                  n.querySelector?.(
                    'article, #supplementary, #content-sidebar, i.fa.fa-comment, .wplp_widget_13066, .swiper-lazy-preloader'
                  )
                )
            )
          );

        if (!added || queued) {
          return;
        }

        queued = true;

        setTimeout(() => {
          queued = false;
          run();
        }, 250);
      }
    );

  const run = () => {
    try {
      observer.disconnect();

      unwrapMore(document);
      markWidgets();
      collapsePopular();
      moveSupplementary();
      collapseSidebar();
      movePagination();
      expandPagination();
      syncPagination();
      alignHeader();
      removeDuplicateCommentIcons();
      stabilizeLatestRepacks();
      enableLatestRepacksTouch();

      document.querySelectorAll('article').forEach(article => {
        try {
          processArticle(article);
        } catch (error) {
          console.error('[FitGirl UI] article processing failed', error);
        }
      });
    } finally {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
  };

  const start = () => {
    if (document.body) run();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
