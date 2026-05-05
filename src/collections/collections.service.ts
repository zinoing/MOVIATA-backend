import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getR2Client } from '../lib/r2';

export interface CollectionItem {
  fileName: string;
  imageUrl: string;
  title: string;
  date: string;
  time: string;
  shirtColor: 'white' | 'black';
}

@Injectable()
export class CollectionsService {
  async listCollections(): Promise<{ collections: CollectionItem[] }> {
    let keys: string[];
    try {
      const response = await getR2Client().send(
        new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }),
      );
      keys = (response.Contents ?? []).map((obj) => obj.Key!).filter(Boolean);
    } catch (err) {
      throw new InternalServerErrorException('R2 목록 조회 실패: ' + (err as Error).message);
    }

    const pattern = /^(\d{8})_(\d{6})_(.+)\.png$/;

    const collections = keys
      .map((key) => {
        const fileName = key.split('/').pop()!;
        const match = fileName.match(pattern);
        if (!match) return null;
        const [, d, t, body] = match;
        const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        const time = `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;

        const colorMatch = body.match(/^(.+)_(white|black)$/);
        const shirtColor: 'white' | 'black' = colorMatch ? (colorMatch[2] as 'white' | 'black') : 'white';
        const titleRaw = colorMatch ? colorMatch[1] : body;
        const title = titleRaw.replace(/_/g, ' ');

        const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
        return { fileName, imageUrl, title, date, time, shirtColor };
      })
      .filter((item): item is CollectionItem => item !== null)
      .sort((a, b) => {
        const aKey = `${a.date}_${a.time}`;
        const bKey = `${b.date}_${b.time}`;
        return bKey.localeCompare(aKey);
      });

    return { collections };
  }
}
