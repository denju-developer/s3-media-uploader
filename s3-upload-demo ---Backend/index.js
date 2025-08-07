// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSignedUploadUrl } from './utils/s3.js';
import { asyncHandler } from './middlewares/asyncHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.post(
  '/generate-upload-url',
  asyncHandler(async (req, res) => {
    const { fileType } = req.body;

    if (!fileType) {
      res.status(400);
      throw new Error('fileType is required');
    }

    const { signedUrl, fileName, publicUrl  } = await getSignedUploadUrl(fileType);
    res.status(200).json({ signedUrl, fileName, publicUrl  });
  })
);

// Global error handler
app.use(errorHandler);

// Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
