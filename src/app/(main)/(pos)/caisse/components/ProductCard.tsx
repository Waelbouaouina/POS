'use client';

// Map product categories to poultry emojis
const PRODUCT_ICONS: Record<string, string> = {
  poulet: '🐔',
  cuisse: '🍗',
  blanc:  '🍗',
  abat:   '🫀',
  foie:   '🫀',
  congelé:'🧊',
  aile:   '🍗',
  default:'🐓',
};

function getProductIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(PRODUCT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return PRODUCT_ICONS.default;
}

interface Produit {
  id: string;
  nom_produit: string;
  prix_vente_gros: number;
  prix_vente_detail: number;
  unite_mesure: string;
  stock_disponible?: number;
}

interface ProductCardProps {
  produit: Produit;
  onAdd: (produit: Produit) => void;
}

export default function ProductCard({ produit, onAdd }: ProductCardProps) {
  const isOutOfStock =
    produit.stock_disponible !== undefined && produit.stock_disponible <= 0;

  return (
    <div
      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={() => !isOutOfStock && onAdd(produit)}
      role="button"
      tabIndex={0}
      aria-label={`Ajouter ${produit.nom_produit} au panier`}
      onKeyDown={(e) => e.key === 'Enter' && !isOutOfStock && onAdd(produit)}
    >
      {/* Name */}
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px' }}>
        <p className="product-card-name" style={{ marginBottom: '2px', fontSize: '0.9rem' }}>{produit.nom_produit}</p>
        {produit.nom_produit_ar && (
          <p style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold', direction: 'rtl', margin: 0 }}>
            {produit.nom_produit_ar}
          </p>
        )}
      </div>

      {/* Stock status */}
      {produit.stock_disponible !== undefined && (
        <span
          className={`badge ${
            isOutOfStock ? 'badge-amber' : 'badge-green'
          }`}
          style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
        >
          {isOutOfStock
            ? 'Rupture'
            : `${produit.stock_disponible.toFixed(1)} ${produit.unite_mesure}`}
        </span>
      )}
    </div>
  );
}
