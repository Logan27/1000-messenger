import { CONTACT_STATUS } from '../config/constants';
export interface Contact {
    id: string;
    userId: string;
    contactId: string;
    status: typeof CONTACT_STATUS[keyof typeof CONTACT_STATUS];
    requestedBy: string;
    createdAt: Date;
    acceptedAt?: Date;
}
export declare class ContactRepository {
    create(data: Partial<Contact>): Promise<Contact>;
    findByUserAndContact(userId: string, contactId: string): Promise<Contact | null>;
    areContacts(user1Id: string, user2Id: string): Promise<boolean>;
    getUserContacts(userId: string): Promise<Contact[]>;
    getPendingRequests(userId: string): Promise<Contact[]>;
    updateStatus(contactId: string, status: string): Promise<void>;
    delete(contactId: string): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=contact.repository.d.ts.map