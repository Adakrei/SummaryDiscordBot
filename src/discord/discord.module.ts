import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscordService } from './discord.service';
import { COMMANDS } from './commands';
import { EVENTS } from './events';

@Module({
    imports: [ConfigModule],
    providers: [
        ...COMMANDS,
        ...EVENTS,
        {
            provide: 'DISCORD_COMMANDS',
            useFactory: (...commands) => commands,
            inject: [...COMMANDS]
        },
        {
            provide: 'DISCORD_EVENTS',
            useFactory: (...events) => events,
            inject: [...EVENTS]
        },
        {
            provide: DiscordService,
            useFactory: (configService, events, commands) => {
                return new DiscordService(configService, events, commands);
            },
            inject: [ConfigService, 'DISCORD_EVENTS', 'DISCORD_COMMANDS']
        }
    ],
    exports: [DiscordService]
})
export class DiscordModule {}
