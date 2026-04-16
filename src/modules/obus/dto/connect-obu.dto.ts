import { IsUUID } from 'class-validator';

export class ConnectObuDto {
  @IsUUID()
  vehicleId!: string;
}
