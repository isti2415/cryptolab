/// <reference types="vite/client" />

/**
 * `import code from './engine.ts?code'`: the file's source with comments
 * stripped, produced at build time by plugins/stripComments.ts.
 */
declare module '*?code' {
  const code: {
    source: string;
    path: string;
  };
  export default code;
}
