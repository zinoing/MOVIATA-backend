import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InstagramService } from './instagram.service';

@Controller('api/v1/instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Post('profile/fetch')
  async fetchProfile(@Body('handle') handle: string) {
    return this.instagramService.fetchProfile(handle);
  }

  @Get('avatar')
  async proxyAvatar(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    if (!url) {
      throw new BadRequestException('Missing url');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException('Invalid url');
    }

    const allowedHosts = [
      'cdninstagram.com',
      'fbcdn.net',
    ];

    const isAllowedHost = allowedHosts.some(
      (host) =>
        parsedUrl.hostname === host ||
        parsedUrl.hostname.endsWith(`.${host}`),
    );

    if (!isAllowedHost) {
      throw new BadRequestException('Blocked avatar host');
    }

    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to fetch avatar');
      }

      const contentType =
        response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      return res.send(buffer);
    } catch (error) {
      throw new BadRequestException('Avatar proxy failed');
    }
  }
}