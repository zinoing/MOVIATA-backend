import { Body, Controller, Post, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { getR2Client } from '../lib/r2';

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.jpg', '.jpeg', '.png']);
const BUCKET = process.env.R2_BUCKET_TEMP ?? 'moviata-temp';

@Controller('api/video')
export class VideoController {
  @Post('presigned-upload')
  async getPresignedUploadUrl(
    @Body() body: { filename: string; content_type: string },
  ) {
    const { filename, content_type } = body;
    if (!filename) throw new BadRequestException('filename is required');

    const ext = extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `Unsupported format '${ext}'. Allowed: ${[...ALLOWED_EXTENSIONS].sort().join(', ')}`,
      );
    }

    const objectKey = `uploads/${randomUUID()}${ext}`;
    const ct = content_type || 'application/octet-stream';

    try {
      const url = await getSignedUrl(
        getR2Client(),
        new PutObjectCommand({ Bucket: BUCKET, Key: objectKey, ContentType: ct }),
        { expiresIn: 300 },
      );
      return { presigned_url: url, object_key: objectKey };
    } catch (err) {
      throw new InternalServerErrorException(`R2 presigned URL generation failed: ${err}`);
    }
  }
}
