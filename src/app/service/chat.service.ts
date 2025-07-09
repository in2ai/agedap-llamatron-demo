import { Injectable } from '@angular/core';
import { Chat } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  async createChat(chat: Chat): Promise<string> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'newChat',
        ...chat,
      });
      const chatId = response.chat.id;
      return chatId;
    } catch (error) {
      throw new Error(`Error creating chat : ${error}`);
    }
  }

  async getChats(workspaceId: string): Promise<Chat[]> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'getChats',
        page: 0,
        limit: 10,
        workspaceId,
      });
      const recoveredChats: Chat[] =
        response.chats?.map((c: any) => {
          return {
            id: c.id,
            workspaceId: c.workspaceId,
            name: c.name ?? '-',
            description: c.description ?? '-',
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          };
        }) ?? [];
      return recoveredChats;
    } catch (error) {
      throw new Error(`Error getting chats : ${error}`);
    }
  }

  async getChat(chatId: string): Promise<any> {
    try {
      const response = await (window as any).electronAPI
        .runNodeCode({
          func: 'getChat',
          chatId,
        })
        .catch((error: any) => {
          console.log('//ERROR GETTING CHAT: ', error);
        });
      const { chat } = response;

      return chat;
    } catch (error) {
      throw new Error(`Error getting chat : ${error}`);
    }
  }

  async deleteChat(chatId: string): Promise<string> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'deleteChat',
        chatId,
      });
      console.log('response: ', response);
      return response.chatId;
    } catch (error) {
      throw new Error(`Error deleting chat : ${error}`);
    }
  }
}
