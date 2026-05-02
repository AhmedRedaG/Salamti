import { Controller } from '@nestjs/common';
import { AccidentsService } from './accidents.service';

@Controller('accidents')
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}
}
