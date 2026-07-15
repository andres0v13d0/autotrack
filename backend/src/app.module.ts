import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SettingsModule } from './modules/settings/settings.module';
import { User } from './modules/users/user.entity';
import { Customer } from './modules/customers/customer.entity';
import { Vehicle } from './modules/vehicles/vehicle.entity';
import { WorkOrder } from './modules/work-orders/work-order.entity';
import { WorkOrderItem } from './modules/work-orders/work-order-item.entity';
import { IntakeForm } from './modules/work-orders/intake-form.entity';
import { Payment } from './modules/payments/payment.entity';
import { Setting } from './modules/settings/setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const nodeEnv = config.get<string>('NODE_ENV', 'development');

        // Producción: usar DATABASE_URL si existe y es válida
        if (nodeEnv === 'production' && databaseUrl && databaseUrl.startsWith('postgresql://')) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Customer, Vehicle, WorkOrder, WorkOrderItem, IntakeForm, Payment, Setting],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
            logging: false,
          };
        }

        // Desarrollo: siempre usar credenciales individuales
        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5432),
          username: config.get<string>('DATABASE_USER', 'postgres'),
          password: config.get<string>('DATABASE_PASSWORD', ''),
          database: config.get<string>('DATABASE_NAME', 'shop_management'),
          entities: [User, Customer, Vehicle, WorkOrder, WorkOrderItem, IntakeForm, Payment, Setting],
          synchronize: true,
          logging: ['error', 'warn'],
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CustomersModule,
    VehiclesModule,
    WorkOrdersModule,
    PaymentsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
