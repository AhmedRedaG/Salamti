import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  ParseEnumPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { ParamedicStatus } from '../../../generated/prisma/client';
import { CurrentWsUser } from '../../common/decorators/current-ws-user.decorator';
import { ParamedicLocationDto } from './dto/available-paramedic.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/dispatch',
})
export class DispatchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DispatchGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly dispatchService: DispatchService) {}

  afterInit(server: Server) {
    this.logger.log('dispatch websocket gateway initialized');
    this.dispatchService.setServer(server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`client disconnected: ${client.id}`);
    this.dispatchService.handleParamedicDisconnect(client.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:online')
  handleParamedicOnline(
    @ConnectedSocket() client: Socket,
    @CurrentWsUser('sub') userId: string,
  ) {
    return this.dispatchService.handleParamedicConnect(client.id, userId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:location')
  handleParamedicLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ParamedicLocationDto,
    @CurrentWsUser('sub') userId: string,
  ) {
    return this.dispatchService.updateParamedicLocation(
      userId,
      dto.longitude,
      dto.latitude,
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:status')
  async handleParamedicStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody(
      'status',
      new ParseEnumPipe({ enum: ParamedicStatus, optional: true }),
    )
    status: ParamedicStatus | undefined,
    @CurrentWsUser('sub') userId: string,
  ) {
    return this.dispatchService.updateParamedicStatus(userId, status);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('accident:accept')
  handleAccidentAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody('accidentId', ParseUUIDPipe) accidentId: string,
    @CurrentWsUser('sub') userId: string,
  ) {
    return this.dispatchService.acceptAccident(userId, accidentId);
  }
}
