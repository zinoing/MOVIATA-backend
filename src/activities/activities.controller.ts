import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('api/v1/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async list() {
    return await this.activitiesService.list();
  }

  @Post('upload')
  upload(@Body() body: any) {
    // In a real implementation, body would include the uploaded file data or a reference
    return this.activitiesService.upload(body);
  }

  /**
   * Retrieve detailed information for a single activity by ID.  Returns null
   * if no access token is present or the ID is invalid.
   */
  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.activitiesService.getActivity(id);
  }
}