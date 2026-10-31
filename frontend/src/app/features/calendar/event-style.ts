// Material icon name → Italian label (used as the picker's accessible name)
export const EVENT_ICONS: Record<string, string> = {
  event: 'Evento',
  groups: 'Riunione',
  volunteer_activism: 'Volontariato',
  shopping_cart: 'Spesa',
  restaurant: 'Pasto',
  school: 'Formazione',
  celebration: 'Festa',
  campaign: 'Annuncio',
  handshake: 'Incontro',
  local_hospital: 'Salute',
  inventory_2: 'Magazzino',
  star: 'Importante',
};

// Light/dark pairs keep chips readable in both themes
export const EVENT_COLORS: Record<string, { label: string; background: string; text: string }> = {
  green: { label: 'Verde', background: 'light-dark(#c8e6c9, #1b3d1f)', text: 'light-dark(#1b5e20, #a5d6a7)' },
  blue: { label: 'Blu', background: 'light-dark(#bbdefb, #0d2a42)', text: 'light-dark(#0d47a1, #90caf9)' },
  teal: { label: 'Verde acqua', background: 'light-dark(#b2dfdb, #0f3330)', text: 'light-dark(#004d40, #80cbc4)' },
  purple: { label: 'Viola', background: 'light-dark(#e1bee7, #331a3a)', text: 'light-dark(#4a148c, #ce93d8)' },
  pink: { label: 'Rosa', background: 'light-dark(#f8bbd0, #3d1526)', text: 'light-dark(#880e4f, #f48fb1)' },
  red: { label: 'Rosso', background: 'light-dark(#ffcdd2, #3b1214)', text: 'light-dark(#b71c1c, #ef9a9a)' },
  orange: { label: 'Arancione', background: 'light-dark(#ffe0b2, #3a2508)', text: 'light-dark(#bf360c, #ffcc80)' },
  grey: { label: 'Grigio', background: 'var(--mat-sys-surface-container-high)', text: 'var(--mat-sys-on-surface)' },
};
export const DEFAULT_EVENT_COLOR = 'grey';
