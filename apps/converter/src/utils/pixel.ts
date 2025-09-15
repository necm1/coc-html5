export function getFormatByPixelType(pixelType: number): string {
  if ([0, 1, 2, 3].includes(pixelType)) {
    return 'RGBA';
  }

  switch (pixelType) {
    case 4:
      return 'RGB';
      break;
    case 6:
      return 'LA';
    case 10:
      return 'L';
    default:
      throw new Error(`Unknown pixel type: ${pixelType}`);
  }
}

export function getByteCountByPixelType(pixelType: number): number {
  if ([0, 1].includes(pixelType)) {
    return 4;
  } else if ([2, 3, 4, 6].includes(pixelType)) {
    return 2;
  } else if (pixelType === 10) {
    return 1;
  }

  throw new Error(`Unknown pixel type: ${pixelType}`);
}
