import { Module, forwardRef } from '@nestjs/common';
import { ObuMqttService } from './obu-mqtt.service';
import { ObuMqttController } from './obu-mqtt.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import appConfig from '../../config/app.config';
import { ConfigService } from '@nestjs/config';
import { AccidentsModule } from '../accidents/accidents.module';

const mqttConfig = appConfig().mqtt;
const MQTT_CLIENT_NAME = mqttConfig.clientName;

@Module({
  imports: [
    // note that iam not using TLS because my obu network module doesn't support it
    // and its processing power is limited to apply encryption on the data
    // in real world app i will use private mqtt with TLS
    ClientsModule.registerAsync([
      {
        name: MQTT_CLIENT_NAME,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            url: `mqtt://${configService.get('mqtt.host')}:${configService.get('mqtt.port')}`,
            subscribeOptions: { qos: 1 },
          },
        }),
      },
    ]),
    forwardRef(() => AccidentsModule),
  ],
  controllers: [ObuMqttController],
  providers: [ObuMqttService],
  exports: [ObuMqttService],
})
export class ObuMqttModule {}
