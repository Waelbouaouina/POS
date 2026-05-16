'use client';

interface CartItemData {
  id: string;
  produit: {
    id: string;
    nom_produit: string;
    prix_vente_gros: number;
    unite_mesure: string;
  };
  poids_brut: number;
  tare: number;
  poids_net: number;
  sous_total: number;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateWeight: (id: string, field: 'poids_brut' | 'tare', value: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateWeight, onRemove }: CartItemProps) {
  return (
    <div className="cart-item">
      {/* Row Header */}
      <div className="cart-item-header">
        <div>
          <p className="cart-item-name">{item.produit.nom_produit}</p>
          <p className="cart-item-price-unit">
            {item.produit.prix_vente_gros?.toFixed(3)} TND / {item.produit.unite_mesure}
          </p>
        </div>
        <button
          className="btn-danger-ghost"
          onClick={() => onRemove(item.id)}
          aria-label="Supprimer l'article"
          title="Supprimer"
        >
          ✕
        </button>
      </div>

      {/* Weight Inputs: the core of the Poultry POS */}
      <div className="cart-item-weights">
        {/* Poids Brut — editable */}
        <div className="weight-field">
          <label className="weight-label" htmlFor={`brut-${item.id}`}>
            Brut (Kg)
          </label>
          <input
            id={`brut-${item.id}`}
            type="number"
            className="input input-sm"
            value={item.poids_brut || ''}
            min={0}
            step={0.001}
            placeholder="0.000"
            onChange={(e) =>
              onUpdateWeight(item.id, 'poids_brut', parseFloat(e.target.value) || 0)
            }
          />
        </div>

        {/* Tare — editable */}
        <div className="weight-field">
          <label className="weight-label" htmlFor={`tare-${item.id}`}>
            Tare (Kg)
          </label>
          <input
            id={`tare-${item.id}`}
            type="number"
            className="input input-sm"
            value={item.tare || ''}
            min={0}
            step={0.001}
            placeholder="0.000"
            onChange={(e) =>
              onUpdateWeight(item.id, 'tare', parseFloat(e.target.value) || 0)
            }
          />
        </div>

        {/* Poids Net — auto-calculated, read-only */}
        <div className="weight-field">
          <span className="weight-label">Net (Kg)</span>
          <div
            className="weight-net"
            aria-label="Poids net calculé automatiquement"
          >
            {item.poids_net > 0 ? item.poids_net.toFixed(3) : '—'}
          </div>
        </div>
      </div>

      {/* Row Footer: Line Total */}
      <div className="cart-item-footer">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {item.poids_net > 0
            ? `${item.poids_net.toFixed(3)} Kg × ${item.produit.prix_vente_gros?.toFixed(3)}`
            : 'Saisir le poids...'}
        </span>
        <p className="cart-item-total">
          {item.sous_total > 0 ? item.sous_total.toFixed(3) : '0.000'}
          <span>TND</span>
        </p>
      </div>
    </div>
  );
}
