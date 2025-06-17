import { BufferReader } from '../buffer-reader';
import { BufferEmptyException } from '../exception/buffer-empty.exception';
import { UnknownSignatureException } from '../exception/unknown-signature.exception';
import { SignatureType } from '../type/signature.type';

export function getSignature(buffer: BufferReader): SignatureType {
  if (!buffer || !buffer.buffer || buffer.buffer.length === 0) {
    throw new BufferEmptyException();
  }

  let signatureType = SignatureType.NONE;

  const signatureBytes = buffer.readBytes(2).toString('utf8');

  switch (signatureBytes) {
    case 'SC':
      signatureType = SignatureType.SC;
      break;
    case 'SCLZ':
      signatureType = SignatureType.SCLZ;
      break;
    case 'SIG':
      signatureType = SignatureType.SIG;
      break;
    case 'ZSTD':
      signatureType = SignatureType.ZSTD;
      break;
    case 'LZMA':
      signatureType = SignatureType.LZMA;
      break;
    default:
      throw new UnknownSignatureException(signatureBytes);
  }

  return signatureType;
}
