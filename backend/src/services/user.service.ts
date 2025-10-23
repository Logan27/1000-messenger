// src/services/user.service.ts
async canViewUserProfile(userId: string, viewerId: string): Promise<boolean> {
    // Check if users are contacts
    const areContacts = await this.contactRepo.areContacts(userId, viewerId);
    if (areContacts) return true;
    
    // Check if they share any chat
    const sharedChats = await this.chatRepo.findSharedChats(userId, viewerId);
    if (sharedChats.length > 0) return true;
    
    return false;
  }