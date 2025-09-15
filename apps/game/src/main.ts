import { ClashCore } from '@coc/core';
import { Logger } from '@coc/utils';

(async () => {
  const logger = new Logger('Main');

  try {
    const clash = ClashCore.getInstance();
    await clash.init();
  } catch (error) {
    logger.error('Error initializing ClashCore:', error);
  }
})();
