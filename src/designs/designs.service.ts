import { Injectable } from '@nestjs/common';

export interface Design {
  id: number;
  activityId: number;
  theme: string;
  routeColor: string;
  metadata: any;
}

@Injectable()
export class DesignsService {
  private designs: Design[] = [];

  list(): Design[] {
    return this.designs;
  }

  get(id: number): Design | undefined {
    return this.designs.find((d) => d.id === id);
  }

  create(body: any): { success: boolean; design: Design } {
    const design: Design = {
      id: this.designs.length + 1,
      activityId: body.activityId || 0,
      theme: body.theme || 'default',
      routeColor: body.routeColor || '#000000',
      metadata: body.metadata || {},
    };
    this.designs.push(design);
    return { success: true, design };
  }
}