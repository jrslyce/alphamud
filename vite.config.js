import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

let commitHash = 'unknown'
let commitCount = '0'

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  commitCount = execSync('git rev-list --count HEAD').toString().trim()
} catch (e) {
  console.log('Failed to fetch git commit info')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_COUNT__: JSON.stringify(commitCount),
  }
})
