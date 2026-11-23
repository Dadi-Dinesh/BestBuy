import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const key = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) =>
  scrypt(password, salt, 64, { N: 65536, r: 8, p: 2, maxmem: 128 * 1024 * 1024 },
    (error, derived) => error ? reject(error) : resolve(derived)));

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString('hex')}:${(await key(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, hash?: string) {
  const [, salt, digest] = (hash ?? '').split(':');
  const derived = await key(password, salt ? Buffer.from(salt, 'hex') : Buffer.alloc(16));
  const stored = Buffer.from(digest || '', 'hex');
  return derived.length === stored.length && timingSafeEqual(derived, stored);
}
