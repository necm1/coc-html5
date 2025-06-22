import { ClashCore, ClashWorld } from '@coc/core';

(async () => {
  const clash = ClashCore.getInstance();
  await clash.init();

  const world = new ClashWorld();
})();
