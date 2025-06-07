import { defineConfig } from 'vitepress'
import sidebar from './sidebar.js'

export default defineConfig({
  base: '/fAIr/',
  title: 'fAIr Documentation',
  themeConfig: {
    sidebar
  }
})