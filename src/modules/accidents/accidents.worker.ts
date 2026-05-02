import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QueueNames } from '../../types/queue.types';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { forwardRef, Inject } from '@nestjs/common';

@Processor(QueueNames.ACCIDENT)
export class AccidentWorker extends WorkerHost {
  private readonly logger = new Logger(AccidentWorker.name);

  constructor(
    private readonly accidentService: AccidentsService,
    @Inject(forwardRef(() => DispatchService))
    private readonly dispatchService: DispatchService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    this.logger.log('accident worker started');

    try {
      switch (job.name) {
        case 'createAccident':
          await this.accidentService.createAccident(job.data);
          break;
        case 'confirmAccident':
          await this.accidentService.confirmAccident(job.data.accidentId);
          await this.dispatchService.handleConfirmedAccident(
            job.data.accidentId,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `error processing accident job ${job.id}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
