import path from 'path';
import { ScFile } from './sc-file';
import { ScDecoder } from './sc-decoder';

(async () => {
  console.log('> Starting SC File Parser...');

  const ASSETS_PATH = path.join(__dirname, '../../../../src/assets');

  const scFiles = [
    // new ScFile(path.join(ASSETS_PATH, 'sc/background_cc_gamearea.sc')),
    new ScFile(path.join(ASSETS_PATH, 'sc/background_clan_capital.sc')),
  ];

  const decoder = new ScDecoder();

  for (const scFile of scFiles) {
    console.log(`> Loading SC file: ${scFile.filePath}`);
    await scFile.load();
    await decoder.decode(scFile);
  }

  console.log('> SC File Parser completed successfully.');
})();
