import { getWorkspace } from '../db.mjs';
import { workOffersService } from './workOffers/service.mjs';

let chatController = {
  started: false,
  chat: null,
  workspace: null,
  event: null,
  interval: null,
};

export async function startChatService(event, chat) {
  if (chatController.started) return;

  const workspace = await getWorkspace(chat.workspaceId);
  if (!workspace) return;

  chatController = {
    started: true,
    chat: chat,
    workspace: workspace,
    event: event,
    interval: null,
  };

  switch (workspace.type) {
    case 'workOffers': {
      const timer = await workOffersService(chatController);
      chatController.interval = timer;
      break;
    }
  }
}

export async function stopChatService() {
  if (chatController.interval) clearInterval(chatController.interval);

  chatController = {
    started: false,
    chat: null,
    workspace: null,
    event: null,
    interval: null,
  };
}
