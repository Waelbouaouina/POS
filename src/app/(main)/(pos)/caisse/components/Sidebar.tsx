'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/caisse',     icon: '🏪', label: 'Caisse'    },
  { href: '/produits',   icon: '🛒', label: 'Produits'  },
  { href: '/stocks',    icon: '📦', label: 'Stocks'    },
  { href: '/clients',   icon: '👥', label: 'Clients'   },
  { href: '/historique',icon: '📋', label: 'Historique'},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo Mark */}
      <div className="sidebar-logo" title="HATEM">H</div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-item ${pathname === href ? 'active' : ''}`}
            title={label}
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom: User Avatar Placeholder */}
      <div
        className="sidebar-item"
        style={{ marginTop: 'auto', marginBottom: '8px' }}
        title="Paramètres"
      >
        <span className="sidebar-icon">⚙️</span>
        <span className="sidebar-label">Config</span>
      </div>
    </aside>
  );
}
