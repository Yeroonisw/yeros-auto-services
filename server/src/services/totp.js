import crypto from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  return bits.match(/.{1,5}/g).map((chunk) => alphabet[parseInt(chunk.padEnd(5, "0"), 2)]).join("");
}

function base32Decode(value) {
  const bits = String(value).replace(/=+$/g, "").toUpperCase().split("").map((char) => alphabet.indexOf(char).toString(2).padStart(5, "0")).join("");
  return Buffer.from((bits.match(/.{8}/g) || []).map((byte) => parseInt(byte, 2)));
}

export function createTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function totpCode(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(code).padStart(6, "0");
}

export function verifyTotp(secret, candidate) {
  const value = String(candidate || "");
  if (!/^\d{6}$/.test(value)) return false;
  return [-30000, 0, 30000].some((offset) => {
    const expected = totpCode(secret, Date.now() + offset);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value));
  });
}
