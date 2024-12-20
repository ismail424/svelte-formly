import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  },
  preprocess: preprocess(),
  package: {
    dir: 'package',
    emitTypes: true,
    // Ensure components are included
    files: (filepath) => {
      return !filepath.includes('/node_modules/') && 
             !filepath.includes('/__tests__/') &&
             !filepath.endsWith('.test.ts') &&
             !filepath.endsWith('.spec.ts');
    }
  }
};

export default config;