import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "fAIr",
  description: "AI-powered assistant that amplify your mapping efforts intelligently and quickly, helping you map smarter and faster.",
  ignoreDeadLinks: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/getting-started' }
    ],

    sidebar: [
      {
        text: 'fAIr Documentation',
        items: [
          {
            text: 'Introduction', items: [
              { text: 'Getting Started', link: '/getting-started' },
              { text: 'Dependencies', link: '/dependencies' },
            ]
          },
          {
            text: 'Architecture Decision Records',
            link: '/architecture/README.md',
            items: [
              {
                text: 'Web Framework', items: [
                  { text: 'ADR1', link: '/architecture/adr-choose-web-framework/adr1.md' },
                  { text: 'ADR2', link: '/architecture/adr-choose-web-framework/adr2.md' },

                ]
              },
              {
                text: 'Styling Library', items: [
                  { text: 'ADR1', link: '/architecture/adr-choose-styling-library/adr1.md' },
                  { text: 'ADR2', link: '/architecture/adr-choose-styling-library/adr2.md' },
                  { text: 'ADR3', link: '/architecture/adr-choose-styling-library/adr3.md' },
                ]
              },
              {
                text: 'Webmap Library', items: [
                  { text: 'ADR1', link: '/architecture/adr-choose-webmap-library/adr1.md' },
                  { text: 'ADR2', link: '/architecture/adr-choose-webmap-library/adr2.md' },
                ]
              },
              {
                text: 'Drawing Library', items: [
                  { text: 'ADR1', link: '/architecture/adr-choose-drawing-library/adr1.md' },
                  { text: 'ADR2', link: '/architecture/adr-choose-drawing-library/adr2.md' },
                ]
              },
              { text: 'Package Manager', link: '/architecture/adr-choose-package-manager/adr1.md' },
              { text: 'Programming Language', link: '/architecture/adr-choose-language/adr1.md' },
              { text: 'Bundler', link: '/architecture/adr-choose-bundler/adr1.md' },
              { text: 'Testing Library', link: '/architecture/adr-choose-testing-library/adr1.md' }
            ]
          },

        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hotosm/fair' }
    ]
  }
})
