import { createHash } from 'crypto';

export default function sha1(content: Buffer | string): string {
  return createHash('sha1').update(content).digest('hex');
}
