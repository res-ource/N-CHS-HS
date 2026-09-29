'use strict';
const byId = id => document.getElementById(id);
let books = [], activeBook = null, pageIndex = 0, requestNumber = 0;
const library = byId('library'), reader = byId('reader'), image = byId('book-page');
function displayLibrary() {
  requestNumber++;
  activeBook = null;
  reader.hidden = true;
  library.hidden = false;
  document.title = 'Oakland El Book Library';
  byId('library-title').tabIndex = -1;
  byId('library-title').focus();
}
function displayPage() {
  const page = activeBook.pages[pageIndex];
  const currentRequest = ++requestNumber;
  byId('page-count').textContent = `Page ${pageIndex + 1} of ${activeBook.pages.length}`;
  byId('previous-button').disabled = pageIndex === 0;
  byId('next-button').disabled = pageIndex === activeBook.pages.length - 1;
  byId('end-actions').hidden = pageIndex !== activeBook.pages.length - 1;
  byId('page-stage').setAttribute('aria-busy', 'true');
  byId('page-status').hidden = false;
  byId('page-status').textContent = 'Loading page...';
  const incoming = new Image();
  incoming.onload = () => {
    if (currentRequest !== requestNumber) return;
    image.src = incoming.src;
    image.alt = `${activeBook.title}, page ${pageIndex + 1}. ${page.alt}`;
    image.width = incoming.naturalWidth;
    image.height = incoming.naturalHeight;
    byId('page-stage').setAttribute('aria-busy', 'false');
    byId('page-status').hidden = true;
    const next = activeBook.pages[pageIndex + 1];
    if (next) { const preload = new Image(); preload.src = next.src; }
  };
  incoming.onerror = () => {
    if (currentRequest !== requestNumber) return;
    image.removeAttribute('src');
    image.alt = '';
    byId('page-stage').setAttribute('aria-busy', 'false');
    byId('page-status').textContent = 'This page could not load. Check the connection, then open the book again.';
  };
  incoming.src = page.src;
}
function openBook(book) {
  activeBook = book; pageIndex = 0;
  library.hidden = true; reader.hidden = false;
  byId('book-title').textContent = book.title;
  document.title = `${book.title} | Oakland El Book Library`;
  displayPage();
  byId('book-title').tabIndex = -1;
  byId('book-title').focus();
}
function movePage(offset) {
  if (!activeBook) return;
  const target = pageIndex + offset;
  if (target < 0 || target >= activeBook.pages.length) return;
  pageIndex = target; displayPage();
}
byId('previous-button').addEventListener('click', () => movePage(-1));
byId('next-button').addEventListener('click', () => movePage(1));
byId('again-button').addEventListener('click', () => { pageIndex = 0; displayPage(); byId('next-button').focus(); });
byId('library-button').addEventListener('click', displayLibrary);
byId('done-button').addEventListener('click', displayLibrary);
document.addEventListener('keydown', event => {
  if (!activeBook || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); movePage(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); movePage(-1); }
  if (event.key === 'Escape') displayLibrary();
});
const fullscreen = byId('fullscreen-button');
if (!document.documentElement.requestFullscreen) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (_) { fullscreen.hidden = true; }
});
document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
async function start() {
  try {
    const response = await fetch('books.json', {cache:'no-cache'});
    if (!response.ok) throw new Error('Library manifest unavailable');
    books = (await response.json()).books;
    for (const book of books) {
      const button = document.createElement('button');
      button.className = 'book-card';
      button.setAttribute('aria-label', `Read ${book.title}`);
      const cover = document.createElement('img');
      cover.src = book.cover; cover.alt = ''; cover.width = 1165; cover.height = 1800;
      const title = document.createElement('span'); title.textContent = book.title;
      button.append(cover, title);
      button.addEventListener('click', () => openBook(book));
      byId('shelf').append(button);
    }
    byId('shelf').setAttribute('aria-busy', 'false');
    byId('library-status').textContent = '';
  } catch (_) {
    byId('shelf').setAttribute('aria-busy', 'false');
    byId('library-status').textContent = 'The books could not load. Check the connection and refresh.';
  }
}
start();
