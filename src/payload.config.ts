import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import type { CollectionAfterChangeHook } from 'payload';

// ==========================================
// BUSINESS LOGIC HOOKS (POULTRY STOCK RULES)
// ==========================================

/**
 * Helper to securely increment or decrement stock in an atomic-like fashion
 * Supports decimals for 'Kg' unit of measures.
 */
const updateStock = async (payload: any, produitId: string | number, emplacementId: string | number, quantiteChangement: number) => {
  const pid = isNaN(Number(produitId)) ? produitId : Number(produitId);
  const eid = isNaN(Number(emplacementId)) ? emplacementId : Number(emplacementId);

  // 1. Find existing stock record for this Product + Location combination
  const stockResult = await payload.find({
    collection: 'stocks',
    where: {
      and: [
        { produit_id: { equals: pid } },
        { emplacement_id: { equals: eid } },
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
        produit_id: pid,
        emplacement_id: eid,
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
    const num = String(doc.numero_bl || '');
    console.log('--- CRITICAL STOCK HOOK ---');
    console.log('BL Number:', num);

    // DETERMINATION FORCEE
    let targetType = 'Magasin';
    if (num.toUpperCase().includes('DEPOT')) {
       targetType = 'Depot';
       console.log('FORCE DETECTED: DEPOT');
    } else {
       console.log('DEFAULT: MAGASIN');
    }

    // GET LOCATION ID
    const emps = await req.payload.find({
      collection: 'emplacements',
      where: { type_emplacement: { equals: targetType } }
    });

    if (emps.totalDocs > 0) {
      const locId = emps.docs[0].id;
      console.log(`Using Location ID ${locId} (${targetType})`);

      for (const ligne of (doc.lignes || [])) {
        const pId = typeof ligne.produit_id === 'object' ? ligne.produit_id.id : ligne.produit_id;
        const q = Number(ligne.quantite);
        console.log(`Update Product ${pId}: -${q} at Location ${locId}`);
        await updateStock(req.payload, pId, locId, -q);
      }
    } else {
      console.log('ERROR: Location type not found in DB:', targetType);
    }
    console.log('--- END CRITICAL HOOK ---');
  }
  return doc;
};

/**
 * Hook: Log price changes to Price History collection
 */
const handlePriceHistory: CollectionAfterChangeHook = async ({ doc, req, previousDoc, operation }) => {
  // Only log if it's an update and prices have actually changed
  if (operation === 'update') {
    const pricesChanged = 
      doc.prix_achat !== previousDoc.prix_achat ||
      doc.prix_vente_gros !== previousDoc.prix_vente_gros ||
      doc.prix_vente_detail !== previousDoc.prix_vente_detail;

    if (pricesChanged) {
      await req.payload.create({
        collection: 'historique_prix',
        data: {
          produit_id: doc.id,
          prix_achat: doc.prix_achat,
          prix_vente_gros: doc.prix_vente_gros,
          prix_vente_detail: doc.prix_vente_detail,
          date_historique: new Date().toISOString(),
        },
      });
    }
  }
  return doc;
};

// ==========================================
// MAIN CONFIGURATION
// ==========================================

export default buildConfig({
  // ── Required by Payload 3.x ──
  secret: process.env.PAYLOAD_SECRET || 'saad-erp-dev-secret',
  editor: lexicalEditor({}),

  admin: {
    user: 'users',
  },

  // ELECTRON & DESKTOP READY CORS SETTINGS
  cors: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
  csrf: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost', 'capacitor://localhost', 'file://'],

  // Disable GraphQL to reduce surface (REST API only)
  graphQL: { disable: true },


  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    {
      slug: 'tiers',
      labels: { singular: 'Tier', plural: 'Tiers' },
      access: { read: () => true, create: () => true, update: () => true, delete: () => true },
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
      access: { read: () => true, create: () => true },
      fields: [
        { name: 'nom_categorie', type: 'text', required: true },
      ],
    },
    {
      slug: 'produits',
      labels: { singular: 'Produit', plural: 'Produits' },
      access: { read: () => true, create: () => true, update: () => true, delete: () => true },
      fields: [
        { name: 'nom_produit', type: 'text', required: true },
        { name: 'nom_produit_ar', type: 'text' },
        { name: 'nom_produit_derja', type: 'text' },
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
        { name: 'date_prix', type: 'date', defaultValue: () => new Date().toISOString() },
      ],
      hooks: {
        afterChange: [handlePriceHistory],
      },
    },
    {
      slug: 'emplacements',
      labels: { singular: 'Emplacement', plural: 'Emplacements' },
      access: { read: () => true, create: () => true },
      fields: [
        { name: 'nom_emplacement', type: 'text', required: true },
        {
          name: 'type_emplacement',
          type: 'select',
          options: [
            { label: 'Dépot', value: 'Depot' },
            { label: 'Magasin', value: 'Magasin' },
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
      access: { read: () => true, create: () => true, update: () => true },
    },
    {
      slug: 'mouvements_stock',
      labels: { singular: 'Mouvement de Stock', plural: 'Mouvements de Stock' },
      access: { read: () => true, create: () => true },
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
      access: { create: () => true, read: () => true, update: () => true, delete: () => true },
      hooks: {
        afterChange: [handleBLStock], // Attach the sale deduction hook
      },
      fields: [
        { name: 'numero_bl', type: 'text', required: true },
        { name: 'tier_id', type: 'relationship', relationTo: 'tiers', required: true },
        {
          name: 'source_emplacement',
          type: 'select',
          options: [
            { label: 'Dépot', value: 'Depot' },
            { label: 'Magasin', value: 'Magasin' },
          ],
          defaultValue: 'Magasin',
          admin: { description: 'Emplacement d\'où la marchandise est prélevée' }
        },
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
    {
      slug: 'historique_prix',
      labels: { singular: 'Historique de Prix', plural: 'Historiques de Prix' },
      access: { read: () => true },
      fields: [
        { name: 'produit_id', type: 'relationship', relationTo: 'produits', required: true },
        { name: 'prix_achat', type: 'number' },
        { name: 'prix_vente_gros', type: 'number' },
        { name: 'prix_vente_detail', type: 'number' },
        { name: 'date_historique', type: 'date', required: true },
      ],
    },

    // ── Media Library: stores generated PDFs (BL / BLF) ──
    {
      slug: 'media',
      labels: { singular: 'Fichier', plural: 'Fichiers' },
      upload: {
        staticDir: 'media',
        mimeTypes: ['application/pdf', 'image/*'],
      },
      fields: [
        { name: 'alt', type: 'text' },
      ],
    },
  ],

  db: sqliteAdapter({
    client: {
      url: 'file:C:/Users/ASUS/OneDrive - Wael Bouaouina/Bureau/ln 2/backend/payload.db',
    },
  }),
});
