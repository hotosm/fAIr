export default {
  '/': [
    { text: 'Home', link: '/' },
    { text: 'About', link: '/About' },
    {
      text: 'Installation',
      items: [
        { text: 'Docker (Linux/Mac)', link: '/Docker-installation' },
        { text: 'Docker (Windows)', link: '/Docker-install-windows' }
      ]
    },
    { text: 'User Manual', link: '/User-Manual-for-fAIr' },
    { text: 'FAQ', link: '/FAQ' },
    { text: 'Release Process', link: '/Release' },
    { text: 'Code of Conduct', link: '/Code-of-Conduct' },
    { text: 'Contributing Guide', link: '/contributing' },
    {
      text: 'Architecture',
      items: [
        { text: 'Overview', link: '/architecture' },
        { text: 'ADR: Bundler', link: '/architecture/adr-choose-bundler/adr1' },
        { text: 'ADR: Drawing Library', link: '/architecture/adr-choose-drawing-library/adr2' }
      ]
    }
  ]
}