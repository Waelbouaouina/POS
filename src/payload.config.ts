import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { CollectionAfterChangeHook } from 'payload/types';

// ==========================================
// BUSINESS LOGIC HOOKS (POULTRY STOCK RULES)
// ==========================================

/**
 * Helper to securely increment or decrement stock in an atomic-like fashion
 * Supports decimals for 'Kg' unit of measures.
 */
const updateStock = async (payload: any, produitId: string, emplacementId: string, quantiteChangement: number) => {
  // 1. Find existing stock record for this Product + Location combination
  const stockResult = await payload.find({
    collection: 'stocks',
    where: {
      and: [
        { produit_id: { equals: produitId } },
        { emplacement_id: { equals: emplacementId } },
      ],
    },
  });

  if (stockResult.totalDocs > 0) {
    // 2. Update existing stock (adding or subtracting based on quantiteChangement)
    const stock = stockResult.docs[0];
    const newQuantity = Number(stock.quantite_disponible) + Number(quantiteChangement);
    
    await payload.update({
      collection: 'stocks',
      id: stock.id,
      data: {
        quantite_disponible: parseFloat(newQuantity.toFixed(3)), // Handle float precision for Kg
      },
    });
  } else {
    // 3. Create new stock record if it doesn't exist
    await payload.create({
      collection: 'stocks',
      data: {
        produit_id: produitId,
        emplacement_id: emplacementId,
        quantite_disponible: parseFloat(Number(quantiteChangement).toFixed(3)),
      },
    });
  }
};

/**
 * Hook: Automate stock for "Entrée Initiale" and "Transfert"
 */
const handleStockMovement: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create') {
    const qty = Number(doc.quantite_mouvement);
    const produitId = typeof doc.produit_id === 'object' ? doc.produit_id.id : doc.produit_id;
    
    // Scenario 1: Stock Entry (Entrée Fournisseur) -> Increment Destination (Dépot)
    if (doc.type_mouvement === 'Entree_Initiale' && doc.emplacement_destination_id) {
      const destId = typeof doc.emplacement_destination_id === 'object' ? doc.emplacement_destination_id.id : doc.emplacement_destination_id;
      await updateStock(req.payload, produitId, destId, qty);
    }
    
    // Scenario 2: Internal Transfer (Dépot to Magasin) -> Decrement Source, Increment Dest
    if (doc.type_mouvement === 'Transfert' && doc.emplacement_source_id && doc.emplacement_destination_id) {
      const sourceId = typeof doc.emplacement_source_id === 'object' ? doc.emplacement_source_id.id : doc.emplacement_source_id;
      const destId = typeof doc.emplacement_destination_id === 'object' ? doc.emplacement_destination_id.id : doc.emplacement_destination_id;
      
      await updateStock(req.payload, produitId, sourceId, -qty); // Decrement source
      await updateStock(req.payload, produitId, destId, qty);    // Increment destination
    }
  }
  return doc;
};

/**
 * Hook: Automate stock deduction upon BL Sale creation
 */
const handleBLStock: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create' && doc.type_document === 'Vente') {
    // Fetch the ID for "Magasin" dynamically to apply the sale deduction
    const magasinResult = await req.payload.find({
      collection: 'emplacements',
      where: { type_emplacement: { equals: 'Vente' } }, // Looks up the store
    });
    
    if (magasinResult.totalDocs > 0) {
      const magasinId = magasinResult.docs[0].id;
      
      // Iterate through the array of items on the BL and decrement Magasin stock
      if (doc.lignes && doc.lignes.length > 0) {
        for (const ligne of doc.lignes) {
          const produitId = typeof ligne.produit_id === 'object' ? ligne.produit_id.id : ligne.produit_id;
          const qty = Number(ligne.quantite);
          await updateStock(req.payload, produitId, magasinId, -qty);
        }
      }
    }
  }
  return doc;
};

// ==========================================
// MAIN CONFIGURATION
// ==========================================

export default buildConfig({
  admin: {
    user: 'users',
  },
  // ELECTRON & DESKTOP READY CORS SETTINGS
  cors: '*', // Allow all origins for the Electron desktop client (file://, localhost, etc.)
  csrf: ['http://localhost', 'capacitor://localhost', 'file://'], // Protect CSRF while permitting desktop schemes
  
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'tiers',
      labels: { singular: 'Tier', plural: 'Tiers' },
      fields: [
        {
          name: 'type_tier',
          type: 'select',
          options: [
            { label: 'Client', value: 'Client' },
            { label: 'Fournisseur', value: 'Fournisseur' },
          ],
          required: true,
        },
        { name: 'raison_sociale', type: 'text', required: true },
        { name: 'telephone', type: 'text' },
        { name: 'adresse', type: 'textarea' },
        { name: 'matricule_fiscal', type: 'text' },
        { name: 'solde_actuel', type: 'number', defaultValue: 0 },
      ],
    },
    {
      slug: 'categories',
      labels: { singular: 'Catégorie', plural: 'Catégories' },
      fields: [
        { name: 'nom_categorie', type: 'text', required: true },
      ],
    },
    {
      slug: 'produits',
      labels: { singular: 'Produit', plural: 'Produits' },
      fields: [
        { name: 'nom_produit', type: 'text', required: true },
        { name: 'categorie_id', type: 'relationship', relationTo: 'categories' },
        { name: 'prix_achat', type: 'number' },
        { name: 'prix_vente_gros', type: 'number' },
        { name: 'prix_vente_detail', type: 'number' },
        {
          name: 'unite_mesure',
          type: 'select',
          options: [
            { label: 'Kg', value: 'Kg' },
            { label: 'Piece', value: 'Piece' },
          ],
        },
      ],
    },
    {
      slug: 'emplacements',
      labels: { singular: 'Emplacement', plural: 'Emplacements' },
      fields: [
        { name: 'nom_emplacement', type: 'text', required: true },
        {
          name: 'type_emplacement',
          type: 'select',
          options: [
            { label: 'Stockage', value: 'Stockage' }, // Example: "Dépot Principal"
            { label: 'Vente', value: 'Vente' },       // Example: "Magasin"
          ],
        },
      ],
    },
    {
      slug: 'stocks',
      labels: { singular: 'Stock', plural: 'Stocks' },
      fields: [
        { name: 'produit_id', type: 'relationship', relationTo: 'produits', required: true },
        { name: 'emplacement_id', type: 'relationship', relationTo: 'emplacements', required: true },
        { name: 'quantite_disponible', type: 'number', required: true, defaultValue: 0 },
      ],
    },
    {
      slug: 'mouvements_stock',
      labels: { singular: 'Mouvement de Stock', plural: 'Mouvements de Stock' },
      hooks: {
        afterChange: [handleStockMovement], // Attach the automated stock movement hook
      },
      fields: [
        {
          name: 'type_mouvement',
          type: 'select',
          options: [
            { label: 'Entrée Initiale', value: 'Entree_Initiale' },
            { label: 'Transfert', value: 'Transfert' },
          ],
          required: true,
        },
        { name: 'produit_id', type: 'relationship', relationTo: 'produits', required: true },
        { name: 'emplacement_source_id', type: 'relationship', relationTo: 'emplacements' },
        { name: 'emplacement_destination_id', type: 'relationship', relationTo: 'emplacements', required: true },
        { name: 'quantite_mouvement', type: 'number', required: true },
        { name: 'date_mouvement', type: 'date', required: true },
      ],
    },
    {
      slug: 'bons_de_livraison',
      labels: { singular: 'Bon de Livraison', plural: 'Bons de Livraison' },
      hooks: {
        afterChange: [handleBLStock], // Attach the sale deduction hook
      },
      fields: [
        { name: 'numero_bl', type: 'text', required: true },
        { name: 'tier_id', type: 'relationship', relationTo: 'tiers', required: true },
        {
          name: 'type_document',
          type: 'select',
          options: [
            { label: 'Achat', value: 'Achat' },
            { label: 'Vente', value: 'Vente' },
          ],
          required: true,
        },
        {
          name: 'statut',
          type: 'select',
          options: [
            { label: 'Brouillon', value: 'Brouillon' },
            { label: 'Livré', value: 'Livre' },
            { label: 'Facturé', value: 'Facture' },
          ],
          defaultValue: 'Brouillon',
        },
        { name: 'montant_total_bl', type: 'number' },
        { name: 'date_creation', type: 'date' },
        // REFACTOR: Use array for lines to handle creation atomically in one hook
        {
          name: 'lignes',
          type: 'array',
          fields: [
            { name: 'produit_id', type: 'relationship', relationTo: 'produits', required: true },
            { name: 'quantite', type: 'number', required: true },
            { name: 'prix_unitaire', type: 'number', required: true },
            { name: 'sous_total', type: 'number' },
          ],
        },
      ],
    },
    {
      slug: 'factures_blf',
      labels: { singular: 'Facture BLF', plural: 'Factures BLF' },
      fields: [
        { name: 'numero_blf', type: 'text', required: true },
        { name: 'tier_id', type: 'relationship', relationTo: 'tiers', required: true },
        {
          name: 'statut_paiement',
          type: 'select',
          options: [
            { label: 'Non Payé', value: 'Non_Paye' },
            { label: 'Partiel', value: 'Partiel' },
            { label: 'Payé', value: 'Paye' },
          ],
          defaultValue: 'Non_Paye',
        },
        { name: 'montant_total_facture', type: 'number' },
        { name: 'date_facturation', type: 'date' },
        { name: 'bls', type: 'relationship', relationTo: 'bons_de_livraison', hasMany: true },
      ],
    },
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:5432/poultry_erp',
    },
  }),
});
