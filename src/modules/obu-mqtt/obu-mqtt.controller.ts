import { Controller } from '@nestjs/common';
import { ObuMqttService } from './obu-mqtt.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import appConfig from '../../config/app.config';
import type { ObuAccidentAlert } from '../../types/obu-mqtt.types';

const BASE_TOPIC_NAME = appConfig().mqtt.baseTopic;

@Controller('obu-mqtt')
export class ObuMqttController {
  constructor(private readonly obuMqttService: ObuMqttService) {}

  @EventPattern(`${BASE_TOPIC_NAME}+/reply`)
  handleReply(@Payload() data: ObuAccidentAlert) {
    switch (data.event) {
      case 'AUTO_CRASH_DETECTED':
      case 'MANUAL_SOS_REQUEST':
        return this.obuMqttService.handleAccidentAlert(data);
      case 'ALARM_CANCELED_BY_DRIVER':
        return this.obuMqttService.handleAlarmCanceledByDriver(data);
      default:
        break;
    }
  }
}
