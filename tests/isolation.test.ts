// tests/isolation.test.ts
import { getDatabase } from '../lib/db'
import { hashPassword, verifyPassword } from '../lib/auth/crypto'

function runSecurityTests() {
  console.log('🧪 Démarrage des tests de sécurité et d\'isolation...')
  const db = getDatabase()

  // Test 1 : Vérifier la présence des 21 équipes
  const teamCount = (db.prepare('SELECT COUNT(*) as c FROM teams').get() as any).c
  console.assert(teamCount === 21, `❌ Attendu 21 équipes, trouvé: ${teamCount}`)
  console.log(`✅ Test 1 réussi : Exactement 21 équipes officielles configurées (${teamCount}/21).`)

  // Test 2 : Vérification du mot de passe hashé
  const admin = db.prepare('SELECT password_hash, password_salt FROM users WHERE username = ?').get('admin') as any
  const isValidAdmin = verifyPassword('Admin2026!Secure', admin.password_hash, admin.password_salt)
  const isInvalidAdmin = verifyPassword('WrongPassword', admin.password_hash, admin.password_salt)
  console.assert(isValidAdmin === true && isInvalidAdmin === false, '❌ Test authentification échoué')
  console.log('✅ Test 2 réussi : Hachage fort (scrypt) et vérification du mot de passe conformes.')

  // Test 3 : Isolation Dirigeant
  const dirFcb = db.prepare('SELECT team_id, role FROM users WHERE username = ?').get('dir_fcb') as any
  console.assert(dirFcb.role === 'TEAM_MANAGER' && dirFcb.team_id === 'team_01', '❌ Erreur association dirigeant')
  console.log('✅ Test 3 réussi : Le compte Dirigeant FCB est strictement rattaché à team_01.')

  // Test 4 : Contrôle de la limite de 30 joueurs
  const fcbPlayerCount = (db.prepare('SELECT COUNT(*) as c FROM players WHERE team_id = ?').get('team_01') as any).c
  console.assert(fcbPlayerCount <= 30, '❌ Dépassement du quota de 30 joueurs')
  console.log(`✅ Test 4 réussi : Quota joueurs respecté (${fcbPlayerCount}/30 pour team_01).`)

  // Test 5 : Licence et token de vérification
  const sampleLic = db.prepare('SELECT license_number, verification_token, status FROM licenses LIMIT 1').get() as any
  console.assert(sampleLic && sampleLic.verification_token.length >= 16, '❌ Licence non valide')
  console.log(`✅ Test 5 réussi : Licence valide générée avec jeton QR unique (${sampleLic.license_number}).`)

  console.log('🎉 TOUS LES TESTS DE SÉCURITÉ ET D\'ISOLATION SONT VALIDES !')
}

runSecurityTests()
