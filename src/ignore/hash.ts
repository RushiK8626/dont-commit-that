import * as crypto from 'crypto';

export default function computeLineHash(
    filePath: string,
    lineContent: string
): string {
    return crypto
        .createHash('sha256')
        .update(`${filePath}|${lineContent}`)
        .digest('hex');
}
