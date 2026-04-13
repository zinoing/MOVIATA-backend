import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '../lib/r2';

interface OrderImage {
  orderId: string;
  imageUrl: string;
  createdAt: string;
}

@Injectable()
export class OrdersService {
  private orders: OrderImage[] = [];

  async captureDesignImage(
    file: Express.Multer.File,
    orderId?: string,
  ): Promise<{ imageUrl: string; orderId: string }> {
    if (!file) {
      throw new BadRequestException('이미지 파일이 없습니다.');
    }

    const resolvedOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = Date.now();
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `designs/${resolvedOrderId}/${timestamp}.${ext}`;

    try {
      await getR2Client().send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'image/jpeg',
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException('R2 업로드 실패: ' + (err as Error).message);
    }

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    this.orders.push({ orderId: resolvedOrderId, imageUrl, createdAt: new Date().toISOString() });

    return { imageUrl, orderId: resolvedOrderId };
  }

  getOrderImage(orderId: string): OrderImage | undefined {
    return this.orders.find((o) => o.orderId === orderId);
  }
}
