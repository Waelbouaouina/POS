'use client';

import { useEffect, useState } from 'react';
import CartItem from './CartItem';

const API_URL = '';

interface CartItemData {
  id: string;
  produit: { id: string; nom_produit: string; prix_vente_gros: number; unite_mesure: string };
  poids_brut: number;
  tare: number;
  poids_net: number;
  sous_total: number;
}

interface Tier {
  id: string;
  raison_sociale: string;
  telephone?: string;
  adresse?: string;
  matricule_fiscal?: string;
}

interface PanierAreaProps {
  cart: CartItemData[];
  onUpdateWeight: (id: string, field: 'poids_brut' | 'tare', value: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (clientId: string, source: 'Depot' | 'Magasin') => Promise<void>;
  onClear: () => void;
}

const TVA_RATE = 0.19;

export default function PanierArea({
  cart,
  onUpdateWeight,
  onRemove,
  onCheckout,
  onClear,
}: PanierAreaProps) {
  const [clients, setClients] = useState<Tier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [sourceStock, setSourceStock] = useState<'Depot' | 'Magasin'>('Depot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_URL}/api/tiers?where[type_tier][equals]=Client&limit=100`)
      .then((r) => r.json())
      .then((data) => setClients(data.docs || []))
      .catch(() => setClients([]));
  }, []);

  if (!mounted) return null;

  const filteredClients = clients.filter(c => 
    c.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPoidsNet = cart.reduce((acc, item) => acc + item.poids_net, 0);
  const totalHT       = cart.reduce((acc, item) => acc + item.sous_total, 0);
  const totalTVA      = totalHT * TVA_RATE;
  const totalTTC      = totalHT + totalTVA;

  const generateBLPrint = (data: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Le bloqueur de fenêtres empêche l'ouverture du Bon de Livraison. Veuillez l'autoriser.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Bon de Livraison - ${data.numero}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 32px; font-weight: bold; color: #2c3e50; margin: 0; }
            .bl-title { text-align: right; }
            .bl-title h1 { margin: 0; font-size: 28px; color: #000; }
            .client-info { border: 1px solid #ccc; padding: 20px; width: 350px; border-radius: 8px; margin-bottom: 40px; }
            .client-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            th { background: #f8f9fa; border: 1px solid #000; padding: 12px; text-align: left; }
            td { border: 1px solid #000; padding: 12px; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; }
            .totals { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
            .grand-total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 22px; color: #e74c3c; }
            .signature { text-align: center; width: 250px; }
            .sig-line { border-bottom: 1px dashed #999; height: 100px; margin-top: 10px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="company-name">مزرعة حاتم</h1>
              <p>Élevage et Distribution de Volailles</p>
              <p>Tél: +216 XX XXX XXX</p>
            </div>
            <div class="bl-title">
              <h1>BON DE LIVRAISON</h1>
              <p>N°: ${data.numero}</p>
              <p>Date: ${data.date}</p>
            </div>
          </div>

          <div class="client-info">
            <p><strong>CLIENT:</strong></p>
            <p class="client-name">${data.client?.raison_sociale}</p>
            <p>${data.client?.adresse || 'Adresse non spécifiée'}</p>
            <p>Tél: ${data.client?.telephone || '-'}</p>
            ${data.client?.matricule_fiscal ? `<p>MF: ${data.client.matricule_fiscal}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Unité</th>
                <th>Poids/Qté</th>
                <th>P.U (TND)</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item: any) => `
                <tr>
                  <td>${item.produit.nom_produit}</td>
                  <td>${item.produit.unite_mesure}</td>
                  <td align="center">${item.poids_net.toFixed(3)}</td>
                  <td align="right">${item.produit.prix_vente_gros.toFixed(3)}</td>
                  <td align="right">${item.sous_total.toFixed(3)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="signature">
              <p>Signature & Cachet Client</p>
              <div class="sig-line"></div>
            </div>
            <div class="totals">
              <div class="total-row"><span>Total HT:</span> <span>${data.totalHT.toFixed(3)}</span></div>
              <div class="total-row"><span>TVA (19%):</span> <span>${data.totalTVA.toFixed(3)}</span></div>
              <div class="total-row grand-total"><span>TOTAL TTC:</span> <span>${data.totalTTC.toFixed(3)} TND</span></div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      setStatusMsg({ type: 'error', text: 'Veuillez sélectionner un client.' });
      return;
    }
    if (cart.length === 0) {
      setStatusMsg({ type: 'error', text: 'Le panier est vide.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const clientObj = clients.find(c => c.id == selectedClientId);
      const printData = {
        client: clientObj,
        items: [...cart],
        totalHT,
        totalTVA,
        totalTTC,
        date: new Date().toLocaleString(),
        numero: `BL-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
      };
      
      await onCheckout(selectedClientId, sourceStock);
      
      generateBLPrint(printData);
      
      setStatusMsg({ type: 'success', text: 'BL Validé et imprimé !' });
      setSelectedClientId('');
      setSearchTerm('');
      onClear();

    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erreur lors de la validation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="panier-area">
      <div className="panier-header">
        <h2 className="panier-title">🛒 Panier</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {cart.length > 0 && <span className="panier-count">{cart.length}</span>}
          {cart.length > 0 && (
            <button className="btn-ghost btn" onClick={onClear}>Vider</button>
          )}
        </div>
      </div>

      <div className="client-select-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p className="client-select-label">Client</p>
        <input 
          type="text"
          placeholder="Chercher client..."
          className="input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="input"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          <option value="">— Sélectionner —</option>
          {filteredClients.map((c) => (
            <option key={c.id} value={c.id}>{c.raison_sociale}</option>
          ))}
        </select>
      </div>

      <div className="client-select-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(59, 130, 246, 0.05)' }}>
        <p className="client-select-label">📍 Sortie du Stock</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={() => setSourceStock('Depot')}
            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid ' + (sourceStock === 'Depot' ? '#f59e0b' : 'var(--glass-border)'), background: sourceStock === 'Depot' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: sourceStock === 'Depot' ? '#f59e0b' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            🏠 Magasin
          </button>
          <button 
            onClick={() => setSourceStock('Magasin')}
            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid ' + (sourceStock === 'Magasin' ? '#3b82f6' : 'var(--glass-border)'), background: sourceStock === 'Magasin' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: sourceStock === 'Magasin' ? '#3b82f6' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            🛒 Dépot
          </button>
        </div>
      </div>

      <div className="cart-list">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>Panier vide</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem key={item.id} item={item} onUpdateWeight={onUpdateWeight} onRemove={onRemove} />
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row"><span>Total Poids</span><span className="value">{totalPoidsNet.toFixed(3)} Kg</span></div>
        <div className="summary-row total"><span>Total TTC</span><span className="value">{totalTTC.toFixed(3)} TND</span></div>

        {statusMsg && (
          <p style={{ fontSize: '12px', textAlign: 'center', color: statusMsg.type === 'error' ? '#ef4444' : '#10b981' }}>
            {statusMsg.text}
          </p>
        )}

        <button
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? '⌛...' : '✅ Valider & Imprimer'}
        </button>
      </div>
    </aside>
  );
}
