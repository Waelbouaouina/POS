async function swap() {
  try {
    console.log('Swapping Emplacement 1 to Magasin...');
    const res1 = await fetch('http://localhost:3000/api/emplacements/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_emplacement: 'Magasin Vente', type_emplacement: 'Magasin' })
    });
    console.log('Res 1:', res1.status);

    console.log('Swapping Emplacement 2 to Depot...');
    const res2 = await fetch('http://localhost:3000/api/emplacements/2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom_emplacement: 'Dépôt Principal', type_emplacement: 'Depot' })
    });
    console.log('Res 2:', res2.status);
    
    console.log('DONE.');
  } catch (e) {
    console.error(e);
  }
}

swap();
