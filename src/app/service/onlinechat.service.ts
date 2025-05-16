import { Injectable } from '@angular/core';
import { OnlineChat } from '../models/onlinechat';

@Injectable({
  providedIn: 'root',
})
export class OnlineChatService {
  async getOnlineChats(): Promise<OnlineChat[]> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getOnlineChats',
        page: 0,
        limit: 10,
      });
      const recoveredOnlineChats: OnlineChat[] =
        response.onlineChats?.map((ws: any) => {
          return {
            id: ws.id,
            authors: ws.authors,
            relay: ws.relay,
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
          };
        }) ?? [];
      return recoveredOnlineChats;
    } catch (error) {
      throw new Error(`Error getting onlinechats: ${error}`);
    }
  }

  async getOnlineChat(id: string): Promise<OnlineChat> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getOnlineChat',
        onlineChatId: id,
      });
      console.log('response', response);
      const onlineChat: OnlineChat = {
        id: response.onlineChat.id,
        authors: response.onlineChat.authors,
        relay: response.onlineChat.relay,
        createdAt: response.onlineChat.createdAt,
        updatedAt: response.onlineChat.updatedAt,
      };
      return onlineChat;
    } catch (error) {
      throw new Error(`Error getting onlinechat: ${error}`);
    }
  }
}
