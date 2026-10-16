'use strict';

// DummyJSON tidak menyertakan properti currency; untuk tampilan digunakan asumsi angka price adalah USD.
// Nilai Rupiah bersifat ilustratif dengan kurs jual BI 16 Oktober 2026, bukan harga lokal resmi.
const API_URL = 'https://dummyjson.com/products?limit=0';
const USD_TO_IDR_RATE = 18037.74;
const STORAGE_KEYS = {
  theme: 'store_fidia_theme',
  favorites: 'store_fidia_favorites',
  notes: 'store_fidia_notes',
  lastSuccess: 'store_fidia_last_success'
};

const CATEGORY_GROUPS = [
  { key: 'beauty-care', label: 'Kosmetik & Perawatan', categories: ['beauty', 'fragrances', 'skin-care'] },
  { key: 'groceries', label: 'Barang Pokok & Makanan', categories: ['groceries'] },
  { key: 'electronics', label: 'Elektronik', categories: ['laptops', 'mobile-accessories', 'smartphones', 'tablets'] },
  { key: 'fashion', label: 'Pakaian & Aksesori', categories: ['mens-shirts', 'mens-shoes', 'mens-watches', 'tops', 'womens-bags', 'womens-dresses', 'womens-jewellery', 'womens-shoes', 'womens-watches', 'sunglasses'] },
  { key: 'home', label: 'Rumah & Perabot', categories: ['furniture', 'home-decoration', 'kitchen-accessories'] },
  { key: 'automotive', label: 'Otomotif', categories: ['motorcycle', 'vehicle'] },
  { key: 'sports', label: 'Olahraga & Outdoor', categories: ['sports-accessories'] }
];

const CATEGORY_LABELS = {
  beauty: 'Kosmetik',
  fragrances: 'Parfum',
  'skin-care': 'Perawatan kulit',
  groceries: 'Barang pokok',
  furniture: 'Furnitur',
  'home-decoration': 'Dekorasi rumah',
  'kitchen-accessories': 'Peralatan dapur',
  laptops: 'Laptop',
  'mobile-accessories': 'Aksesori ponsel',
  smartphones: 'Smartphone',
  tablets: 'Tablet',
  'mens-shirts': 'Kemeja pria',
  'mens-shoes': 'Sepatu pria',
  'mens-watches': 'Jam tangan pria',
  tops: 'Atasan',
  'womens-bags': 'Tas wanita',
  'womens-dresses': 'Gaun wanita',
  'womens-jewellery': 'Perhiasan wanita',
  'womens-shoes': 'Sepatu wanita',
  'womens-watches': 'Jam tangan wanita',
  sunglasses: 'Kacamata hitam',
  motorcycle: 'Sepeda motor',
  vehicle: 'Kendaraan',
  'sports-accessories': 'Aksesori olahraga'
};

const state = {
  products: [],
  favorites: new Set(),
  notes: [],
  view: 'all',
  category: 'all',
  search: '',
  sort: 'recommended',
  loading: false
};

const elements = {
  themeToggle: document.querySelector('#theme-toggle'),
  statProducts: document.querySelector('#stat-products'),
  statAverage: document.querySelector('#stat-average'),
  statHighest: document.querySelector('#stat-highest'),
  statHighestTitle: document.querySelector('#stat-highest-title'),
  statCategories: document.querySelector('#stat-categories'),
  searchInput: document.querySelector('#search-input'),
  sortDropdown: document.querySelector('#sort-dropdown'),
  sortTrigger: document.querySelector('#sort-trigger'),
  sortCurrent: document.querySelector('#sort-current'),
  sortMenu: document.querySelector('#sort-menu'),
  categoryFilters: document.querySelector('#category-filters'),
  filterTabs: [...document.querySelectorAll('.filter-tab')],
  catalogCount: document.querySelector('#catalog-count'),
  allCount: document.querySelector('#all-count'),
  favoritesCount: document.querySelector('#favorites-count'),
  productGrid: document.querySelector('#product-grid'),
  loadingState: document.querySelector('#loading-state'),
  errorState: document.querySelector('#error-state'),
  errorMessage: document.querySelector('#error-message'),
  retryButton: document.querySelector('#retry-button'),
  emptyState: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyDescription: document.querySelector('#empty-description'),
  resetFilters: document.querySelector('#reset-filters'),
  resultSummary: document.querySelector('#result-summary'),
  lastUpdated: document.querySelector('#last-updated'),
  noteForm: document.querySelector('#note-form'),
  noteProduct: document.querySelector('#note-product'),
  noteProductDropdown: document.querySelector('#note-product-dropdown'),
  noteProductTrigger: document.querySelector('#note-product-trigger'),
  noteProductCurrent: document.querySelector('#note-product-current'),
  noteProductMenu: document.querySelector('#note-product-menu'),
  noteProductSearch: document.querySelector('#note-product-search'),
  noteProductOptions: document.querySelector('#note-product-options'),
  noteText: document.querySelector('#note-text'),
  characterCount: document.querySelector('#character-count'),
  noteError: document.querySelector('#note-error'),
  noteSuccess: document.querySelector('#note-success'),
  notesList: document.querySelector('#notes-list'),
  notesCount: document.querySelector('#notes-count')
};

function readStorage(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue === null ? fallbackValue : JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Tidak dapat membaca localStorage untuk ${key}.`, error);
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Tidak dapat menyimpan localStorage untuk ${key}.`, error);
    return false;
  }
}

function formatRupiahFromApi(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Harga tidak tersedia';
  const rupiahEstimate = Math.round(amount * USD_TO_IDR_RATE);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(rupiahEstimate);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(date);
}

function setTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalizedTheme;
  const darkModeIsActive = normalizedTheme === 'dark';
  elements.themeToggle.setAttribute('aria-label', darkModeIsActive ? 'Aktifkan light mode' : 'Aktifkan dark mode');
  elements.themeToggle.setAttribute('aria-pressed', String(darkModeIsActive));
  elements.themeToggle.title = darkModeIsActive ? 'Ganti ke light mode' : 'Ganti ke dark mode';
  writeStorage(STORAGE_KEYS.theme, normalizedTheme);
}

function initializeTheme() {
  const savedTheme = readStorage(STORAGE_KEYS.theme, 'light');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
}

function initializeLocalData() {
  const savedFavorites = readStorage(STORAGE_KEYS.favorites, []);
  if (Array.isArray(savedFavorites)) {
    state.favorites = new Set(savedFavorites.filter((id) => Number.isInteger(id) && id > 0));
  }

  const savedNotes = readStorage(STORAGE_KEYS.notes, []);
  state.notes = Array.isArray(savedNotes)
    ? savedNotes.filter((note) => note && typeof note.id === 'string' && typeof note.text === 'string')
    : [];

  const lastSuccess = readStorage(STORAGE_KEYS.lastSuccess, null);
  if (typeof lastSuccess === 'string' && !Number.isNaN(new Date(lastSuccess).getTime())) {
    elements.lastUpdated.textContent = formatDateTime(lastSuccess);
  }
  renderNotes();
  updateFavoriteCounts();
}

async function loadProducts() {
  if (state.loading) return;
  state.loading = true;
  elements.loadingState.hidden = false;
  elements.errorState.hidden = true;
  elements.emptyState.hidden = true;
  elements.productGrid.setAttribute('aria-busy', 'true');
  elements.retryButton.disabled = true;
  elements.retryButton.textContent = 'Memuat ulang...';
  if (state.products.length === 0) elements.productGrid.replaceChildren();

  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Server mengembalikan HTTP ${response.status}.`);

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) {
      throw new Error('Respons API tidak memiliki daftar produk yang valid.');
    }

    const validProducts = payload.products.filter((product) => product && Number.isInteger(product.id));
    if (validProducts.length === 0) {
      throw new Error('API berhasil dihubungi, tetapi tidak ada produk valid yang diterima.');
    }

    state.products = validProducts;
    const successfulLoadTime = new Date().toISOString();
    writeStorage(STORAGE_KEYS.lastSuccess, successfulLoadTime);
    elements.lastUpdated.textContent = formatDateTime(successfulLoadTime);
    updateStatistics();
    renderCategoryFilters();
    populateProductSelect();
    elements.errorState.hidden = true;
    renderProducts();
    elements.resultSummary.textContent = `Berhasil memuat ${state.products.length} produk dari API DummyJSON.`;
  } catch (error) {
    console.error('Gagal memuat produk:', error);
    elements.errorMessage.textContent = describeFetchError(error);
    elements.errorState.hidden = false;
    if (state.products.length === 0) {
      elements.productGrid.replaceChildren();
      elements.statProducts.textContent = '—';
      elements.statAverage.textContent = '—';
      elements.statHighest.textContent = '—';
      elements.statHighestTitle.textContent = 'Menunggu data API';
      elements.statCategories.textContent = '—';
      elements.catalogCount.textContent = '0';
      elements.allCount.textContent = '0';
      elements.resultSummary.textContent = 'Belum ada data produk yang berhasil dimuat.';
      populateProductSelect();
      renderCategoryFilters();
    } else {
      elements.resultSummary.textContent = 'Pembaruan gagal; data sebelumnya masih ditampilkan.';
    }
    renderProducts();
  } finally {
    state.loading = false;
    elements.loadingState.hidden = true;
    elements.productGrid.setAttribute('aria-busy', 'false');
    elements.retryButton.disabled = false;
    elements.retryButton.innerHTML = 'Coba lagi <span aria-hidden="true">↻</span>';
    if (state.products.length > 0) renderProducts();
  }
}

function describeFetchError(error) {
  if (error instanceof TypeError) {
    return 'Permintaan ke API gagal. Periksa internet, lalu coba lagi. Jalankan project melalui Laragon agar berjalan dari server lokal.';
  }
  return error && error.message ? error.message : 'Terjadi kesalahan yang belum dikenali. Coba lagi.';
}

function updateStatistics() {
  const products = state.products;
  const validPrices = products.map((product) => Number(product.price)).filter(Number.isFinite);
  const averagePrice = validPrices.length
    ? validPrices.reduce((total, price) => total + price, 0) / validPrices.length
    : null;
  const mostExpensive = products.reduce((highest, product) => {
    if (!Number.isFinite(Number(product.price))) return highest;
    if (!highest || Number(product.price) > Number(highest.price)) return product;
    return highest;
  }, null);
  const categories = new Set(products.map((product) => product.category).filter((category) => typeof category === 'string' && category.trim()));

  elements.statProducts.textContent = String(products.length);
  elements.statAverage.textContent = averagePrice === null ? '—' : formatRupiahFromApi(averagePrice);
  elements.statHighest.textContent = mostExpensive ? formatRupiahFromApi(mostExpensive.price) : '—';
  elements.statHighestTitle.textContent = mostExpensive ? mostExpensive.title : 'Harga tidak tersedia';
  elements.statCategories.textContent = String(categories.size);
  elements.catalogCount.textContent = String(products.length);
  elements.allCount.textContent = String(products.length);
  updateFavoriteCounts();
}

function getCategoryGroupKey(category) {
  const normalized = String(category || '').toLowerCase();
  const matchedGroup = CATEGORY_GROUPS.find((group) => group.categories.includes(normalized));
  return matchedGroup ? matchedGroup.key : 'other';
}

function getCategoryGroupLabel(key) {
  const group = CATEGORY_GROUPS.find((item) => item.key === key);
  return group ? group.label : 'Lainnya';
}

function getCategoryDisplayName(category) {
  const normalized = String(category || '').toLowerCase();
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  return normalized ? normalized.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'Tanpa kategori';
}

function renderCategoryFilters() {
  const groupsInData = new Set(state.products.map((product) => getCategoryGroupKey(product.category)));
  const counts = new Map();
  state.products.forEach((product) => {
    const key = getCategoryGroupKey(product.category);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const fragment = document.createDocumentFragment();
  const allButton = createCategoryButton('all', 'Semua kategori', state.products.length);
  fragment.append(allButton);

  CATEGORY_GROUPS.forEach((group) => {
    if (!groupsInData.has(group.key)) return;
    fragment.append(createCategoryButton(group.key, group.label, counts.get(group.key) || 0));
  });

  if (groupsInData.has('other')) fragment.append(createCategoryButton('other', 'Lainnya', counts.get('other') || 0));
  elements.categoryFilters.replaceChildren(fragment);
}

function createCategoryButton(key, label, count) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `category-chip${state.category === key ? ' active' : ''}`;
  button.dataset.category = key;
  button.setAttribute('aria-pressed', String(state.category === key));
  button.append(document.createTextNode(label));
  const countBadge = document.createElement('span');
  countBadge.textContent = String(count);
  countBadge.setAttribute('aria-label', `${count} produk`);
  button.append(countBadge);
  return button;
}

function updateCategoryFilterState() {
  elements.categoryFilters.querySelectorAll('[data-category]').forEach((button) => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function populateProductSelect() {
  const selectedId = Number(elements.noteProduct.value);
  const selectedProduct = state.products.find((product) => product.id === selectedId);
  elements.noteProductOptions.replaceChildren();

  if (!state.products.length) {
    elements.noteProductTrigger.disabled = true;
    elements.noteProductCurrent.textContent = 'Data produk belum tersedia';
    elements.noteProduct.value = '';
    const empty = document.createElement('p');
    empty.className = 'dropdown-empty';
    empty.textContent = 'Produk akan muncul setelah data API berhasil dimuat.';
    elements.noteProductOptions.append(empty);
    return;
  }

  elements.noteProductTrigger.disabled = false;
  elements.noteProductCurrent.textContent = selectedProduct
    ? `${selectedProduct.title} — ${formatRupiahFromApi(selectedProduct.price)}`
    : 'Pilih produk untuk dicatat';

  state.products.forEach((product) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'product-option';
    option.dataset.productId = String(product.id);
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(product.id === selectedId));

    const title = document.createElement('span');
    title.className = 'product-option-title';
    title.textContent = product.title || 'Produk tanpa nama';
    const meta = document.createElement('span');
    meta.className = 'product-option-meta';
    meta.textContent = `${getCategoryDisplayName(product.category)} · ${formatRupiahFromApi(product.price)}`;
    option.append(title, meta);
    option.addEventListener('click', () => selectNoteProduct(product));
    elements.noteProductOptions.append(option);
  });
  filterNoteProductOptions();
}

function selectNoteProduct(product) {
  elements.noteProduct.value = String(product.id);
  elements.noteProductCurrent.textContent = `${product.title} — ${formatRupiahFromApi(product.price)}`;
  elements.noteProductOptions.querySelectorAll('.product-option').forEach((button) => {
    button.setAttribute('aria-selected', String(Number(button.dataset.productId) === product.id));
  });
  closeDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu);
  elements.noteProductSearch.value = '';
  filterNoteProductOptions();
  setNoteError('');
}

function filterNoteProductOptions() {
  const term = elements.noteProductSearch.value.trim().toLocaleLowerCase('id-ID');
  let visibleCount = 0;
  elements.noteProductOptions.querySelectorAll('.product-option').forEach((button) => {
    const matches = button.textContent.toLocaleLowerCase('id-ID').includes(term);
    button.hidden = !matches;
    if (matches) visibleCount += 1;
  });
  const existingEmpty = elements.noteProductOptions.querySelector('.dropdown-empty');
  if (!state.products.length && existingEmpty) return;
  let noMatches = elements.noteProductOptions.querySelector('.dropdown-no-results');
  if (!visibleCount) {
    if (!noMatches) {
      noMatches = document.createElement('p');
      noMatches.className = 'dropdown-empty dropdown-no-results';
      noMatches.textContent = 'Produk tidak ditemukan. Coba kata kunci lain.';
      elements.noteProductOptions.append(noMatches);
    }
    noMatches.hidden = false;
  } else if (noMatches) {
    noMatches.hidden = true;
  }
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const media = document.createElement('div');
  media.className = 'product-media';
  const category = document.createElement('span');
  category.className = 'product-category';
  category.textContent = getCategoryDisplayName(product.category);
  media.append(category);

  const favoriteButton = document.createElement('button');
  favoriteButton.type = 'button';
  favoriteButton.className = 'favorite-button';
  favoriteButton.dataset.productId = String(product.id);
  favoriteButton.setAttribute('aria-pressed', String(state.favorites.has(product.id)));
  favoriteButton.setAttribute('aria-label', state.favorites.has(product.id)
    ? `Hapus ${product.title} dari favorit`
    : `Tambahkan ${product.title} ke favorit`);
  favoriteButton.title = state.favorites.has(product.id) ? 'Hapus dari favorit' : 'Tambahkan ke favorit';
  favoriteButton.textContent = state.favorites.has(product.id) ? '♥' : '♡';
  favoriteButton.addEventListener('click', () => toggleFavorite(product.id));
  media.append(favoriteButton);

  const image = document.createElement('img');
  image.className = 'product-image';
  image.alt = product.title ? `Gambar ${product.title}` : 'Gambar produk';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => {
    const fallback = document.createElement('span');
    fallback.className = 'product-image-fallback';
    fallback.setAttribute('aria-label', 'Gambar produk tidak tersedia');
    fallback.textContent = String(product.title || '?').trim().charAt(0).toUpperCase() || '?';
    image.replaceWith(fallback);
  }, { once: true });
  if (typeof product.thumbnail === 'string' && product.thumbnail.trim()) {
    image.src = product.thumbnail;
    media.append(image);
  } else {
    const fallback = document.createElement('span');
    fallback.className = 'product-image-fallback';
    fallback.textContent = String(product.title || '?').trim().charAt(0).toUpperCase() || '?';
    media.append(fallback);
  }

  const info = document.createElement('div');
  info.className = 'product-info';
  const brand = document.createElement('p');
  brand.className = 'product-brand';
  brand.textContent = product.brand || getCategoryDisplayName(product.category) || 'Produk';
  const title = document.createElement('h3');
  title.className = 'product-title';
  title.textContent = product.title || 'Produk tanpa nama';
  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || 'Tidak ada deskripsi untuk produk ini.';

  const meta = document.createElement('div');
  meta.className = 'product-meta';
  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = formatRupiahFromApi(product.price);
  price.title = `Konversi ilustratif dari nilai harga API dengan kurs Rp${USD_TO_IDR_RATE.toLocaleString('id-ID')}`;
  const stock = document.createElement('span');
  stock.className = 'product-stock';
  const stockValue = Number(product.stock);
  stock.textContent = Number.isFinite(stockValue) ? `${stockValue} tersedia` : 'Stok tidak tersedia';
  meta.append(price, stock);

  const bottom = document.createElement('div');
  bottom.className = 'product-bottom';
  const rating = document.createElement('span');
  rating.className = 'product-rating';
  const star = document.createElement('span');
  star.className = 'rating-star';
  star.setAttribute('aria-hidden', 'true');
  star.textContent = '★';
  const ratingValue = Number(product.rating);
  rating.append(star, document.createTextNode(Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : 'N/A'));
  const id = document.createElement('span');
  id.className = 'product-id';
  id.textContent = `ID #${product.id}`;
  bottom.append(rating, id);

  info.append(brand, title, description, meta, bottom);
  card.append(media, info);
  return card;
}

function getVisibleProducts() {
  const searchTerm = state.search.trim().toLocaleLowerCase('id-ID');
  let visibleProducts = state.products.filter((product) => {
    const inCurrentView = state.view !== 'favorites' || state.favorites.has(product.id);
    const inCategory = state.category === 'all' || getCategoryGroupKey(product.category) === state.category;
    if (!inCurrentView || !inCategory) return false;
    if (!searchTerm) return true;
    const searchableText = [product.title, product.category, getCategoryDisplayName(product.category), getCategoryGroupLabel(getCategoryGroupKey(product.category)), product.brand, product.description]
      .filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
    return searchableText.includes(searchTerm);
  });

  switch (state.sort) {
    case 'price-asc': visibleProducts = visibleProducts.sort((a, b) => Number(a.price) - Number(b.price)); break;
    case 'price-desc': visibleProducts = visibleProducts.sort((a, b) => Number(b.price) - Number(a.price)); break;
    case 'title-asc': visibleProducts = visibleProducts.sort((a, b) => String(a.title).localeCompare(String(b.title), 'id')); break;
    case 'rating-desc': visibleProducts = visibleProducts.sort((a, b) => Number(b.rating) - Number(a.rating)); break;
    default: break; // Urutan rekomendasi mempertahankan urutan dari API.
  }
  return visibleProducts;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  const fragment = document.createDocumentFragment();
  visibleProducts.forEach((product) => fragment.append(createProductCard(product)));
  elements.productGrid.replaceChildren(fragment);
  elements.catalogCount.textContent = String(visibleProducts.length);
  elements.productGrid.setAttribute('aria-busy', 'false');
  updateFavoriteCounts();
  updateCategoryFilterState();

  const shouldShowEmpty = !state.loading && visibleProducts.length === 0;
  elements.emptyState.hidden = !shouldShowEmpty;
  if (shouldShowEmpty) {
    if (state.products.length === 0) {
      elements.emptyTitle.textContent = 'Produk belum tersedia';
      elements.emptyDescription.textContent = 'Tunggu koneksi berhasil atau gunakan tombol coba lagi.';
    } else if (state.view === 'favorites' && state.favorites.size === 0) {
      elements.emptyTitle.textContent = 'Belum ada produk favorit';
      elements.emptyDescription.textContent = 'Tekan ikon hati pada kartu produk untuk menyimpannya di sini.';
    } else if (state.category !== 'all') {
      elements.emptyTitle.textContent = 'Tidak ada produk pada filter ini';
      elements.emptyDescription.textContent = 'Coba kelompok kategori lain atau reset semua filter.';
    } else {
      elements.emptyTitle.textContent = 'Produk tidak ditemukan';
      elements.emptyDescription.textContent = 'Coba kata kunci lain atau reset filter yang digunakan.';
    }
  }

  if (state.products.length > 0) {
    elements.resultSummary.textContent = `Menampilkan ${visibleProducts.length} dari ${state.products.length} produk.`;
  }
}

function toggleFavorite(productId) {
  if (state.favorites.has(productId)) state.favorites.delete(productId);
  else state.favorites.add(productId);
  writeStorage(STORAGE_KEYS.favorites, [...state.favorites]);
  updateFavoriteCounts();
  renderProducts();
}

function updateFavoriteCounts() {
  elements.favoritesCount.textContent = String(state.favorites.size);
  elements.allCount.textContent = String(state.products.length);
  elements.filterTabs.forEach((button) => {
    const isActive = button.dataset.view === state.view;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderNotes() {
  elements.notesList.replaceChildren();
  elements.notesCount.textContent = String(state.notes.length);
  if (state.notes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'notes-empty';
    empty.textContent = 'Belum ada catatan tersimpan.';
    elements.notesList.append(empty);
    return;
  }

  state.notes.forEach((note) => {
    const item = document.createElement('article');
    item.className = 'saved-note';
    const copy = document.createElement('div');
    copy.className = 'saved-note-copy';
    const title = document.createElement('p');
    title.className = 'saved-note-title';
    title.textContent = note.productTitle || 'Catatan produk';
    const body = document.createElement('p');
    body.className = 'saved-note-text';
    body.textContent = note.text;
    const date = document.createElement('time');
    date.className = 'saved-note-date';
    date.textContent = formatDateTime(note.createdAt);
    if (note.createdAt) date.dateTime = note.createdAt;
    copy.append(title, body, date);
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-note';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Hapus';
    deleteButton.setAttribute('aria-label', `Hapus catatan untuk ${note.productTitle || 'produk'}`);
    deleteButton.addEventListener('click', () => deleteNote(note.id));
    item.append(copy, deleteButton);
    elements.notesList.append(item);
  });
}

function setNoteError(message) {
  elements.noteError.textContent = message;
  elements.noteError.hidden = !message;
  elements.noteText.setAttribute('aria-invalid', String(Boolean(message)));
}

function updateCharacterCount() {
  const length = elements.noteText.value.trim().length;
  elements.characterCount.textContent = `${length} / 30 karakter minimum`;
  elements.characterCount.classList.toggle('met', length >= 30);
  if (elements.noteError.hidden === false && length >= 30) setNoteError('');
}

function saveNote(event) {
  event.preventDefault();
  elements.noteSuccess.hidden = true;
  setNoteError('');

  const productId = Number(elements.noteProduct.value);
  const noteText = elements.noteText.value.trim();
  const product = state.products.find((item) => item.id === productId);

  if (!product) {
    setNoteError('Pilih produk terkait dengan membuka daftar produk terlebih dahulu.');
    elements.noteProductTrigger.focus();
    return;
  }
  if (noteText.length < 30) {
    setNoteError(`Catatan belum cukup panjang. Masukkan minimal 30 karakter; saat ini ${noteText.length} karakter.`);
    elements.noteText.focus();
    return;
  }

  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    productTitle: product.title,
    text: noteText,
    createdAt: new Date().toISOString()
  };
  state.notes.unshift(note);
  const saved = writeStorage(STORAGE_KEYS.notes, state.notes);
  renderNotes();
  elements.noteText.value = '';
  updateCharacterCount();
  elements.noteSuccess.textContent = saved
    ? 'Catatan berhasil disimpan di browser ini.'
    : 'Catatan ditampilkan, tetapi browser tidak mengizinkan penyimpanan lokal. Coba jalankan melalui Laragon.';
  elements.noteSuccess.hidden = false;
}

function deleteNote(noteId) {
  state.notes = state.notes.filter((note) => note.id !== noteId);
  writeStorage(STORAGE_KEYS.notes, state.notes);
  renderNotes();
}

function setSort(value) {
  const selected = elements.sortMenu.querySelector(`[data-value="${value}"]`);
  if (!selected) return;
  state.sort = value;
  elements.sortCurrent.textContent = selected.textContent.trim();
  elements.sortMenu.querySelectorAll('[data-value]').forEach((option) => {
    const isSelected = option.dataset.value === value;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-selected', String(isSelected));
  });
  closeDropdown(elements.sortDropdown, elements.sortTrigger, elements.sortMenu);
  renderProducts();
}

function openDropdown(root, trigger, menu, focusElement = null) {
  closeAllDropdowns();
  root.classList.add('is-open');
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  if (focusElement) window.setTimeout(() => focusElement.focus(), 0);
}

function closeDropdown(root, trigger, menu) {
  root.classList.remove('is-open');
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}

function closeAllDropdowns() {
  closeDropdown(elements.sortDropdown, elements.sortTrigger, elements.sortMenu);
  closeDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu);
}

function handleOptionKeyboard(event, menu, trigger) {
  const options = [...menu.querySelectorAll('[role="option"]:not([hidden])')];
  if (!options.length) return;
  const currentIndex = options.indexOf(document.activeElement);
  let nextIndex = currentIndex;
  if (event.key === 'ArrowDown') nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
  else if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = options.length - 1;
  else if (event.key === 'Escape') {
    event.preventDefault();
    closeAllDropdowns();
    trigger.focus();
    return;
  } else return;
  event.preventDefault();
  options[nextIndex].focus();
}

function resetFilters() {
  state.search = '';
  state.sort = 'recommended';
  state.view = 'all';
  state.category = 'all';
  elements.searchInput.value = '';
  setSort('recommended');
  renderCategoryFilters();
  renderProducts();
}

function attachEvents() {
  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
  elements.retryButton.addEventListener('click', loadProducts);
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  elements.sortTrigger.addEventListener('click', () => {
    if (elements.sortMenu.hidden) openDropdown(elements.sortDropdown, elements.sortTrigger, elements.sortMenu);
    else closeDropdown(elements.sortDropdown, elements.sortTrigger, elements.sortMenu);
  });
  elements.sortTrigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openDropdown(elements.sortDropdown, elements.sortTrigger, elements.sortMenu);
    const selectedOption = elements.sortMenu.querySelector('[aria-selected="true"]');
    (selectedOption || elements.sortMenu.querySelector('[role="option"]'))?.focus();
  });
  elements.sortMenu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-value]');
    if (option) setSort(option.dataset.value);
  });
  elements.sortMenu.addEventListener('keydown', (event) => handleOptionKeyboard(event, elements.sortMenu, elements.sortTrigger));

  elements.categoryFilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    updateCategoryFilterState();
    renderProducts();
  });

  elements.filterTabs.forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      updateFavoriteCounts();
      renderProducts();
    });
  });
  elements.resetFilters.addEventListener('click', resetFilters);

  elements.noteProductTrigger.addEventListener('click', () => {
    if (elements.noteProductTrigger.disabled) return;
    if (elements.noteProductMenu.hidden) {
      openDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu, elements.noteProductSearch);
    } else {
      closeDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu);
    }
  });
  elements.noteProductTrigger.addEventListener('keydown', (event) => {
    if ((event.key !== 'ArrowDown' && event.key !== 'ArrowUp') || elements.noteProductTrigger.disabled) return;
    event.preventDefault();
    openDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu, elements.noteProductSearch);
  });
  elements.noteProductSearch.addEventListener('input', filterNoteProductOptions);
  elements.noteProductSearch.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      const firstOption = [...elements.noteProductOptions.querySelectorAll('.product-option:not([hidden])')][0];
      if (firstOption) {
        event.preventDefault();
        firstOption.focus();
      }
    }
  });
  elements.noteProductMenu.addEventListener('keydown', (event) => {
    if (event.target.matches('.product-option')) handleOptionKeyboard(event, elements.noteProductOptions, elements.noteProductTrigger);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown(elements.noteProductDropdown, elements.noteProductTrigger, elements.noteProductMenu);
      elements.noteProductTrigger.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!elements.sortDropdown.contains(event.target) && !elements.noteProductDropdown.contains(event.target)) closeAllDropdowns();
  });

  elements.noteForm.addEventListener('submit', saveNote);
  elements.noteText.addEventListener('input', updateCharacterCount);
  elements.noteText.addEventListener('blur', () => {
    if (elements.noteText.value.trim().length >= 30) setNoteError('');
  });
  document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable;
    if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });
}

function initializeApp() {
  initializeTheme();
  initializeLocalData();
  updateCharacterCount();
  attachEvents();
  loadProducts();
}

initializeApp();
