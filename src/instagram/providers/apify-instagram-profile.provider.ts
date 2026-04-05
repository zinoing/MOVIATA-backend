import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type {
  FetchedInstagramProfile,
  InstagramProfileProvider,
} from './instagram-profile.provider';

@Injectable()
export class ApifyInstagramProfileProvider implements InstagramProfileProvider {
  private readonly token = process.env.APIFY_TOKEN;
  private readonly actorId =
    process.env.APIFY_ACTOR_ID || 'apify~instagram-profile-scraper';
  private readonly baseUrl =
    process.env.APIFY_BASE_URL || 'https://api.apify.com/v2';

  private normalizeUsername(input: string): string {
    return input.trim().replace(/^@+/, '');
  }

  async fetchProfile(rawHandle: string): Promise<FetchedInstagramProfile> {
    if (!this.token) {
      throw new InternalServerErrorException('Missing APIFY_TOKEN');
    }

    const handle = this.normalizeUsername(rawHandle);

    if (!handle) {
      throw new NotFoundException('EMPTY_HANDLE');
    }

    const actorInput = {
      usernames: [handle],
    };

    try {
      const runResponse = await fetch(
        `${this.baseUrl}/acts/${encodeURIComponent(this.actorId)}/runs?waitForFinish=120`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(actorInput),
        },
      );

      const runJson = await runResponse.json();

      if (!runResponse.ok || !runJson?.data) {
        throw new InternalServerErrorException(
          runJson?.error?.message || runJson?.error?.type || 'APIFY_RUN_FAILED',
        );
      }

      const datasetId = runJson.data.defaultDatasetId;
      if (!datasetId) {
        throw new InternalServerErrorException('MISSING_DATASET_ID');
      }

      const itemsResponse = await fetch(
        `${this.baseUrl}/datasets/${datasetId}/items?clean=true`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      const items = await itemsResponse.json();

      if (!itemsResponse.ok) {
        throw new InternalServerErrorException('APIFY_DATASET_READ_FAILED');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new NotFoundException('PROFILE_NOT_FOUND');
      }

      const profile = items[0];
      const normalizedHandle = this.normalizeUsername(profile.username || handle);

      return {
        normalizedHandle,
        displayHandle: `@${normalizedHandle}`,
        externalAvatarUrl:
          profile.profilePicUrlHD || profile.profilePicUrl || '',
        provider: 'apify',
      };
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('APIFY_FETCH_FAILED');
    }
  }
}