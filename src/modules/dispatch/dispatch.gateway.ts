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
  ParseUUIDPipe,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { CurrentWsUser } from '../../common/decorators/current-ws-user.decorator';
import { ParamedicsService } from '../paramedics/paramedics.service';
import { ParamedicLocationDto } from '../paramedics/dto/paramedic-location.dto';
import { WsExceptionFilter } from '../../common/exceptions-filters/ws-exception.filter';

@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
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

  constructor(
    private readonly dispatchService: DispatchService,
    private readonly paramedicsService: ParamedicsService,
  ) {}

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
    return this.paramedicsService.updateParamedicLocation(userId, dto);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:available')
  paramedicAvailable(
    @MessageBody() dto: ParamedicLocationDto,
    @CurrentWsUser('sub') userId: string,
  ) {
    return this.paramedicsService.paramedicAvailable(userId, dto);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:unavailable')
  paramedicUnavailable(@CurrentWsUser('sub') userId: string) {
    return this.paramedicsService.paramedicUnavailable(userId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('paramedic:status')
  async getParamedicStatus(@CurrentWsUser('sub') userId: string) {
    return this.paramedicsService.getParamedicStatus(userId);
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
