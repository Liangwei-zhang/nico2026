import { loadSettings } from '@shared/storage';
import { RouteController } from './routeController';
import { setupMessageListener } from './messaging';

async function init(): Promise<void> {
  const settings = await loadSettings();
  const controller = new RouteController(settings);

  setupMessageListener((msg) => controller.onStreamUpdate(msg));
  controller.start();
}

init();
