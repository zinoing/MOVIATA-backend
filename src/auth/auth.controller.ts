import { Controller, Delete, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('strava')
  getStravaAuthUrl() {
    return this.authService.getStravaAuthUrl();
  }

  @Get('strava/callback')
  async handleStravaCallback(
    @Query('code') code: string,
    @Query('state') state?: string,
  ) {
    return this.authService.handleStravaCallback(code, state);
  }

  @Delete('strava')
  disconnectStrava() {
    return this.authService.disconnectStrava();
  }
}