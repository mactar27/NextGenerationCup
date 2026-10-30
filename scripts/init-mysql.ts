// scripts/init-mysql.ts
import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'

async function init() {
  const host = process.env.MYSQL_HOST || 'localhost'
  const port = Number(process.env.MYSQL_PORT) || 3306
  const user = process.env.MYSQL_USER || 'root'
  const password = process.env.MYSQL_PASSWORD || 'M@tzo2705'
  const database = process.env.MYSQL_DATABASE || 'tournoi_football_2026'

  console.log(`Tentative de connexion à MySQL sur ${host}:${port} avec l'utilisateur ${user}...`)

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    })

    console.log('Connexion établie avec succès !')
    console.log(`Initialisation de la base de données "${database}" et des tables...`)

    const sqlScriptPath = path.join(process.cwd(), 'scripts', 'schema-mysql.sql')
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8')

    await connection.query(sqlScript)
    console.log('✅ Base de données et tables MySQL créées avec succès !')

    await connection.end()
  } catch (err: any) {
    console.error('❌ Erreur de connexion MySQL :', err.message)
    console.error(`Code d'erreur : ${err.code}`)
    process.exit(1)
  }
}

init()
