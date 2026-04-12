import { Module } from '@nestjs/common';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { DesignsModule } from './designs/designs.module';
import { InstagramModule } from './instagram/instagram.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [ActivitiesModule, AuthModule, DesignsModule, InstagramModule, OrdersModule],
})
export class AppModule {}