"""AES-128: the Advanced Encryption Standard (FIPS-197), one 128-bit block.

The S-box is computed here rather than pasted in as a table of 256 magic
numbers: each byte's entry is its multiplicative inverse in GF(2^8) followed by
a fixed affine transform. Deriving it keeps the implementation honest and makes
it obvious that the S-box is a construction, not an arbitrary lookup someone
chose.

AES itself remains unbroken after two decades of attack. Real failures happen
around it (a bad mode of operation, a reused nonce, a cache-timing leak), not
in the cipher.
"""

def gmul(a: int, b: int) -> int:
    """Multiply in GF(2^8) with the AES reduction polynomial 0x11B."""
    p = 0
    for _ in range(8):
        if b & 1:
            p ^= a
        high = a & 0x80
        a = (a << 1) & 0xFF
        if high:
            a ^= 0x1B
        b >>= 1
    return p


def _build_sbox() -> tuple[list[int], list[int]]:
    # Log/exp tables with generator 3, used to find multiplicative inverses.
    exp = [0] * 256
    log = [0] * 256
    x = 1
    for i in range(255):
        exp[i] = x
        log[x] = i
        x = gmul(x, 3)

    def rotl8(v: int, n: int) -> int:
        return ((v << n) | (v >> (8 - n))) & 0xFF

    sbox = [0] * 256
    inv_sbox = [0] * 256
    for b in range(256):
        inv = 0 if b == 0 else exp[(255 - log[b]) % 255]
        s = inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63
        sbox[b] = s & 0xFF
        inv_sbox[sbox[b]] = b
    return sbox, inv_sbox


SBOX, INV_SBOX = _build_sbox()


def bytes_to_state(data: bytes) -> list[list[int]]:
    """The 16 input bytes fill the state column by column, not row by row."""
    return [[data[c * 4 + r] for c in range(4)] for r in range(4)]


def state_to_hex(state: list[list[int]]) -> str:
    return "".join(f"{state[r][c]:02X}" for c in range(4) for r in range(4))


def expand_key(key: bytes) -> list[list[int]]:
    """128-bit key into 44 words; eleven round keys of four words each."""
    w = [list(key[4 * i : 4 * i + 4]) for i in range(4)]
    rcon = 1
    for i in range(4, 44):
        temp = list(w[i - 1])
        if i % 4 == 0:
            temp = temp[1:] + temp[:1]          # RotWord
            temp = [SBOX[b] for b in temp]      # SubWord
            temp[0] ^= rcon                     # round constant
            rcon = gmul(rcon, 2)
        w.append([a ^ b for a, b in zip(w[i - 4], temp)])
    return w


def add_round_key(state, w, rnd):
    return [
        [state[r][c] ^ w[rnd * 4 + c][r] for c in range(4)] for r in range(4)
    ]


def sub_bytes(state, table=None):
    table = table or SBOX
    return [[table[b] for b in row] for row in state]


def shift_rows(state, inverse=False):
    """Row r rotates by r, scattering each column across all four."""
    out = []
    for r, row in enumerate(state):
        n = (-r if inverse else r) % 4
        out.append(row[n:] + row[:n])
    return out


MIX = [[2, 3, 1, 1], [1, 2, 3, 1], [1, 1, 2, 3], [3, 1, 1, 2]]
INV_MIX = [[14, 11, 13, 9], [9, 14, 11, 13], [13, 9, 14, 11], [11, 13, 9, 14]]


def mix_columns(state, inverse=False):
    """Each column times a fixed matrix in GF(2^8): the diffusion step."""
    m = INV_MIX if inverse else MIX
    return [
        [
            gmul(state[0][c], m[r][0])
            ^ gmul(state[1][c], m[r][1])
            ^ gmul(state[2][c], m[r][2])
            ^ gmul(state[3][c], m[r][3])
            for c in range(4)
        ]
        for r in range(4)
    ]


def aes_block(block_hex: str, key_hex: str, decrypt: bool = False) -> str:
    if len(block_hex) != 32 or len(key_hex) != 32:
        raise ValueError("block and key must each be 32 hexadecimal digits (128 bits)")

    w = expand_key(bytes.fromhex(key_hex))
    state = bytes_to_state(bytes.fromhex(block_hex))

    if not decrypt:
        state = add_round_key(state, w, 0)
        for rnd in range(1, 11):
            state = sub_bytes(state)
            state = shift_rows(state)
            if rnd != 10:  # the last round omits MixColumns
                state = mix_columns(state)
            state = add_round_key(state, w, rnd)
    else:
        state = add_round_key(state, w, 10)
        for rnd in range(9, -1, -1):
            state = shift_rows(state, inverse=True)
            state = sub_bytes(state, INV_SBOX)
            state = add_round_key(state, w, rnd)
            if rnd != 0:
                state = mix_columns(state, inverse=True)

    return state_to_hex(state)


def run(text: str, params: dict, direction: str) -> str:
    block = "".join(text.split())
    key = "".join(str(params["key"]).split())
    return aes_block(block, key, direction == "decrypt")


if __name__ == "__main__":
    # FIPS-197 Appendix C.1
    print(aes_block("00112233445566778899aabbccddeeff", "000102030405060708090a0b0c0d0e0f"))
