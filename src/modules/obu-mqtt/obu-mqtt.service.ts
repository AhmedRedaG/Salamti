import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import appConfig from '../../config/app.config';
import { ObuAccidentAlert, ObuMqttCommands } from '../../types/obu-mqtt.types';
import {
  catchError,
  firstValueFrom,
  lastValueFrom,
  timeout,
  toArray,
} from 'rxjs';
import { AccidentsService } from '../accidents/accidents.service';
import { AccidentType } from '../../../generated/prisma/enums';

const mqttConfig = appConfig().mqtt;
const MQTT_CLIENT_NAME = mqttConfig.clientName;
const MQTT_BASE_TOPIC = mqttConfig.baseTopic;

@Injectable()
export class ObuMqttService {
  private readonly logger = new Logger(ObuMqttService.name);

  constructor(
    @Inject(MQTT_CLIENT_NAME) private readonly mqttClient: ClientProxy,
    @Inject(forwardRef(() => AccidentsService))
    private readonly accidentsService: AccidentsService,
  ) {}

  async handleAccidentAlert(data: ObuAccidentAlert) {
    const { event, inst, lat, lng, ...restData } = data;

    if (!lat || !lng) {
      this.logger.warn(`missing lat/lng for accident alert from ${inst}`);
      return;
    }

    // convert accident event to accident type
    const type: AccidentType =
      event === 'MANUAL_SOS_REQUEST'
        ? AccidentType.SOS
        : AccidentType.ACCIDENTS;

    // store accident and create a job to confirm the accident
    await this.accidentsService.queueCreateAccident({
      obuInst: inst,
      type,
      lat,
      lng,
      ...restData,
    });
  }

  async handleAlarmCanceledByDriver(data: ObuAccidentAlert) {
    await this.accidentsService.cancelAccident(data.inst);
  }

  // FEATURE PLAN
  // handleAccidentDataDump(data: ObuDataDumpChunk) {}

  // ================= he;per methods =================

  async sendSingleCommand(
    targetTopic: string,
    action: ObuMqttCommands,
    payload: any = {},
  ) {
    const requestPayload = {
      action,
      ...payload,
    };
    try {
      // firstValueFrom waits for the very first message with isDisposed: true
      const response = await firstValueFrom(
        this.mqttClient.send(targetTopic, requestPayload).pipe(
          // abort if the OBU doesnt reply within 5 seconds
          timeout(1000 * 30), // 30 seconds
          catchError((err) => {
            throw new RequestTimeoutException(
              `OBU did not respond to '${action}' command.`,
            );
          }),
        ),
      );

      this.logger.log(`Single response received for ${action}:`, response);
      return response;
    } catch (error) {
      this.logger.warn(`Failed to execute single command: ${action}`, error);
      throw error;
    }
  }

  async requestChunkedData(
    targetTopic: string,
    action: string,
    payload: any = {},
  ) {
    const requestPayload = { action, ...payload };

    try {
      const rawChunks = await lastValueFrom(
        this.mqttClient.send(targetTopic, requestPayload).pipe(
          // collect all stream emissions into a single array
          toArray(),
          timeout(1000 * 60 * 10), // history can be large and take time to transfer
          catchError((err) => {
            throw new RequestTimeoutException(
              `OBU chunk transfer timed out for '${action}'.`,
            );
          }),
        ),
      );

      this.logger.log(`Received ${rawChunks.length} chunks from OBU.`);

      const sortedChunks = rawChunks.sort((a, b) => a.chunk - b.chunk);

      // combine all the "data" arrays from each chunk into one massive array
      let combinedData = [];
      for (const chunk of sortedChunks) {
        if (chunk.data && Array.isArray(chunk.data)) {
          combinedData = combinedData.concat(chunk.data);
        }
      }

      return {
        totalReceivedChunks: sortedChunks.length,
        expectedChunks: sortedChunks[0]?.total_chunks || 0,
        type: sortedChunks[0]?.type,
        data: combinedData,
      };
    } catch (error) {
      this.logger.warn(`Failed to download chunks for: ${action}`, error);
      throw error;
    }
  }

  generatePublishTopicName(instNumber: string) {
    return MQTT_BASE_TOPIC + instNumber;
  }
}
