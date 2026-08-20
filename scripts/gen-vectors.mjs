/**
 * Generates the shared `vectors.json` fixture beside each algorithm.
 *
 * These files are the contract both languages are held to: the TypeScript
 * engine tests and the Python sample tests both assert against them, so a
 * hand-written sample that drifts from the engine fails CI instead of shipping
 * a subtly wrong implementation to someone learning from it.
 *
 * The case inputs below include the published known-answer vectors each
 * algorithm's engine test already pins (FIPS-197 for AES, FIPS 46-3 for DES,
 * the classic 3233/17/2753 example for RSA), so regenerating cannot quietly
 * bless a broken engine — the engine's own KAT tests would fail first.
 *
 * Run: node scripts/gen-vectors.mjs
 */

import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const CASES = {
  caesar: [
    { name: 'classic shift 3', direction: 'encrypt', input: 'The die is cast', params: { shift: 3 } },
    { name: 'wraps past Z', direction: 'encrypt', input: 'xyz XYZ', params: { shift: 3 } },
    { name: 'punctuation passes through', direction: 'encrypt', input: 'Hello, World! 123', params: { shift: 13 } },
    { name: 'decrypt round trip', direction: 'decrypt', input: 'Wkh glh lv fdvw', params: { shift: 3 } },
    { name: 'shift 0 is identity', direction: 'encrypt', input: 'Unchanged.', params: { shift: 0 } },
  ],
  railfence: [
    { name: 'textbook 3-rail example', direction: 'encrypt', input: 'WE ARE DISCOVERED FLEE AT ONCE', params: { rails: 3 } },
    { name: 'decrypt the 3-rail example', direction: 'decrypt', input: 'WECRLTEERDSOEEFEAOCAIVDEN', params: { rails: 3 } },
    { name: 'same message on 4 rails', direction: 'encrypt', input: 'WEAREDISCOVEREDFLEEATONCE', params: { rails: 4 } },
    { name: 'two rails', direction: 'encrypt', input: 'DEFENDTHEEASTWALL', params: { rails: 2 } },
  ],
  enigma: [
    { name: 'I-II-III at AAA, AAAAA', direction: 'encrypt', input: 'AAAAA', params: { rotors: 'I II III', reflector: 'B', positions: 'AAA', rings: 'AAA', plugboard: '' } },
    { name: 'twenty-six As', direction: 'encrypt', input: 'AAAAAAAAAAAAAAAAAAAAAAAAAA', params: { rotors: 'I II III', reflector: 'B', positions: 'AAA', rings: 'AAA', plugboard: '' } },
    { name: 'with plugboard and rings', direction: 'encrypt', input: 'ATTACKATDAWN', params: { rotors: 'IV II V', reflector: 'C', positions: 'QRS', rings: 'BCD', plugboard: 'AV BS CG DL FU HZ IN KM OW RX' } },
  ],
  affine: [
    { name: 'a=5 b=8', direction: 'encrypt', input: 'AFFINE CIPHER', params: { a: 5, b: 8 } },
    { name: 'decrypt a=5 b=8', direction: 'decrypt', input: 'IHHWVC SWFRCP', params: { a: 5, b: 8 } },
    { name: 'a=1 reduces to Caesar', direction: 'encrypt', input: 'abc xyz', params: { a: 1, b: 3 } },
    { name: 'mixed case and symbols', direction: 'encrypt', input: 'Hello, World!', params: { a: 7, b: 2 } },
  ],
  vigenere: [
    { name: 'classic LEMON', direction: 'encrypt', input: 'ATTACKATDAWN', params: { keyword: 'LEMON' } },
    { name: 'decrypt LEMON', direction: 'decrypt', input: 'LXFOPVEFRNHR', params: { keyword: 'LEMON' } },
    { name: 'key does not advance on spaces', direction: 'encrypt', input: 'attack at dawn', params: { keyword: 'LEMON' } },
    { name: 'single-letter key is Caesar', direction: 'encrypt', input: 'HELLO', params: { keyword: 'D' } },
  ],
  otp: [
    { name: 'pad consumed once', direction: 'encrypt', input: 'HELLO', params: { pad: 'XMCKL' } },
    { name: 'decrypt', direction: 'decrypt', input: 'EQNVZ', params: { pad: 'XMCKL' } },
    { name: 'spaces do not consume pad', direction: 'encrypt', input: 'HE LLO', params: { pad: 'XMCKL' } },
  ],
  playfair: [
    { name: 'classic PLAYFAIR EXAMPLE', direction: 'encrypt', input: 'Hide the gold in the tree stump', params: { keyword: 'PLAYFAIR EXAMPLE' } },
    { name: 'doubled letters get a filler', direction: 'encrypt', input: 'BALLOON', params: { keyword: 'MONARCHY' } },
    { name: 'decrypt', direction: 'decrypt', input: 'BM OD ZB XD NA BE KU DM UI XM MO UV IF', params: { keyword: 'PLAYFAIR EXAMPLE' } },
  ],
  hill: [
    { name: '2x2 key 3 3 2 5', direction: 'encrypt', input: 'HELP', params: { key: '3 3 2 5' } },
    { name: 'decrypt', direction: 'decrypt', input: 'HIAT', params: { key: '3 3 2 5' } },
    { name: 'odd length pads with X', direction: 'encrypt', input: 'ABCDE', params: { key: '3 3 2 5' } },
  ],
  rc4: [
    { name: 'key "Key" / "Plaintext"', direction: 'encrypt', input: 'Plaintext', params: { key: 'Key' } },
    { name: 'key "Wiki" / "pedia"', direction: 'encrypt', input: 'pedia', params: { key: 'Wiki' } },
    { name: 'key "Secret" / "Attack at dawn"', direction: 'encrypt', input: 'Attack at dawn', params: { key: 'Secret' } },
    { name: 'decrypt back to text', direction: 'decrypt', input: 'BBF316E8D940AF0AD3', params: { key: 'Key' } },
  ],
  blowfish: [
    { name: 'all-zero key and block', direction: 'encrypt', input: '0000000000000000', params: { key: '0000000000000000' } },
    { name: 'all-ones key and block', direction: 'encrypt', input: 'FFFFFFFFFFFFFFFF', params: { key: 'FFFFFFFFFFFFFFFF' } },
    { name: 'key 0123456789ABCDEF', direction: 'encrypt', input: '1111111111111111', params: { key: '0123456789ABCDEF' } },
    { name: 'decrypt back', direction: 'decrypt', input: '0ACEAB0FC6A0A28D', params: { key: 'FEDCBA9876543210' } },
  ],
  chacha20: [
    { name: 'RFC 8439 section 2.4.2', direction: 'encrypt', input: "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.", params: { key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', nonce: '000000000000004a00000000', counter: 1 } },
    { name: 'counter 0, zero nonce', direction: 'encrypt', input: 'ChaCha20 test', params: { key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', nonce: '000000000000000000000000', counter: 0 } },
  ],
  des: [
    { name: 'FIPS 46-3 known-answer vector', direction: 'encrypt', input: '0123456789ABCDEF', params: { key: '133457799BBCDFF1' } },
    { name: 'decrypt the same vector', direction: 'decrypt', input: '85E813540F0AB405', params: { key: '133457799BBCDFF1' } },
    { name: 'all-zero block', direction: 'encrypt', input: '0000000000000000', params: { key: 'AABB09182736CCDD' } },
    { name: 'all-one block', direction: 'encrypt', input: 'FFFFFFFFFFFFFFFF', params: { key: 'AABB09182736CCDD' } },
  ],
  '3des': [
    { name: 'three independent keys', direction: 'encrypt', input: '0123456789ABCDEF', params: { key: '133457799BBCDFF10E329232EA6D0D73AABB09182736CCDD' } },
    { name: 'decrypt three-key', direction: 'decrypt', input: '0123456789ABCDEF', params: { key: '133457799BBCDFF10E329232EA6D0D73AABB09182736CCDD' } },
    { name: 'two-key mode', direction: 'encrypt', input: 'DEADBEEFCAFEBABE', params: { key: '133457799BBCDFF10E329232EA6D0D73' } },
    { name: 'all keys equal collapses to single DES', direction: 'encrypt', input: '0123456789ABCDEF', params: { key: '133457799BBCDFF1133457799BBCDFF1133457799BBCDFF1' } },
  ],
  aes: [
    { name: 'FIPS-197 Appendix C.1', direction: 'encrypt', input: '00112233445566778899aabbccddeeff', params: { key: '000102030405060708090a0b0c0d0e0f' } },
    { name: 'FIPS-197 Appendix B', direction: 'encrypt', input: '3243f6a8885a308d313198a2e0370734', params: { key: '2b7e151628aed2a6abf7158809cf4f3c' } },
    { name: 'decrypt Appendix C.1', direction: 'decrypt', input: '69C4E0D86A7B0430D8CDB78070B4C55A', params: { key: '000102030405060708090a0b0c0d0e0f' } },
    { name: 'all-zero block', direction: 'encrypt', input: '00000000000000000000000000000000', params: { key: 'cafebabedeadbeef0011223344556677' } },
  ],
  sha256: [
    { name: 'empty string', direction: 'encrypt', input: '', params: {} },
    { name: '"abc"', direction: 'encrypt', input: 'abc', params: {} },
    { name: 'the 56-character two-block vector', direction: 'encrypt', input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', params: {} },
    { name: 'quick brown fox', direction: 'encrypt', input: 'The quick brown fox jumps over the lazy dog', params: {} },
  ],
  sha3: [
    { name: 'SHA3-256 of ""', direction: 'encrypt', input: '', params: { variant: 'sha3-256' } },
    { name: 'SHA3-256 of "abc"', direction: 'encrypt', input: 'abc', params: { variant: 'sha3-256' } },
    { name: 'SHA3-512 of "abc"', direction: 'encrypt', input: 'abc', params: { variant: 'sha3-512' } },
    { name: 'SHAKE128 of ""', direction: 'encrypt', input: '', params: { variant: 'shake128' } },
    { name: 'SHAKE256 of "abc"', direction: 'encrypt', input: 'abc', params: { variant: 'shake256' } },
  ],
  hmac: [
    { name: 'RFC 4231 case 1', direction: 'encrypt', input: '4869205468657265', params: { key: '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b', format: 'hex' } },
    { name: 'RFC 4231 case 2 (key "Jefe")', direction: 'encrypt', input: 'what do ya want for nothing?', params: { key: 'Jefe', format: 'text' } },
    { name: 'RFC 4231 case 3', direction: 'encrypt', input: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', params: { key: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', format: 'hex' } },
  ],
  lwe: [
    { name: 'round-trip 10110', direction: 'decrypt', input: '10110', params: { seed: 12345 } },
    { name: 'round-trip 000111', direction: 'decrypt', input: '000111', params: { seed: 7 } },
    { name: 'alternating bits', direction: 'decrypt', input: '101010101010', params: { seed: 99 } },
  ],
  'ml-kem': [
    { name: 'transport 10110011', direction: 'encrypt', input: '10110011', params: { seed: 12345 } },
    { name: 'all ones', direction: 'encrypt', input: '11111111', params: { seed: 7 } },
    { name: 'alternating', direction: 'encrypt', input: '01010101', params: { seed: 99 } },
  ],
  'ml-dsa': [
    { name: 'sign and verify', direction: 'encrypt', input: 'attack at dawn', params: { seed: 12345 } },
    { name: 'another key', direction: 'encrypt', input: 'transfer 100', params: { seed: 7 } },
    { name: 'tampered message is rejected', direction: 'decrypt', input: 'transfer 100', params: { seed: 7 } },
  ],
  'hash-signatures': [
    { name: 'sign and verify from leaf 3', direction: 'encrypt', input: 'attack at dawn', params: { seed: 'cryptolab', leaf: 3 } },
    { name: 'sign and verify from leaf 0', direction: 'encrypt', input: 'transfer 100', params: { seed: 'cryptolab', leaf: 0 } },
    { name: 'tampered message is rejected', direction: 'decrypt', input: 'transfer 100', params: { seed: 'cryptolab', leaf: 0 } },
  ],
  'diffie-hellman': [
    { name: 'textbook p=23 g=5 a=6 b=15', direction: 'encrypt', input: '', params: { p: '23', g: '5', a: '6', b: '15' } },
    { name: 'p=23 g=5 a=4 b=3', direction: 'encrypt', input: '', params: { p: '23', g: '5', a: '4', b: '3' } },
    { name: '31-bit prime', direction: 'encrypt', input: '', params: { p: '2147483647', g: '7', a: '12345', b: '67890' } },
  ],
  ecdh: [
    { name: 'tiny curve, a=5 b=7', direction: 'encrypt', input: '', params: { curve: 'tiny', a: 5, b: 7 } },
    { name: 'small curve, a=47 b=131', direction: 'encrypt', input: '', params: { curve: 'small', a: 47, b: 131 } },
    { name: 'small curve, scalars swapped', direction: 'encrypt', input: '', params: { curve: 'small', a: 131, b: 47 } },
  ],
  rsa: [
    { name: 'classic n=3233 e=17', direction: 'encrypt', input: 'Hi', params: { p: 61, q: 53, e: 17 } },
    { name: 'decrypt with d=2753', direction: 'decrypt', input: '3000 3179', params: { p: 61, q: 53, e: 17 } },
    { name: 'larger primes', direction: 'encrypt', input: 'RSA', params: { p: 137, q: 131, e: 7 } },
  ],
};

/** Registry ids and folder names differ where the id has punctuation. */
const DIRS = {
  'diffie-hellman': 'dh',
  '3des': 'tripledes',
  ecdh: 'ecc',
  'hash-signatures': 'hashsig',
  'ml-kem': 'mlkem',
  'ml-dsa': 'mldsa',
};
const dirOf = (id) => DIRS[id] ?? id;

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
});

let total = 0;
for (const [id, cases] of Object.entries(CASES)) {
  const { run } = await server.ssrLoadModule(`/src/algorithms/${dirOf(id)}/engine.ts`);
  const out = cases.map((c) => {
    const result = run(c.input, c.params, c.direction);
    if (result.error) {
      throw new Error(`${id} / ${c.name}: engine rejected the case — ${result.error.message}`);
    }
    return { ...c, output: result.output };
  });
  const path = `src/algorithms/${dirOf(id)}/vectors.json`;
  writeFileSync(path, JSON.stringify({ algorithm: id, cases: out }, null, 2) + '\n');
  total += out.length;
  console.log(`  ${path}  (${out.length} cases)`);
}

await server.close();
console.log(`\n${total} vectors written.`);
