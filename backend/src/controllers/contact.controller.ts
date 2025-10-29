import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';

export class ContactController {
  constructor(private contactService: ContactService) {}

  getContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const contacts = await this.contactService.getContacts(userId);

      res.json({ contacts });
    } catch (error) {
      next(error);
    }
  };

  getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const requests = await this.contactService.getPendingRequests(userId);

      res.json({ requests });
    } catch (error) {
      next(error);
    }
  };

  sendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.body;

      if (!contactId) {
        return res.status(400).json({ error: 'Contact ID is required' });
      }

      const request = await this.contactService.sendRequest(userId, contactId);

      res.status(201).json({ request });
    } catch (error) {
      next(error);
    }
  };

  acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { requestId } = req.params;

      await this.contactService.acceptRequest(userId, requestId);

      res.json({ message: 'Contact request accepted' });
    } catch (error) {
      next(error);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { requestId } = req.params;

      await this.contactService.rejectRequest(userId, requestId);

      res.json({ message: 'Contact request rejected' });
    } catch (error) {
      next(error);
    }
  };

  removeContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.params;

      await this.contactService.removeContact(userId, contactId);

      res.json({ message: 'Contact removed successfully' });
    } catch (error) {
      next(error);
    }
  };

  blockContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.body;

      if (!contactId) {
        return res.status(400).json({ error: 'Contact ID is required' });
      }

      await this.contactService.blockContact(userId, contactId);

      res.json({ message: 'Contact blocked successfully' });
    } catch (error) {
      next(error);
    }
  };

  unblockContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { contactId } = req.params;

      await this.contactService.unblockContact(userId, contactId);

      res.json({ message: 'Contact unblocked successfully' });
    } catch (error) {
      next(error);
    }
  };
}
