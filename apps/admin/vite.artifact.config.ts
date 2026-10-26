import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Build for a claude.ai Artifact page: React comes from cdnjs as UMD globals and Three.js from
// jsDelivr through an import map, so the page itself only carries the app's own code.
const SHIMS: Record<string, string> = {
  react:
    'const R = window.React; export default R; export const { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment } = R;',
  'react/jsx-runtime':
    'const R = window.React; const jsx = (type, props, key) => R.createElement(type, key === undefined ? props : { ...props, key }); export { jsx, jsx as jsxs }; export const Fragment = R.Fragment;',
  'react-dom/client': 'export const { createRoot } = window.ReactDOM;',
  'react-dom': 'export const { createPortal } = window.ReactDOM;',
};

function reactFromGlobals(): Plugin {
  return {
    name: 'react-from-globals',
    enforce: 'pre',
    resolveId: (id) => (id in SHIMS ? `\0shim:${id}` : null),
    load: (id) => (id.startsWith('\0shim:') ? SHIMS[id.slice('\0shim:'.length)] : null),
  };
}

export default defineConfig({
  plugins: [reactFromGlobals(), react()],
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    // Readable output: the published page is reviewed in full before it goes out.
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: {
      external: ['three', /^three\/addons\//],
    },
  },
});
