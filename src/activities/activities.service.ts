import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import * as https from 'https';

@Injectable()
export class ActivitiesService {
  constructor(private readonly authService: AuthService) {}

  /**
   * Fetch a list of recent activities for the currently authenticated user
   * from Strava.  If no access token has been stored yet, returns an
   * empty array.  This method uses Node's built‑in https module to
   * perform a GET request to the Strava API.  See
   * https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
   */
  async list(): Promise<any[]> {
    const accessToken = this.authService.getLatestAccessToken();
    if (!accessToken) {
      // When there is no stored access token, the user has not connected
      // their Strava account.  To allow the front‑end to distinguish
      // between an empty activity list and a missing connection, throw
      // an UnauthorizedException.  NestJS will translate this into
      // an HTTP 401 response, allowing the client to display an
      // appropriate message.
      throw new (await import('@nestjs/common')).UnauthorizedException(
        'No Strava access token found',
      );
    }
    return await this.fetchActivitiesFromStrava(accessToken);
  }

  /**
   * Placeholder for handling manual uploads of GPX/TCX/FIT files.
   * Currently returns a simple object and does not persist data.
   */
  upload(body: any) {
    return { success: true, activity: body };
  }

  /**
   * Retrieve detailed information about a single activity from Strava by ID.  If
   * no access token has been stored yet, returns null.  This uses the
   * GET /api/v3/activities/{id} endpoint which returns a DetailedActivity
   * object containing all available fields for the activity.
   */
  async getActivity(id: string): Promise<any | null> {
    const accessToken = this.authService.getLatestAccessToken();
    if (!accessToken) {
      // Throw UnauthorizedException so the front‑end knows to prompt
      // the user to reconnect.
      throw new (await import('@nestjs/common')).UnauthorizedException(
        'No Strava access token found',
      );
    }
    return await this.fetchActivityFromStrava(accessToken, id);
  }

  private fetchActivitiesFromStrava(accessToken: string): Promise<any[]> {
    const options: https.RequestOptions = {
      hostname: 'www.strava.com',
      path: '/api/v3/athlete/activities?per_page=30',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', (err) => reject(err));
      req.end();
    });
  }

  /**
   * Fetch a single activity's detailed representation from Strava.
   */
  private fetchActivityFromStrava(accessToken: string, activityId: string): Promise<any> {
    const options: https.RequestOptions = {
      hostname: 'www.strava.com',
      path: `/api/v3/activities/${activityId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', (err) => reject(err));
      req.end();
    });
  }
}