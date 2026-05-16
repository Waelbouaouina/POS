'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../caisse/components/Sidebar';
import '../caisse/pos.css';

const DEFAULT_PRODUCTS = [
  { "name_fr": "Poulet Entier PAC", "name_ar": "دجاج كامل", "name_derja": "Djej Kamel", "category": "poultry", "saleType": "weight", "price": 7.500 },
  { "name_fr": "Escalope de Poulet", "name_ar": "اسكالوب دجاج", "name_derja": "Escalope Djej", "category": "poultry", "saleType": "weight", "price": 16.500 },
  { "name_fr": "Cuisses de Poulet", "name_ar": "فخاذ دجاج كاملة", "name_derja": "Fkhadh Djej", "category": "poultry", "saleType": "weight", "price": 9.200 },
  { "name_fr": "Pilons de Poulet", "name_ar": "فخض صغير (بيلون)", "name_derja": "Pilon Djej", "category": "poultry", "saleType": "weight", "price": 9.800 },
  { "name_fr": "Hauts de Cuisse", "name_ar": "أعلى الفخذ", "name_derja": "Haut de cuisse", "category": "poultry", "saleType": "weight", "price": 9.500 },
  { "name_fr": "Ailes de Poulet", "name_ar": "جوانح دجاج", "name_derja": "Jwane7 Djej", "category": "poultry", "saleType": "weight", "price": 6.800 },
  { "name_fr": "Foie de Volaille", "name_ar": "كبدة دجاج", "name_derja": "Kebda Djej", "category": "poultry", "saleType": "weight", "price": 14.000 },
  { "name_fr": "Gésiers de Poulet", "name_ar": "قانصة دجاج", "name_derja": "9ansa Djej", "category": "poultry", "saleType": "weight", "price": 7.500 },
  { "name_fr": "Carcasses de Poulet", "name_ar": "هيكل دجاج (كركاس)", "name_derja": "Carcasse / Karkas", "category": "poultry", "saleType": "weight", "price": 2.500 },
  { "name_fr": "Jambon de Dinde Cuit", "name_ar": "جامبون داند", "name_derja": "Jambon Dinde", "category": "charcuterie", "saleType": "weight", "price": 18.000 },
  { "name_fr": "Salami de Volaille", "name_ar": "سلامي دجاج", "name_derja": "Salami Djej", "category": "charcuterie", "saleType": "weight", "price": 12.500 },
  { "name_fr": "Fromage Edam (Bloc)", "name_ar": "جبن إيدام (بلوك)", "name_derja": "Fromage Rouge / Edam", "category": "cheese", "saleType": "weight", "price": 24.500 }
];

export default function ProduitsPage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [nomAr, setNomAr] = useState('');
  const [nomDerja, setNomDerja] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [prixVenteGros, setPrixVenteGros] = useState('');
  const [prixVenteDetail, setPrixVenteDetail] = useState('');
  const [uniteMesure, setUniteMesure] = useState('Kg');
  const [datePrix, setDatePrix] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      const [resProd, resCat, resStock] = await Promise.all([
        fetch('/api/produits?depth=1&limit=100'),
        fetch('/api/categories?limit=100'),
        fetch('/api/stocks?depth=1&limit=100')
      ]);
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      const dataStock = await resStock.json();
      
      setProduits(dataProd.docs || []);
      setCategories(dataCat.docs || []);
      setStocks(dataStock.docs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportDefault = async () => {
    if (!confirm('Voulez-vous importer la liste de produits par défaut ?')) return;
    setLoading(true);
    try {
      // 1. Get or create categories
      const catMap: any = {};
      categories.forEach(c => catMap[c.nom_categorie.toLowerCase()] = c.id);

      for (const item of DEFAULT_PRODUCTS) {
        let cid = catMap[item.category.toLowerCase()];
        if (!cid) {
          const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom_categorie: item.category })
          });
          const d = await res.json();
          cid = d.doc.id;
          catMap[item.category.toLowerCase()] = cid;
        }

        await fetch('/api/produits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_produit: item.name_fr,
            nom_produit_ar: item.name_ar,
            nom_produit_derja: item.name_derja,
            categorie_id: cid,
            prix_vente_gros: item.price,
            unite_mesure: item.saleType === 'weight' ? 'Kg' : 'Piece',
            date_prix: new Date().toISOString()
          })
        });
      }
      fetchData();
      alert('Importation terminée !');
    } catch (err: any) {
      alert("Erreur lors de l'importation");
    } finally {
      setLoading(false);
    }
  };

  const getStocksForProduct = (prodId: string) => {
    const prodStocks = stocks.filter(st => (st.produit_id?.id || st.produit_id) === prodId);
    const depot = prodStocks.find(s => s.emplacement_id?.type_emplacement === 'Depot')?.quantite_disponible || 0;
    const magasin = prodStocks.find(s => s.emplacement_id?.type_emplacement === 'Magasin')?.quantite_disponible || 0;
    return { depot, magasin };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nom_produit: nom,
        nom_produit_ar: nomAr,
        nom_produit_derja: nomDerja,
        categorie_id: categorieId || null,
        prix_achat: Number(prixAchat),
        prix_vente_gros: Number(prixVenteGros),
        prix_vente_detail: Number(prixVenteDetail),
        unite_mesure: uniteMesure,
        date_prix: new Date(datePrix).toISOString()
      };

      const url = editingId ? `/api/produits/${editingId}` : '/api/produits';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      
      setEditingId(null);
      setNom(''); setNomAr(''); setNomDerja(''); setPrixAchat(''); setPrixVenteGros(''); setPrixVenteDetail('');
      fetchData();
      alert('Produit mis à jour');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setNom(p.nom_produit);
    setNomAr(p.nom_produit_ar || '');
    setNomDerja(p.nom_produit_derja || '');
    setCategorieId(p.categorie_id?.id || p.categorie_id || '');
    setPrixAchat(p.prix_achat?.toString() || '');
    setPrixVenteGros(p.prix_vente_gros?.toString() || '');
    setPrixVenteDetail(p.prix_vente_detail?.toString() || '');
    setUniteMesure(p.unite_mesure);
    if (p.date_prix) setDatePrix(p.date_prix.split('T')[0]);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/produits/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error("Impossible de supprimer ce produit. Raison probable : ce produit a déjà été utilisé dans des ventes (BL) ou des mouvements de stock. Vous devez garder l'historique pour votre comptabilité.");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="pos-layout full-width">
      <Sidebar />
      <main className="pos-main" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>🛒 Produits & Prix du Jour</h1>
          <button 
            onClick={handleImportDefault}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
          >
            📥 Importer la liste par défaut
          </button>
        </div>
        
        {/* Formulaire de mise à jour rapide */}
        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {editingId ? 'Modifier Prix / Infos' : 'Ajouter un nouveau produit'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <input 
              type="text" placeholder="Nom (Français)" value={nom} onChange={e => setNom(e.target.value)} required
              className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="text" placeholder="Nom (Arabe)" value={nomAr} onChange={e => setNomAr(e.target.value)} 
              className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', direction: 'rtl' }}
            />
            <input 
              type="number" step="0.001" placeholder="Prix d'achat" value={prixAchat} onChange={e => setPrixAchat(e.target.value)} 
              className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="number" step="0.001" placeholder="Prix Vente (Gros)" value={prixVenteGros} onChange={e => setPrixVenteGros(e.target.value)} 
              className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="date" value={datePrix} onChange={e => setDatePrix(e.target.value)} 
              className="input" style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: 'none', background: 'var(--accent-color, #3b82f6)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {editingId ? '💾 Enregistrer & Historiser' : '+ Créer le Produit'}
              </button>
              {editingId && (
                <button type="button" onClick={() => setEditingId(null)} style={{ padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.1)', color: 'white' }}>Annuler</button>
              )}
            </div>
          </form>
        </div>

        {/* Liste des produits avec Stock Actuel */}
        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Liste des Produits & Stocks</h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem' }}>Désignation (FR / AR)</th>
                    <th style={{ padding: '1rem' }}>🛒 Magasin</th>
                    <th style={{ padding: '1rem' }}>🏠 Dépot</th>
                    <th style={{ padding: '1rem' }}>Prix Achat</th>
                    <th style={{ padding: '1rem' }}>Prix Vente</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun produit. Utilisez le bouton d'importation en haut à droite.</td></tr>
                  ) : (
                    produits.map((p) => {
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{p.nom_produit}</div>
                            {p.nom_produit_ar && <div style={{ color: '#10b981', direction: 'rtl' }}>{p.nom_produit_ar}</div>}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '0.4rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 'bold' }}>
                              {getStocksForProduct(p.id).magasin.toFixed(2)} {p.unite_mesure}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '0.4rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 'bold' }}>
                              {getStocksForProduct(p.id).depot.toFixed(2)} {p.unite_mesure}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.prix_achat?.toFixed(3)} TND</td>
                          <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>{p.prix_vente_gros?.toFixed(3)} TND</td>
                          <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEdit(p)} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}>🗑️</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
