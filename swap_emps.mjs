import { getPayload } from 'payload';
import config from './src/payload.config';

async function swapEmplacements() {
  const payload = await getPayload({ config });

  // 1. Get current emplacements
  const emps = await payload.find({
    collection: 'emplacements',
  });

  const depot = emps.docs.find(e => e.id === 1);
  const magasin = emps.docs.find(e => e.id === 2);

  if (depot && magasin) {
    console.log('Swapping names and types...');
    
    // Use a temp name for safety
    await payload.update({
      collection: 'emplacements',
      id: 1,
      data: { nom_emplacement: 'Magasin Vente', type_emplacement: 'Magasin' }
    });

    await payload.update({
      collection: 'emplacements',
      id: 2,
      data: { nom_emplacement: 'Dépôt Principal', type_emplacement: 'Depot' }
    });

    console.log('Swap complete!');
  } else {
    console.log('Emplacements not found with IDs 1 and 2.');
  }

  process.exit(0);
}

swapEmplacements();
