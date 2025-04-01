import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Buffer } from 'buffer';

const SECRET_KEY = randomBytes(32); // Must be 32 bytes for AES-256

async function getKey(): Promise<Buffer> {
    return SECRET_KEY;
}

export async function encryptToken(token: string): Promise<string> {
    const key = await getKey();
    const iv = randomBytes(16); // Generate a random IV

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    console.log('Encrypted Token:', encrypted);
    return iv.toString('hex') + ':' + encrypted;
}

export async function decryptToken(encryptedToken: string): Promise<string> {
    const key = await getKey();
    const [ivHex, encryptedHex] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
