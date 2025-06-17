import { ClashCore } from '@coc/core';

(async () => {
  // if (typeof window === 'undefined') {
  //   console.error('This script is intended to run in a browser environment.');
  //   return;
  // }

  const clash = ClashCore.getInstance();
  await clash.init();
})();
