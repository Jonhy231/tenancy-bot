#!/usr/bin/env node
/**
 * build.mjs — Script de build para Railway
 * Instala dependencias del cliente React y genera el bundle de producción
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDir = path.join(__dirname, 'src', 'dashboard', 'client')

console.log('🔨 Tenancy — Build iniciado')
console.log(`📁 Client dir: ${clientDir}`)

if (!fs.existsSync(clientDir)) {
  console.error('❌ No se encontró src/dashboard/client/')
  process.exit(1)
}

const run = (cmd, cwd) => {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

try {
  run('npm install --legacy-peer-deps', clientDir)
  run('npm run build', clientDir)
  console.log('\n✅ Build completado — React app lista en src/dashboard/dist/')
} catch (err) {
  console.error('❌ Error en el build:', err.message)
  process.exit(1)
}
