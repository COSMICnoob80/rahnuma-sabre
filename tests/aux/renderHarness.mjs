// Screen render harness.
//
// The suite was 100% pure-function tests, which is exactly how a broken
// Dashboard card shipped green. This file makes a real screen renderable in
// Node: source .tsx is transpiled with sucrase, react-native maps to
// react-native-web, expo-sqlite maps to Node's built-in SQLite, and the two
// native-only modules the screens touch get small stubs.
//
// Import this module FIRST in a test file. It sets NODE_ENV=test before React
// is loaded so react-test-renderer mounts synchronously and updates flush.

import { registerHooks } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

process.env.NODE_ENV = 'test';
// react-test-renderer only mounts synchronously when React believes it is in a
// test environment; without this flag create() is deferred and toJSON() is null.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Anchored to the project root so the harness resolves the app's dependencies
// even when imported from a test runner started elsewhere.
const require = createRequire(new URL('../../package.json', import.meta.url));
const { transform } = require('sucrase');

const ROOT = new URL('../../', import.meta.url);
const TEST_AUX = new URL('./', import.meta.url);

const STUBS = {
  '@react-navigation/native': new URL('navStub.cjs', TEST_AUX).href,
  '@expo-google-fonts/inter': new URL('fontsStub.cjs', TEST_AUX).href,
  'expo-sqlite': new URL('sqliteStub.cjs', TEST_AUX).href,
};

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isSourceFile(url) {
  return url.startsWith('file:') && /\/src\/.*\.(tsx?|jsx?)$/.test(url);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react-native') return nextResolve('react-native-web', context);
    if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true };

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const relative = specifier.startsWith('.') || specifier.startsWith('/');
      if (!relative || !context.parentURL) throw error;

      const base = new URL(specifier, context.parentURL);
      for (const ext of EXTENSIONS) {
        const candidate = fileURLToPath(base.href + ext);
        if (isFile(candidate)) {
          return { url: base.href + ext, shortCircuit: true };
        }
      }
      throw error;
    }
  },

  load(url, context, nextLoad) {
    if (isSourceFile(url)) {
      const code = readFileSync(fileURLToPath(url), 'utf8');
      const { code: compiled } = transform(code, {
        transforms: ['typescript', 'jsx', 'imports'],
        jsxRuntime: 'classic',
        production: false,
        filePath: fileURLToPath(url),
      });
      return { format: 'commonjs', source: compiled, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const React = require('react');
const TestRenderer = require('react-test-renderer');

function filePath(relativePath) {
  return fileURLToPath(new URL(relativePath, ROOT));
}

/** Drop project sources from the require cache so screen state starts clean.
 *  node_modules is left alone on purpose: re-requiring React would hand the
 *  screen a second React instance and every hook would throw. */
export function resetModules() {
  const sources = fileURLToPath(new URL('../../src/', import.meta.url));
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(sources)) delete require.cache[key];
  }
}

export function loadDb() {
  return require(filePath('src/database/db.ts'));
}

export function renderScreen(relativePath) {
  const Screen = require(filePath(relativePath)).default;

  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(React.createElement(Screen));
  });

  return renderer;
}

/** Flush the async load() effects a screen starts on mount, then re-read the tree. */
export async function flush(renderer) {
  await TestRenderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  return renderer;
}

/** Every string rendered anywhere in the tree, in document order. */
export function renderedText(renderer) {
  const strings = [];
  const walk = (node) => {
    if (node == null || node === false) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'string' || typeof node === 'number') {
      strings.push(String(node));
      return;
    }
    if (node.children) node.children.forEach(walk);
  };
  walk(renderer.toJSON());
  return strings;
}

await Promise.resolve();
