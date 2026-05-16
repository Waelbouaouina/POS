'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../caisse/components/Sidebar';
import '../caisse/pos.css';

export default function HistoriquePage() {
  const [bls, setBls] = useState<any[]>([]);
  const [selectedBl, setSelectedBl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBLs = async () => {
    try {
      const res = await fetch('/api/bons_de_livraison?depth=1&limit=100&sort=-date_creation');
      const data = await res.json();
      setBls(data.docs || []);
      if (data.docs?.length > 0) setSelectedBl(data.docs[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBLs(); }, []);

  return (
    <div className="pos-layout full-width">
      <Sidebar />
      <main className="pos-main" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>📋 Journal des Ventes (BL)</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
          
          {/* Liste des BLs (A gauche) */}
          <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Liste des Bons
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {bls.map((bl) => (
                <div 
                  key={bl.id} 
                  onClick={() => setSelectedBl(bl)}
                  style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedBl?.id === bl.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: selectedBl?.id === bl.id ? '4px solid #3b82f6' : '4px solid transparent',
                    transition: '0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: 'white' }}>{bl.numero_bl}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(bl.date_creation).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{bl.tier_id?.raison_sociale || 'Client Comptant'}</div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', marginTop: '5px' }}>
                    {(bl.lignes?.reduce((s:number, l:any) => s + (l.sous_total || 0), 0)).toFixed(3)} DT
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visualisation (Détails) */}
          <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            {selectedBl ? (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderBottom: '2px solid rgba(255,255,255,0.1)', 
                  paddingBottom: '1.5rem',
                  background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)',
                  padding: '1.5rem',
                  borderRadius: '0.8rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                      <span style={{color: '#3b82f6'}}>Détail :</span> {selectedBl.numero_bl}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '5px' }}>📜 Émis le {new Date(selectedBl.date_creation).toLocaleString('fr-FR')}</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '0.7rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
                  >
                    🖨️ Réimprimer le Bon
                  </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Client: <strong style={{color: 'white'}}>{selectedBl.tier_id?.raison_sociale || 'Client Comptant'}</strong></p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '0.8rem' }}>Désignation</th>
                        <th style={{ padding: '0.8rem' }}>Prix U.</th>
                        <th style={{ padding: '0.8rem' }}>Qté</th>
                        <th style={{ padding: '0.8rem' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBl.lignes?.map((l: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.8rem' }}>{l.produit_id?.nom_produit}</td>
                          <td style={{ padding: '0.8rem' }}>{l.prix_unitaire?.toFixed(3)}</td>
                          <td style={{ padding: '0.8rem' }}>{l.quantite}</td>
                          <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{l.sous_total?.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '2rem', textAlign: 'right', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>TOTAL À PAYER</p>
                    <p style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
                      {(selectedBl.lignes?.reduce((s:number, l:any) => s + (l.sous_total || 0), 0)).toFixed(3)} TND
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '5rem' }}>Sélectionnez un bon pour le visualiser.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
