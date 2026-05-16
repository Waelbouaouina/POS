'use client';

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

interface Produit {
  id: string;
  nom_produit: string;
  nom_produit_ar?: string;
  nom_produit_derja?: string;
  prix_vente_gros: number;
  prix_vente_detail: number;
  unite_mesure: string;
  categorie_id?: { nom_categorie: string };
  stock_disponible?: number;
}

interface ProductAreaProps {
  produits: Produit[];
  isLoading: boolean;
  onAdd: (produit: Produit) => void;
}

const CATEGORIES_RAPIDES = ['Tous', 'Poulet', 'Découpe', 'Abats', 'Congelé'];

export default function ProductArea({ produits, isLoading, onAdd }: ProductAreaProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  // Filter products by search text and category
  const filteredProduits = useMemo(() => {
    return produits.filter((p) => {
      const matchSearch = p.nom_produit.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCategory === 'Tous' ||
        p.categorie_id?.nom_categorie
          ?.toLowerCase()
          .includes(activeCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [produits, search, activeCategory]);

  return (
    <section className="product-area">
      {/* Header */}
      <div className="product-area-header">
        <h1 className="product-area-title">
          Ventes
          <span>{filteredProduits.length} produits</span>
        </h1>
        <span
          className="badge badge-green"
          style={{ fontSize: '12px', padding: '5px 12px' }}
        >
          🟢 Caisse Ouverte
        </span>
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <span className="search-bar-icon">🔍</span>
        <input
          id="product-search"
          type="text"
          className="search-bar"
          placeholder="Rechercher un produit (ex: Cuisse, Poulet Entier...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Category Quick-Filter Tabs */}
      <div className="category-tabs">
        {CATEGORIES_RAPIDES.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card-skeleton" />
            ))
          : filteredProduits.length === 0
          ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '40px',
                  fontSize: '14px',
                }}
              >
                Aucun produit trouvé pour &quot;{search}&quot;
              </div>
            )
          : filteredProduits.map((produit) => (
              <ProductCard key={produit.id} produit={produit} onAdd={onAdd} />
            ))}
      </div>
    </section>
  );
}
