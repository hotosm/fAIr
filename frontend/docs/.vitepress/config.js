import { defineConfig } from 'vitepress'
import sidebar from './sidebar.js'

export default defineConfig({
  title: 'fAIr Documentation',
  themeConfig: {
    sidebar
  }
})