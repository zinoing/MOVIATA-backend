import { Injectable } from '@nestjs/common';
import { InstagramProfileProvider } from './providers/instagram-profile.provider';
import { ApifyInstagramProfileProvider } from './providers/apify-instagram-profile.provider';

@Injectable()
export class InstagramService {
  private providers: InstagramProfileProvider[];

  constructor() {
    this.providers = [new ApifyInstagramProfileProvider()];
  }

  async fetchProfile(handle: string) {
    if (!handle || typeof handle !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_HANDLE',
          message: 'Handle is required',
        },
      };
    }

    const normalizedHandle = handle
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
      .replace(/\/$/, '')
      .replace(/^@+/, '')
      .toLowerCase();

    if (!normalizedHandle) {
      return {
        success: false,
        error: {
          code: 'INVALID_HANDLE',
          message: 'Handle is required',
        },
      };
    }

    let lastErrorCode = 'UNKNOWN_FETCH_ERROR';

    for (const provider of this.providers) {
      try {
        const result = await provider.fetchProfile(normalizedHandle);

        return {
          success: true,
          data: {
            normalizedHandle: result.normalizedHandle,
            displayHandle: result.displayHandle,
            avatarUrl: result.externalAvatarUrl,
            avatarSource: 'auto',
            provider: result.provider,
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message) {
          lastErrorCode = error.message;
        }
      }
    }

    return {
      success: false,
      error: {
        code: lastErrorCode,
        message: 'Could not load profile automatically',
      },
    };
  }
}