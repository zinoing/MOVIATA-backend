import { Controller, Get } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('api/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list() {
    return this.collectionsService.listCollections();
  }
}
