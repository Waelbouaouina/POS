import { getPayload } from 'payload';
import config from '@payload-config';

export async function GET() {
  const payload = await getPayload({ config });
  const email = 'bouaouina.wael@esprit.tn';
  const password = 'Sinofffa_98!';

  try {
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
      },
    });

    if (users.totalDocs > 0) {
      await payload.update({
        collection: 'users',
        id: users.docs[0].id,
        data: {
          password: password,
          loginAttempts: 0,
          lockUntil: null,
        },
      });
      return Response.json({ message: 'User updated and unlocked.' });
    } else {
      await payload.create({
        collection: 'users',
        data: {
          email: email,
          password: password,
        },
      });
      return Response.json({ message: 'User created.' });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
