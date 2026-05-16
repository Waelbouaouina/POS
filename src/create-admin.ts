import { getPayload } from 'payload'
import config from './payload.config.js'

async function createAdmin() {
  process.env.DATABASE_URI = process.env.DATABASE_URI || 'file:./payload.db'
  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'saad-erp-dev-secret'

  const payload = await getPayload({ config })
  const email = 'Bouaouina.Wael@esprit.tn'.toLowerCase()
  const password = 'Sinofffa_98!'

  try {
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email }
      }
    })

    if (users.totalDocs > 0) {
      await payload.update({
        collection: 'users',
        id: users.docs[0].id,
        data: {
          password: password,
          loginAttempts: 0,
          lockUntil: null,
        },
      })
      console.log('✅ Mot de passe mis à jour et utilisateur déverrouillé pour:', email)
    } else {
      await payload.create({
        collection: 'users',
        data: {
          email: email,
          password: password,
        },
      })
      console.log('✅ Super-Admin créé avec succès:', email)
    }
  } catch (error: any) {
    console.error('❌ Erreur:', JSON.stringify(error.data || error.message))
  }
  process.exit(0)
}

createAdmin()
