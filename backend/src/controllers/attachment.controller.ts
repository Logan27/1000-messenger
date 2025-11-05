import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storage.service';
import { MessageService } from '../services/message.service';
import { validateImageFile } from '../utils/validation.util';

export class AttachmentController {
  constructor(
    private storageService: StorageService,
    private messageService: MessageService
  ) {}

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate image file (T101)
      validateImageFile(file);

      // Upload image to storage
      const uploadResult = await this.storageService.uploadImage(file, userId);

      // Return upload result with attachment metadata
      res.status(201).json({
        attachment: {
          id: uploadResult.id,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
          url: uploadResult.originalUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          mediumUrl: uploadResult.mediumUrl,
          width: uploadResult.width,
          height: uploadResult.height,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { attachmentId } = req.params;

      if (!attachmentId) {
        res.status(400).json({ error: 'Attachment ID is required' });
        return;
      }

      // Get attachment metadata from database
      const attachment = await this.messageService.getAttachment(attachmentId);

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      res.json({ attachment });
    } catch (error) {
      next(error);
    }
  };
}
