import { ChatRepository } from '../repositories/chat.repository';

export class ChatService {
  constructor(private chatRepo: ChatRepository) {}
}
