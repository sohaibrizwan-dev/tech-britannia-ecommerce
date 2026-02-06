import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Upload single image
router.post('/image', authMiddleware, adminMiddleware, upload.single('image'), (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading file',
    });
  }
});

export default router;
