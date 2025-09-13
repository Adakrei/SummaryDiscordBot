import { MessageCreateHandler } from './message-create.handler';
import { InteractionCreateHandler } from './interaction-create.handler';

export const EVENTS = [MessageCreateHandler, InteractionCreateHandler];
