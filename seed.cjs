const { getPayload } = require('payload');
const config = require('./src/payload.config').default;
const fs = require('fs');

async function run() {
  try {
    const payload = await getPayload({ config });
    const data = JSON.parse(fs.readFileSync('C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\b6519cfa-05dd-4f30-b67c-7cbc4c554266\\scratch\\products_import.json', 'utf8'));

    console.log('Clearing existing products...');
    const existingProds = await payload.find({ collection: 'produits', limit: 1000 });
    for (const p of existingProds.docs) {
      await payload.delete({ collection: 'produits', id: p.id });
    }

    const cats = {};
    const existingCats = await payload.find({ collection: 'categories' });
    existingCats.docs.forEach(c => cats[c.nom_categorie.toLowerCase()] = c.id);

    console.log('Importing products...');
    for (const item of data) {
      let catId = cats[item.category.toLowerCase()];
      if (!catId) {
        const newCat = await payload.create({ collection: 'categories', data: { nom_categorie: item.category } });
        catId = newCat.id;
        cats[item.category.toLowerCase()] = catId;
      }
      await payload.create({ collection: 'produits', data: { 
        nom_produit: item.name_fr, 
        nom_produit_ar: item.name_ar, 
        nom_produit_derja: item.name_derja, 
        categorie_id: catId, 
        prix_vente_gros: item.average_wholesale_price_dt, 
        unite_mesure: item.saleType === 'weight' ? 'Kg' : 'Piece', 
        date_prix: new Date().toISOString() 
      } });
    }

    // Also initialize emplacements
    console.log('Checking emplacements...');
    const emps = await payload.find({ collection: 'emplacements' });
    if (emps.totalDocs === 0) {
      await payload.create({ collection: 'emplacements', data: { nom_emplacement: 'Dépot Principal', type_emplacement: 'Depot' } });
      await payload.create({ collection: 'emplacements', data: { nom_emplacement: 'Magasin Vente', type_emplacement: 'Magasin' } });
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

run();
