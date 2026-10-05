const icons: Record<string, string> = {
  home: 'M3 12l9-9 9 9M5 10v10h14V10',
  school: 'M3 9l9-6 9 6-9 6-9-6M7 13v6h10v-6',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5zm8-2a3 3 0 100-6 3 3 0 000 6z',
  teacher: 'M12 14l9-5-9-5-9 5 9 5zm0 2l-7-4v5c0 1 3 3 7 3s7-2 7-3v-5l-7 4z',
  notebook: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  map: 'M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zm10 17l-5-5',
  photo: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1v1M14 20h7v1',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20',
  organization: 'M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 11h0M15 11h0',
  flag: 'M5 3v18M5 4h12l-2 4 2 4H5',
  region: 'M12 2a8 8 0 100 16 8 8 0 000-16zM12 10a2 2 0 100 4 2 2 0 000-4z',
  district: 'M3 6h18v12H3zM9 6v12M15 6v12',
  people: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zm6 7c0-2-3-4-6-4M8 14c-3 0-6 2-6 4',
  office: 'M4 21V5l8-2v18M12 21V7l8 2v12M7 8h0M7 12h0M7 16h0M16 11h0M16 15h0',
  badge: 'M12 2l4 4-4 4-4-4 4-4zM8 6v12l4 4 4-4V6',
  folder: 'M3 7h6l2 2h10v10H3z',
  visit: 'M12 2a5 5 0 100 10 5 5 0 000-10zm0 12c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z',
  services: 'M12 2v4M12 18v4M4 12H2M22 12h-2M6 6L4 4M20 20l-2-2M6 18l-2 2M20 4l-2 2M12 8a4 4 0 100 8 4 4 0 000-8z',
  shield: 'M12 2l8 4v6c0 5-3 9-8 10-5-1-8-5-8-10V6l8-4z',
  bell: 'M12 2a6 6 0 00-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 00-6-6zM10 21a2 2 0 004 0',
  chat: 'M3 4h18v12H7l-4 4V4zM8 9h8M8 13h5',
  card: 'M2 5h20v14H2zM2 9h20M6 14h4',
  location: 'M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 4a3 3 0 110 6 3 3 0 010-6z',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4 12H2M22 12h-2M6 6L4 4M20 20l-2-2M6 18l-2 2M20 4l-2 2',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M6 6l12 12M18 6L6 18',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  user: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-8 3-8 8h16c0-5-3-8-8-8z',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  upload: 'M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2',
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const path = icons[name] ?? icons.home;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'h-5 w-5'}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
