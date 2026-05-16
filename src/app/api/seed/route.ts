import { getPayload } from 'payload';
import config from '@/payload.config';
import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const payload = await getPayload({ config });

    // 1. Get existing products to avoid duplicates
    const existing = await payload.find({ collection: 'produits', limit: 1000 });
    const existingNames = new Set(existing.docs.map(p => p.nom_produit.toLowerCase()));

    // 2. Categories
    const cats = await payload.find({ collection: 'categories' });
    const catMap: any = {};
    cats.docs.forEach(c => catMap[c.nom_categorie.toLowerCase()] = c.id);

    // 3. Import
    let count = 0;
    for (const item of DEFAULT_PRODUCTS) {
      if (existingNames.has(item.name_fr.toLowerCase())) continue;

      let cid = catMap[item.category.toLowerCase()];
      if (!cid) {
        const nc = await payload.create({ collection: 'categories', data: { nom_categorie: item.category } });
        cid = nc.id;
        catMap[item.category.toLowerCase()] = cid;
      }

      await payload.create({
        collection: 'produits',
        data: {
          nom_produit: item.name_fr,
          nom_produit_ar: item.name_ar,
          nom_produit_derja: item.name_derja,
          categorie_id: cid,
          prix_vente_gros: item.price,
          unite_mesure: item.saleType === 'weight' ? 'Kg' : 'Piece',
          date_prix: new Date().toISOString()
        }
      });
      count++;
    }

    // 4. Emplacements
    const emps = await payload.find({ collection: 'emplacements' });
    if (emps.totalDocs === 0) {
      await payload.create({ collection: 'emplacements', data: { nom_emplacement: 'Dépot Principal', type_emplacement: 'Depot' } });
      await payload.create({ collection: 'emplacements', data: { nom_emplacement: 'Magasin Vente', type_emplacement: 'Magasin' } });
    }

    const bls = await payload.find({ collection: 'bons_de_livraison' });
    
    console.log('--- STATUS CHECK COMPLETED ---');
    return NextResponse.json({ 
      success: true, 
      stats: {
        products: existing.totalDocs,
        bls: bls.totalDocs,
      }
    });
  } catch (e: any) {
    console.error('--- IMPORT FAILED ---', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
