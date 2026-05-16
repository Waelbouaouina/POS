import { getPayload } from 'payload';
import config from './payload.config';

export async function GET(req: Request) {
  const payload = await getPayload({ config });
  
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

  return Response.json({ success: true });
}
