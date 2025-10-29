import { ContactRepository } from '../repositories/contact.repository';

export class ContactService {
  constructor(private contactRepo: ContactRepository) {}
}
