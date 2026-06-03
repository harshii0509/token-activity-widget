import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { getSampleDefinition, sampleDefinitions } from './data/samples'

function mockWidgetApi(): Plugin {
  const prefix = '/api/public-widget/'

  function tryHandle(url: string | undefined, res: NodeJS.WritableStream & { setHeader(name: string, value: string): void; statusCode: number }) {
    if (!url || !url.startsWith(prefix)) return false

    const publicId = decodeURIComponent(url.slice(prefix.length).split('?')[0] ?? '')
    const sample = getSampleDefinition(publicId)

    res.setHeader('Content-Type', 'application/json')

    if (!sample) {
      res.statusCode = 404
      res.write(
        JSON.stringify({
          error: `Unknown public id "${publicId}". Try one of: ${sampleDefinitions.map((item) => item.id).join(', ')}`,
        }),
      )
      res.end()
      return true
    }

    res.statusCode = 200
    res.write(JSON.stringify(sample.data))
    res.end()
    return true
  }

  return {
    name: 'mock-widget-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (tryHandle(req.url, res)) return
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (tryHandle(req.url, res)) return
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockWidgetApi()],
  server: {
    port: 4177,
  },
  preview: {
    port: 4178,
  },
})
