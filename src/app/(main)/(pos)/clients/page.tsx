'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../caisse/components/Sidebar';
import '../caisse/pos.css';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [raisonSociale, setRaisonSociale] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [matriculeFiscal, setMatriculeFiscal] = useState('');

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/tiers?where[type_tier][equals]=Client&limit=100');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.docs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        type_tier: 'Client',
        raison_sociale: raisonSociale,
        telephone: telephone,
        adresse: adresse,
        matricule_fiscal: matriculeFiscal,
      };

      const url = editingId ? `/api/tiers/${editingId}` : '/api/tiers';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      
      // Reset form
      setEditingId(null);
      setRaisonSociale(''); setTelephone(''); setAdresse(''); setMatriculeFiscal('');
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setRaisonSociale(c.raison_sociale);
    setTelephone(c.telephone || '');
    setAdresse(c.adresse || '');
    setMatriculeFiscal(c.matricule_fiscal || '');
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    try {
      const res = await fetch(`/api/tiers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telephone?.includes(searchTerm)
  );

  return (
    <div className="pos-layout full-width">
      <Sidebar />
      <main className="pos-main" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem' }}>👥 Gestion des Clients</h1>
        
        {/* Formulaire d'ajout / Modification */}
        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {editingId ? 'Modifier le client' : 'Ajouter un nouveau client'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Raison Sociale" 
              value={raisonSociale} 
              onChange={e => setRaisonSociale(e.target.value)} 
              required
              style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="Téléphone" 
              value={telephone} 
              onChange={e => setTelephone(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="Adresse" 
              value={adresse} 
              onChange={e => setAdresse(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="Matricule Fiscal" 
              value={matriculeFiscal} 
              onChange={e => setMatriculeFiscal(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button 
                type="submit" 
                style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: 'none', background: 'var(--accent-color, #3b82f6)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {editingId ? '💾 Enregistrer les modifications' : '+ Ajouter le Client'}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={() => { setEditingId(null); setRaisonSociale(''); setTelephone(''); setAdresse(''); setMatriculeFiscal(''); }}
                  style={{ padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="🔍 Rechercher un client par nom ou téléphone..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'white', fontSize: '1rem', backdropFilter: 'blur(10px)' }}
          />
        </div>

        <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '1rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Liste des Clients</h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Chargement...</div>
          ) : error ? (
            <div style={{ color: '#ef4444' }}>Erreur: {error}</div>
          ) : filteredClients.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>Aucun client trouvé.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem' }}>Client</th>
                    <th style={{ padding: '1rem' }}>M.F. (Fiscal)</th>
                    <th style={{ padding: '1rem' }}>Téléphone</th>
                    <th style={{ padding: '1rem' }}>Solde</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{client.raison_sociale}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '12px' }}>{client.matricule_fiscal || '-'}</td>
                      <td style={{ padding: '1rem' }}>{client.telephone || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: client.solde_actuel < 0 ? '#ef4444' : '#10b981' }}>
                        {client.solde_actuel?.toFixed(3) || '0.000'} TND
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleEdit(client)}
                          style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
