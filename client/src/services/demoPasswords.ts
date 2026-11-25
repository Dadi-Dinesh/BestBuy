async function derivePassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const digest = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 }, material, 256);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashDemoPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt, digest: await derivePassword(password, salt) };
}

export async function verifyDemoPassword(password: string, stored?: Awaited<ReturnType<typeof hashDemoPassword>>) {
  if (!stored) return false;
  return await derivePassword(password, stored.salt) === stored.digest;
}
