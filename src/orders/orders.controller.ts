import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('capture')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async capture(
    @UploadedFile() file: Express.Multer.File,
    @Body('orderId') orderId?: string,
    @Body('designType') designType?: string,
    @Body('title') title?: string,
  ) {
    const result = await this.ordersService.captureDesignImage(file, orderId, designType, title);
    return { success: true, ...result };
  }

  @Get(':orderId/image')
  getImage(@Param('orderId') orderId: string) {
    const order = this.ordersService.getOrderImage(orderId);
    if (!order) {
      return { success: false, message: '주문을 찾을 수 없습니다.' };
    }
    return { success: true, ...order };
  }
}
