// Íconos de trazo (24×24). Se pintan en cualquier elemento con data-icon="nombre".
export const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.5V19a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1V9.5"/>',
  homeFill: '<path d="M3.5 10.5 12 3.5l8.5 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z" fill="currentColor" stroke="none"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none"/>',
  listFill: '<path d="M9 6h11M9 12h11M9 18h11" stroke-width="2.4"/><circle cx="4.5" cy="6" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.6" fill="currentColor" stroke="none"/>',
  chart: '<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M4 20h16"/>',
  chartFill: '<rect x="3" y="12" width="4.5" height="8" rx="1" fill="currentColor" stroke="none"/><rect x="9.75" y="4" width="4.5" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="16.5" y="9" width="4.5" height="11" rx="1" fill="currentColor" stroke="none"/>',
  user: '<circle cx="12" cy="8.2" r="3.4"/><path d="M4.8 20c.7-4 3.6-6 7.2-6s6.5 2 7.2 6"/>',
  userFill: '<circle cx="12" cy="8.2" r="3.6" fill="currentColor" stroke="none"/><path d="M4.5 20c.8-4.2 3.8-6.2 7.5-6.2s6.7 2 7.5 6.2z" fill="currentColor" stroke="none"/>',
  arrowUp: '<path d="M12 19V6"/><path d="M6.5 11.5 12 6l5.5 5.5"/>',
  arrowDown: '<path d="M12 5v13"/><path d="M17.5 12.5 12 18l-5.5-5.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  download: '<path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 20h14"/>',
  star: '<path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.8 7 8.2 6 8.2-6"/>',
  chat: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  wallet: '<path d="M3.5 7.8A2.3 2.3 0 0 1 5.8 5.5h11.4a2.3 2.3 0 0 1 2.3 2.3"/><rect x="3" y="8" width="18" height="11.5" rx="2"/><circle cx="15.5" cy="13.7" r="1.3" fill="currentColor" stroke="none"/>',
  food: '<path d="M7 3v6a2 2 0 0 0 4 0V3"/><path d="M9 9v12"/><path d="M16 3c-1.4 0-2 2-2 4.5S14.6 12 16 12v9"/>',
  transport: '<path d="M4.5 16.2 6 11.3a2 2 0 0 1 1.9-1.4h8.2a2 2 0 0 1 1.9 1.4l1.5 4.9"/><rect x="3" y="16" width="18" height="4" rx="1.2"/><circle cx="7.5" cy="20.2" r="1.3"/><circle cx="16.5" cy="20.2" r="1.3"/>',
  house: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  fun: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
  health: '<path d="M12 20.5s-7.3-4.4-9.6-8.7C.8 8.6 2.6 4.8 6.2 4.8c2 0 3.5 1.2 4 2.5.5-1.3 2-2.5 4-2.5 3.6 0 5.4 3.8 3.6 7-2.3 4.3-9.6 8.7-9.6 8.7z"/>',
  shopping: '<path d="M6.2 8h11.6l-1 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.2 8z"/><path d="M9 8V6.3a3 3 0 0 1 6 0V8"/>',
  services: '<path d="M4 9a13 13 0 0 1 16 0"/><path d="M7.3 13a8.2 8.2 0 0 1 9.4 0"/><path d="M10.6 17a3 3 0 0 1 2.8 0"/><circle cx="12" cy="20" r=".9" fill="currentColor" stroke="none"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5"/><path d="M3 13h18"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M2.5 9h19M12 9v11"/><path d="M12 9S10.5 4.5 8 4.5a2 2 0 0 0 0 4.5M12 9s1.5-4.5 4-4.5a2 2 0 0 1 0 4.5"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19"/>',
  plane: '<path d="M10.5 13.5 3 11l1.5-1.5 8 .5 4-4.5a2 2 0 0 1 3 3l-4.5 4 .5 8L14 22l-2.5-7.5-3 2.5v2.5L7 21l-1-3-3-1 1.5-1.5H7z"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5v2.5M12 3.5v2.5"/>',
  card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  pet: '<circle cx="6" cy="10" r="1.8"/><circle cx="18" cy="10" r="1.8"/><circle cx="9.5" cy="5.5" r="1.8"/><circle cx="14.5" cy="5.5" r="1.8"/><path d="M12 12c-3 0-5.5 3.5-5.5 5.8 0 1.6 1.2 2.2 2.6 2.2 1.2 0 1.9-.6 2.9-.6s1.7.6 2.9.6c1.4 0 2.6-.6 2.6-2.2C17.5 15.5 15 12 12 12z"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
};

export function iconSvg(name) {
  return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + (ICONS[name] || ICONS.wallet) + '</svg>';
}

export function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = iconSvg(el.dataset.icon); });
}

// Íconos que se ofrecen al crear una categoría.
export const CATEGORY_ICONS = ['food', 'transport', 'house', 'fun', 'health', 'shopping', 'services', 'wallet',
  'briefcase', 'spark', 'gift', 'book', 'plane', 'coffee', 'card', 'pet'];
export const CATEGORY_COLORS = ['#FF9500', '#FF3B30', '#FF2D55', '#AF52DE', '#5856D6', '#007AFF',
  '#30B0C7', '#00C7BE', '#34C759', '#A2845E', '#FFCC00', '#8E8E93'];
