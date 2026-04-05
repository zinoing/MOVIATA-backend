import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Design, DesignsService } from './designs.service';

@Controller('api/v1/designs')
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Get()
  list(): Design[] {
    return this.designsService.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Design | undefined {
    return this.designsService.get(Number(id));
  }

  @Post()
  create(@Body() body: any): { success: boolean; design: Design } {
    return this.designsService.create(body);
  }
}