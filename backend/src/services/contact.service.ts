import { ContactRepository } from '../repositories/contact.repository';
import { UserRepository } from '../repositories/user.repository';

export class ContactService {
  constructor(
    private contactRepo: ContactRepository,
    private userRepo: UserRepository
  ) {
    void this.contactRepo;
    void this.userRepo;
  }

  async getContacts(_userId: string): Promise<any[]> {
    return [];
  }

  async getPendingRequests(_userId: string): Promise<any[]> {
    return [];
  }

  async sendRequest(_userId: string, _contactId: string): Promise<any> {
    return { id: 'request-id' };
  }

  async acceptRequest(_userId: string, _requestId: string): Promise<void> {
    // TODO: Implement
  }

  async rejectRequest(_userId: string, _requestId: string): Promise<void> {
    // TODO: Implement
  }

  async removeContact(_userId: string, _contactId: string): Promise<void> {
    // TODO: Implement
  }

  async blockContact(_userId: string, _contactId: string): Promise<void> {
    // TODO: Implement
  }

  async unblockContact(_userId: string, _contactId: string): Promise<void> {
    // TODO: Implement
  }
}
