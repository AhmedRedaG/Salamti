import { Controller } from '@nestjs/common';
import { ObuMqttService } from './obu-mqtt.service';

@Controller('obu-mqtt')
export class ObuMqttController {
  constructor(private readonly obuMqttService: ObuMqttService) {}
}
