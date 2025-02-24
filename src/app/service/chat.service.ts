import { Injectable } from '@angular/core';
import { Chat } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  async createChat(chat: Chat): Promise<Chat> {
    try {
      const response = await (window as any).electronAPI.runNodeCode({
        func: 'newChat',
        ...chat,
      });
      const id = response.chat.id;
      return id;
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

  async getChat(chatId: string): Promise<Chat> {
    try {
      console.log('//GETTING CHAT: ', chatId);
      const response = await (window as any).electronAPI
        .runNodeCode({
          func: 'getChat',
          chatId,
        })
        .catch((error: any) => {
          console.log('//ERROR GETTING CHAT: ', error);
        });
      console.log('//RESPONSE: ');
      console.log('//RESPONSE: ', response);
      const { chat } = response;
      const recoveredChat: Chat = {
        id: chat.id,
        workspaceId: chat.workspaceId ?? '-',
        name: chat.name ?? '-',
        description: chat.description ?? '-',
        messages: chat.messages ?? [],
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
      console.log('//RECOVERED CHAT CLEAN: ', recoveredChat);
      return recoveredChat;
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
