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
console.log(`🟢 Node version: ${process.version}`)

if (!fs.existsSync(clientDir)) {
  console.error('❌ No se encontró src/dashboard/client/')
  process.exit(1)
}

const run = (cmd, cwd) => {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

try {
  // Limpiar node_modules del cliente si hay restos corruptos
  const clientModules = path.join(clientDir, 'node_modules')
  if (fs.existsSync(clientModules)) {
    console.log('🧹 Limpiando node_modules del cliente...')
    fs.rmSync(clientModules, { recursive: true, force: true })
  }

  // Instalar dependencias (sin flags que puedan saltarse devDependencies)
  run('npm install', clientDir)

  // Build de producción
  run('npm run build', clientDir)

  // Verificar que el dist se generó
  const distDir = path.join(clientDir, '..', 'dist')
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html no fue generado')
  }

  console.log('\n✅ Build completado — React app lista en src/dashboard/dist/')
} catch (err) {
  console.error('❌ Error en el build:', err.message)
  process.exit(1)
}
