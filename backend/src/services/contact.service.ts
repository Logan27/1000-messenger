import { ContactRepository } from '../repositories/contact.repository';
import { CONTACT_STATUS } from '../config/constants';
import { logger } from '../utils/logger.util';

export class ContactService {
  constructor(private contactRepo: ContactRepository) {}

  async getContacts(userId: string) {
    const contacts = await this.contactRepo.getUserContacts(userId);
    return contacts;
  }

  async getPendingRequests(userId: string) {
    const requests = await this.contactRepo.getPendingRequests(userId);
    return requests;
  }

  async sendRequest(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new Error('Cannot add yourself as a contact');
    }

    const existingContact = await this.contactRepo.findByUserAndContact(userId, contactId);
    if (existingContact) {
      if (existingContact.status === CONTACT_STATUS.ACCEPTED) {
        throw new Error('Already in contacts');
      }
      if (existingContact.status === CONTACT_STATUS.PENDING) {
        throw new Error('Contact request already sent');
      }
      if (existingContact.status === CONTACT_STATUS.BLOCKED) {
        throw new Error('Cannot send request to blocked user');
      }
    }

    const reverseContact = await this.contactRepo.findByUserAndContact(contactId, userId);
    if (reverseContact && reverseContact.status === CONTACT_STATUS.BLOCKED) {
      throw new Error('Cannot send request to this user');
    }

    const contact = await this.contactRepo.create({
      userId,
      contactId,
      status: CONTACT_STATUS.PENDING,
      requestedBy: userId,
    });

    await this.contactRepo.create({
      userId: contactId,
      contactId: userId,
      status: CONTACT_STATUS.PENDING,
      requestedBy: userId,
    });

    logger.info(`Contact request sent from ${userId} to ${contactId}`);

    return contact;
  }

  async acceptRequest(userId: string, requestId: string) {
    const contact = await this.contactRepo.findByUserAndContact(userId, requestId);
    
    if (!contact) {
      throw new Error('Contact request not found');
    }

    if (contact.status !== CONTACT_STATUS.PENDING) {
      throw new Error('Invalid contact request status');
    }

    if (contact.requestedBy === userId) {
      throw new Error('Cannot accept your own request');
    }

    await this.contactRepo.updateStatus(contact.id, CONTACT_STATUS.ACCEPTED);

    const reverseContact = await this.contactRepo.findByUserAndContact(requestId, userId);
    if (reverseContact) {
      await this.contactRepo.updateStatus(reverseContact.id, CONTACT_STATUS.ACCEPTED);
    }

    logger.info(`Contact request accepted: ${userId} accepted ${requestId}`);
  }

  async rejectRequest(userId: string, requestId: string) {
    const contact = await this.contactRepo.findByUserAndContact(userId, requestId);
    
    if (!contact) {
      throw new Error('Contact request not found');
    }

    if (contact.status !== CONTACT_STATUS.PENDING) {
      throw new Error('Invalid contact request status');
    }

    await this.contactRepo.delete(contact.id);

    const reverseContact = await this.contactRepo.findByUserAndContact(requestId, userId);
    if (reverseContact) {
      await this.contactRepo.delete(reverseContact.id);
    }

    logger.info(`Contact request rejected: ${userId} rejected ${requestId}`);
  }

  async removeContact(userId: string, contactId: string) {
    const contact = await this.contactRepo.findByUserAndContact(userId, contactId);
    
    if (!contact) {
      throw new Error('Contact not found');
    }

    await this.contactRepo.delete(contact.id);

    const reverseContact = await this.contactRepo.findByUserAndContact(contactId, userId);
    if (reverseContact) {
      await this.contactRepo.delete(reverseContact.id);
    }

    logger.info(`Contact removed: ${userId} removed ${contactId}`);
  }

  async blockContact(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new Error('Cannot block yourself');
    }

    const existingContact = await this.contactRepo.findByUserAndContact(userId, contactId);
    
    if (existingContact) {
      if (existingContact.status === CONTACT_STATUS.BLOCKED) {
        throw new Error('User already blocked');
      }
      await this.contactRepo.updateStatus(existingContact.id, CONTACT_STATUS.BLOCKED);
    } else {
      await this.contactRepo.create({
        userId,
        contactId,
        status: CONTACT_STATUS.BLOCKED,
        requestedBy: userId,
      });
    }

    logger.info(`Contact blocked: ${userId} blocked ${contactId}`);
  }

  async unblockContact(userId: string, contactId: string) {
    const contact = await this.contactRepo.findByUserAndContact(userId, contactId);
    
    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.status !== CONTACT_STATUS.BLOCKED) {
      throw new Error('Contact is not blocked');
    }

    await this.contactRepo.delete(contact.id);

    logger.info(`Contact unblocked: ${userId} unblocked ${contactId}`);
  }
}
