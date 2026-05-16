'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProductArea from './components/ProductArea';
import PanierArea from './components/PanierArea';
import './pos.css';

const API_URL = '';

// ── Types ────────────────────────────────────────────────
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

interface CartItemData {
  id: string;
  produit: Produit;
  poids_brut: number;
  tare: number;
  poids_net: number;
  sous_total: number;
}

// ── Main POS Orchestrator ─────────────────────────────────
export default function POSPage() {
  const [produits, setProduits]   = useState<Produit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart]           = useState<CartItemData[]>([]);

  // 1. Fetch all products from Payload CMS on mount
  useEffect(() => {
    const controller = new AbortController();
    async function fetchProduits() {
      try {
        const res = await fetch(`${API_URL}/api/produits?depth=1&limit=100`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('API unreachable');
        const data = await res.json();
        setProduits(data.docs || []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch produits:', err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduits();
    return () => controller.abort();
  }, []);

  // 2. Add product to cart (supports multiple rows of same product)
  const handleAddToCart = (produit: Produit) => {
    const newItem: CartItemData = {
      id: crypto.randomUUID(),
      produit,
      poids_brut: 0,
      tare: 0,
      poids_net: 0,
      sous_total: 0,
    };
    setCart((prev) => [...prev, newItem]);
  };

  // 3. Live weight calculation — called on every keystroke in Brut/Tare inputs
  const handleUpdateWeight = (rowId: string, field: 'poids_brut' | 'tare', value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const updated = { ...item, [field]: value };
        updated.poids_net  = parseFloat((updated.poids_brut - updated.tare).toFixed(3));
        updated.sous_total = parseFloat((updated.poids_net * updated.produit.prix_vente_gros).toFixed(3));
        return updated;
      })
    );
  };

  // 4. Remove one item from cart
  const handleRemoveFromCart = (rowId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== rowId));
  };

  // 5. Clear entire cart
  const handleClearCart = () => setCart([]);

  // 6. Validate BL → POST to Payload CMS → triggers the PDF generation hook
    const handleCheckout = async (clientId: string, source: 'Depot' | 'Magasin') => {
    const raw_numero = `BL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const numero_bl = `${raw_numero}::${source.toUpperCase()}`; // Suffix for the hook

    const formatId = (id: string | number) => {
      const num = Number(id);
      return isNaN(num) ? id : num;
    };

    const blPayload = {
      numero_bl,
      tier_id: formatId(clientId),
      source_emplacement: source,
      type_document: 'Vente',
      statut: 'Livre', 
      date_creation: new Date().toISOString(),
      lignes: cart.map((item) => ({
        produit_id:   formatId(item.produit.id),
        quantite:     item.poids_net,
        prix_unitaire: item.produit.prix_vente_gros,
        sous_total:   item.sous_total,
      })),
    };

    const res = await fetch(`${API_URL}/api/bons_de_livraison`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-source-location': source, // Crucial for the backend hook
      },
      body: JSON.stringify(blPayload),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('Checkout Error Details:', JSON.stringify(errData, null, 2));
      throw new Error(errData.errors?.[0]?.message || 'Erreur API');
    }

    handleClearCart();
  };

  return (
    <div className="pos-layout">
      <Sidebar />
      <main className="pos-main">
        <ProductArea
          produits={produits}
          isLoading={isLoading}
          onAdd={handleAddToCart}
        />
        <PanierArea
          cart={cart}
          onUpdateWeight={handleUpdateWeight}
          onRemove={handleRemoveFromCart}
          onClear={handleClearCart}
          onCheckout={handleCheckout}
        />
      </main>
    </div>
  );
}
