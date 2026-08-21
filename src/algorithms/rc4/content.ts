import type { AlgorithmContent } from '@/core/types';

export const content: AlgorithmContent = {
  formula: [
    {
      label: "key schedule (KSA)",
      expr: "for i in 0…255:  j ← j + S[i] + K[i mod len];  swap S[i], S[j]",
      note: "S starts as the identity permutation (0, 1, 2 … 255 in order), and 256 swaps stir the key through it. The key is consumed cyclically, so a short key is simply repeated, which is where most of RC4’s trouble begins.",
    },
    {
      label: "keystream (PRGA)",
      expr: "i ← i+1;  j ← j + S[i];  swap;  out ← S[(S[i] + S[j]) mod 256]",
      note: "The same style of swapping continues indefinitely, emitting one byte per step. There are no rounds and no tables beyond S itself.",
    },
    {
      label: "encrypt",
      expr: "c = m ⊕ keystream",
      note: "XOR the keystream with the message. Encryption and decryption are the identical operation, which is also why reusing a key is fatal: two ciphertexts XORed together cancel the keystream entirely.",
    },
    {
      label: "the bias",
      expr: "Pr[out₂ = 0] ≈ 2/256",
      note: "The second output byte is zero about twice as often as it should be, and further biases run through the first few hundred bytes. Given enough ciphertexts of the same plaintext (a browser resending a session cookie, say), those biases recover it.",
    },
  ],
  symbols: [
    { symbol: "S", meaning: "The 256-byte state: a permutation of 0…255" },
    { symbol: "K", meaning: "The key, as bytes, repeated to fill 256 iterations" },
    { symbol: "i, j", meaning: "The two indices; i walks steadily, j jumps by state values" },
    { symbol: "⊕", meaning: "XOR, applied byte by byte" },
  ],
  overview: [
    'RC4 is a stream cipher: rather than transforming blocks, it generates a keystream one byte at a time and XORs it with the message. Encryption and decryption are therefore the identical operation.',
    'The entire cipher is a 256-byte array and two indices. The key-scheduling algorithm starts from the identity permutation, S holds 0 through 255 in order, and performs 256 swaps, at each step moving j on by S[i] plus a byte of the key. Because the key is consumed cyclically, a short key is simply repeated.',
    'The generator then keeps going in the same style. Advance i by one, move j on by S[i], swap the two entries, and emit S[(S[i] + S[j]) mod 256]. That output byte is the keystream; nothing else is needed.',
    'The appeal was that there are no rounds, no S-boxes and no lookup tables to embed. The whole thing fits in a few lines of any language, runs on hardware with almost no memory, and has no block size to pad to. For a decade that made it the default choice for encrypting a network connection.',
  ],
  history: [
    'Ron Rivest designed RC4 at RSA Security in 1987. It was a trade secret rather than a published algorithm, licensed to implementers under agreement.',
    'That ended in September 1994, when source code claiming to be RC4 was posted anonymously to the Cypherpunks mailing list. It proved to interoperate with licensed implementations, so the algorithm was effectively public from then on. Because the name remained a trademark, unlicensed implementations were often labelled ARCFOUR or ARC4, "alleged RC4", a convention still visible in library names today.',
    'It spread very widely: WEP in Wi-Fi, the original WPA (as TKIP), SSL and then TLS, Microsoft’s PPTP, Windows password hashing, and Skype among many others. At its peak a large share of all HTTPS connections used it.',
    'The unravelling was gradual and then sudden. Fluhrer, Mantin and Shamir published the attack on the key schedule in 2001, and WEP was broken in practice within months; recovering a Wi-Fi key went from theory to a downloadable tool in about a year. Attacks on RC4 in TLS followed, including AlFardan and colleagues in 2013 and the "Bar Mitzvah" and RC4 NOMORE attacks in 2015.',
    'The IETF prohibited RC4 in TLS outright in RFC 7465 in February 2015, and browsers removed support during 2015 and 2016. It is one of the few widely deployed ciphers to have been formally banned rather than merely deprecated.',
  ],
  weaknesses: [
    'The keystream is biased from the very first byte. The second output byte is 0 with roughly twice the probability it should be, and there are further biases across the first few hundred bytes. Given enough ciphertexts of the same plaintext (which a browser will happily generate by re-sending a session cookie), those biases recover the plaintext. This is the basis of the practical TLS attacks.',
    'The key schedule leaks the key when part of it is public. Fluhrer, Mantin and Shamir showed that if an attacker knows some key bytes, the first output bytes reveal information about the rest. WEP prepended a 24-bit initialisation vector directly to the shared key and transmitted it in the clear, handing an attacker exactly that condition; collecting enough frames recovers the key outright.',
    'Being a stream cipher, key reuse is catastrophic in the usual way. Two messages encrypted with the same key produce the same keystream, and XORing the ciphertexts cancels it, leaving the XOR of the two plaintexts. RC4 has no nonce input at all, so implementers had to invent a way to vary the key per message, and WEP’s way of doing that is what broke it.',
    'It provides no integrity. RC4 is malleable in the way every XOR-based stream cipher is: flipping a ciphertext bit flips the same plaintext bit, undetected. WEP paired it with a CRC-32 checksum, which is linear and can be corrected to match a tampered message, so forgeries went undetected too.',
    'The 24-bit IV space in WEP guaranteed repeats after a few hours of ordinary traffic: a design failure layered on top of a cipher weakness, and a good illustration that most real breaks come from the composition rather than the primitive.',
    'There is no safe way to configure RC4. Discarding the first 768 or 3072 bytes of keystream (RC4-drop) mitigates the early biases but not the later ones, and no variant survived scrutiny. The correct action is to use ChaCha20 or AES instead.',
    'This implementation is here to be read, not used. RC4 is prohibited in TLS by RFC 7465 and should not be deployed for anything.',
  ],
  sources: [
    {
      label: 'Fluhrer, Mantin and Shamir (2001)',
      url: 'https://www.cs.cornell.edu/people/egs/615/rc4_ksaproc.pdf',
      note: 'The key-schedule weakness that broke WEP in practice.',
    },
    {
      label: 'RFC 7465: Prohibiting RC4 in TLS',
      url: 'https://www.rfc-editor.org/rfc/rfc7465',
      note: 'One of the few ciphers formally banned rather than deprecated.',
    },
  ],
};
