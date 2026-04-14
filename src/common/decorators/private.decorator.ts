import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './public.decorator';

export const Private = () => SetMetadata(IS_PUBLIC_KEY, false);
