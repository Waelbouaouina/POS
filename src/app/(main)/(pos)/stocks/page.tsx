'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../caisse/components/Sidebar';
import '../caisse/pos.css';

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [emplacements, setEmplacements] = useState<any[]>([]);
  const [dailyHistory, setDailyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new movement
  const [produitId, setProduitId] = useState('');
  const [targetType, setTargetType] = useState('Depot'); 
  const [quantite, setQuantite] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit state
  const [editingStock, setEditingStock] = useState<any>(null);
  const [editQty, setEditQty] = useState('');

  const fetchData = async () => {
    try {
      const [resStock, resProd, resBL, resEmp] = await Promise.all([
        fetch('/api/stocks?depth=2&limit=100'),
        fetch('/api/produits?limit=100'),
        fetch('/api/bons_de_livraison?depth=1&limit=100&sort=-date_creation'),
        fetch('/api/emplacements?limit=100')
      ]);
      const dataStock = await resStock.json();
      const dataProd = await resProd.json();
      const dataBL = await resBL.json();
      const dataEmp = await resEmp.json();
      
      setStocks(dataStock.docs || []);
      setProduits(dataProd.docs || []);
      setEmplacements(dataEmp.docs || []);
      
      const historyMap: any = {};
      (dataBL.docs || []).forEach((bl: any) => {
        const day = new Date(bl.date_creation).toLocaleDateString('fr-FR');
        if (!historyMap[day]) historyMap[day] = { date: day, countBL: 0, clients: new Set(), totalQty: 0 };
        historyMap[day].countBL += 1;
        if (bl.tier_id?.raison_sociale) historyMap[day].clients.add(bl.tier_id.raison_sociale);
        const blQty = bl.lignes?.reduce((sum: number, l: any) => sum + (l.quantite || 0), 0) || 0;
        historyMap[day].totalQty += blQty;
      });
      setDailyHistory(Object.values(historyMap));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let emp = emplacements.find(e => e.type_emplacement === targetType);
      let empId = emp?.id;

      if (!empId) {
        const resCreate = await fetch('/api/emplacements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom_emplacement: targetType === 'Depot' ? 'Dépot Principal' : 'Magasin Vente', type_emplacement: targetType })
        });
        const dataCreate = await resCreate.json();
        empId = dataCreate.doc.id;
      }

      const res = await fetch('/api/mouvements_stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_mouvement: 'Entree_Initiale',
          produit_id: Number(produitId),
          emplacement_destination_id: Number(empId),
          quantite_mouvement: Number(quantite),
          date_mouvement: new Date(date).toISOString()
        })
      });
      if (!res.ok) throw new Error("Erreur");
      setQuantite('');
      fetchData();
      alert('Stock ajouté !');
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateStockQty = async () => {
    if (!editingStock) return;
    try {
      if (editingStock.id) {
        // Update existing
        const res = await fetch(`/api/stocks/${editingStock.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantite_disponible: Number(editQty) })
        });
        if (!res.ok) throw new Error("Erreur de modification");
      } else {
        // Create new record for this product + location
        let emp = emplacements.find(e => e.type_emplacement === editingStock.type);
        let empId = emp?.id;
        
        if (!empId) {
          const resEmp = await fetch('/api/emplacements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom_emplacement: editingStock.type === 'Depot' ? 'Dépot' : 'Magasin', type_emplacement: editingStock.type })
          });
          const dEmp = await resEmp.json();
          empId = dEmp.doc.id;
        }

        const res = await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produit_id: editingStock.prodId,
            emplacement_id: empId,
            quantite_disponible: Number(editQty)
          })
        });
        if (!res.ok) throw new Error("Erreur de création");
      }
      
      setEditingStock(null);
      fetchData();
      alert('Quantité enregistrée !');
    } catch (err: any) { alert(err.message); }
  };

  const groupedStocks = produits.map(p => {
    const depotStock = stocks.find(s => s.produit_id?.id === p.id && s.emplacement_id?.type_emplacement === 'Depot');
    const magasinStock = stocks.find(s => s.produit_id?.id === p.id && s.emplacement_id?.type_emplacement === 'Magasin');
    return {
      id: p.id,
      nom: p.nom_produit,
      nomAr: p.nom_produit_ar,
      depot: depotStock || { id: null, quantite_disponible: 0 },
      magasin: magasinStock || { id: null, quantite_disponible: 0 }
    };
  }); // Removed filter so ALL products are visible and editable

  return (
    <div className="pos-layout full-width">
      <Sidebar />
      <main className="pos-main" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>📦 Gestion des Stocks</h1>
        
        {/* Formulaire d'entrée */}
        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Entrée de stock (Arrivage Rapide)</h2>
          <form onSubmit={handleAddStock} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <select value={produitId} onChange={e => setProduitId(e.target.value)} required className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}>
              <option value="" style={{color: 'black'}}>Sélectionner le produit</option>
              {produits.map(p => <option key={p.id} value={p.id} style={{color: 'black'}}>{p.nom_produit} ({p.nom_produit_ar})</option>)}
            </select>
            <select value={targetType} onChange={e => setTargetType(e.target.value)} required className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}>
              <option value="Depot" style={{color: 'black'}}>🏠 Dépot</option>
              <option value="Magasin" style={{color: 'black'}}>🛒 Magasin</option>
            </select>
            <input type="number" step="0.001" placeholder="Quantité" value={quantite} onChange={e => setQuantite(e.target.value)} required className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }} />
            <button type="submit" style={{ gridColumn: '1 / -1', padding: '1rem', borderRadius: '0.5rem', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>📥 Enregistrer l'entrée</button>
          </form>
        </div>

        {/* État des stocks GROUPÉ */}
        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>État des Stocks</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Produit</th>
                  <th style={{ padding: '1rem' }}>🏠 Dépot (Kg)</th>
                  <th style={{ padding: '1rem' }}>🛒 Magasin (Kg)</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedStocks.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{fontWeight: 'bold'}}>{g.nom}</div>
                      <div style={{fontSize: '12px', color: '#10b981'}}>{g.nomAr}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingStock?.prodId === g.id && editingStock.type === 'Depot' ? (
                        <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="input" style={{width: '80px'}} autoFocus />
                      ) : (
                        <span style={{color: '#f59e0b', fontWeight: 'bold'}}>
                          {g.depot.quantite_disponible.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingStock?.prodId === g.id && editingStock.type === 'Magasin' ? (
                        <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="input" style={{width: '80px'}} autoFocus />
                      ) : (
                        <span style={{color: '#60a5fa', fontWeight: 'bold'}}>
                          {g.magasin.quantite_disponible.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingStock?.prodId === g.id ? (
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={handleUpdateStockQty} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Enregistrer</button>
                          <button onClick={() => setEditingStock(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                        </div>
                      ) : (
                        <div style={{display: 'flex', gap: '5px'}}>
                           <button onClick={() => { setEditingStock({id: g.depot.id, prodId: g.id, type: 'Depot'}); setEditQty(g.depot.quantite_disponible.toString()); }} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid #555', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Modifier Dépot</button>
                           <button onClick={() => { setEditingStock({id: g.magasin.id, prodId: g.id, type: 'Magasin'}); setEditQty(g.magasin.quantite_disponible.toString()); }} style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Modifier Magasin</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
