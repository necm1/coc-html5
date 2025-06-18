import path from 'path';
import { ScFile } from './sc-file';
import { ScDecoder } from './sc-decoder';

(async () => {
  console.log('Starting SC File Parser...');

  const ASSETS_PATH = path.join(__dirname, '../../../../src/assets');

  const file = path.join(ASSETS_PATH, 'sc/background_cc_gamearea.sc');

  const scFiles = [new ScFile(file)];

  const decoder = new ScDecoder();

  for (const scFile of scFiles) {
    await scFile.load();
    await decoder.decode(scFile);
  }

  console.log('SC File Parser completed successfully.');
})();
