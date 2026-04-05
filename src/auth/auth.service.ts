import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';

type StravaTokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
};

@Injectable()
export class AuthService {
  private readonly clientId = process.env.STRAVA_CLIENT_ID;
  private readonly clientSecret = process.env.STRAVA_CLIENT_SECRET;
  private readonly redirectUri =
    process.env.STRAVA_REDIRECT_URI ||
    'http://localhost:3000/auth/strava-callback';

  // 임시 메모리 저장소
  // 지금은 DB가 없으니 이렇게 시작하고, 나중에 사용자 테이블/토큰 테이블로 옮기면 된다.
  private latestToken: StravaTokenResponse | null = null;
  private validStates = new Set<string>();

  getStravaAuthUrl() {

    if (!this.clientId) {
      throw new InternalServerErrorException(
        'STRAVA_CLIENT_ID is not configured',
      );
    }

    const state = crypto.randomBytes(24).toString('hex');
    this.validStates.add(state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
      state,
    });

    return {
      url: `https://www.strava.com/oauth/authorize?${params.toString()}`,
      state,
    };
  }

  async handleStravaCallback(code: string, state?: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    if (!state || !this.validStates.has(state)) {
      throw new BadRequestException('Invalid or missing OAuth state');
    }

    this.validStates.delete(state);

    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException(
        'Strava OAuth credentials are not configured',
      );
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = (await response.json()) as
      | StravaTokenResponse
      | { message?: string; errors?: unknown };

    if (!response.ok) {
      throw new BadRequestException(
        (data as { message?: string }).message ||
          'Failed to exchange Strava authorization code',
      );
    }

    const tokenData = data as StravaTokenResponse;
    this.latestToken = tokenData;

    return {
      connected: true,
      athlete: tokenData.athlete,
      expires_at: tokenData.expires_at,
    };
  }

  disconnectStrava() {
    this.latestToken = null;

    return {
      success: true,
    };
  }

  getLatestAccessToken() {
    return this.latestToken?.access_token ?? null;
  }

  getLatestToken() {
    return this.latestToken;
  }
}