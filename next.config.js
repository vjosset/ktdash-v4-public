/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['dev.ktdash.app', 'node304', 'node304:7000'],
  
  async rewrites() {
    return [
      // Roster page pretty tab paths → same page with a tab query (your current code already reads it)
      {
        source: '/rosters/:id/:tab(operatives|equipment|ploys|ops|gallery)',
        destination: '/rosters/:id?tab=:tab',
      },
      
      // Killteam page pretty tab paths
      {
        source: '/killteams/:id/:tab(operatives|composition|equipment|ploys|tacops|rosters)',
        destination: '/killteams/:id?tab=:tab'
      },
    
    ]
  },
}

module.exports = nextConfig
