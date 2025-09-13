import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    Collection,
    Events
} from 'discord.js';
import { DiscordClient } from './discord.types';
import { Event } from './events/event.interface';
import { Command } from './commands/command.interface';

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DiscordService.name);
    private client: DiscordClient;
    private commands = new Collection<string, Command>();

    constructor(
        private configService: ConfigService,
        private events: Event<any>[],
        private commandList: Command[]
    ) {
        // Create client with correct type casting
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Apply custom properties to the client
        this.client = Object.assign(client, {
            customIsReady: false
        }) as DiscordClient;

        // Register commands
        for (const command of this.commandList) {
            if (command.data && command.data.name) {
                this.commands.set(command.data.name, command);
            }
        }
    }

    async onModuleInit() {
        // Log environment state
        this.logger.debug(`Current working directory: ${process.cwd()}`);
        this.logger.debug(
            `Environment variables loaded: ${Object.keys(process.env).length}`
        );

        const botToken = this.configService.get<string>('discord.botToken');
        const clientId = this.configService.get<string>('discord.clientId');

        this.logger.debug(`BOT_TOKEN exists: ${!!botToken}`);
        this.logger.debug(`CLIENT_ID exists: ${!!clientId}`);

        if (!botToken || !clientId) {
            this.logger.error(
                'Missing Discord configuration. Please set BOT_TOKEN and CLIENT_ID environment variables.'
            );
            return;
        }

        // Register event handlers
        this.registerEventHandlers();

        // Register slash commands
        await this.registerCommands(botToken, clientId);

        // Login to Discord
        try {
            await this.client.login(botToken);
            this.logger.log('Discord bot is now online!');
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to login: ${errorMessage}`);
        }
    }

    async onModuleDestroy() {
        if (this.client.customIsReady) {
            this.logger.log('Shutting down Discord bot...');
            this.client.destroy();
        }
    }

    private registerEventHandlers() {
        // Register once/on events from the event handlers
        for (const event of this.events) {
            if (event.once) {
                this.client.once(event.name, (...args) =>
                    event.execute(...args)
                );
            } else {
                this.client.on(event.name, (...args) => event.execute(...args));
            }
        }

        // Handle ready event
        this.client.once(Events.ClientReady, (client) => {
            this.client.customIsReady = true;
            this.logger.log(`Bot logged in as ${client.user.tag}`);
        });
    }

    private async registerCommands(token: string, clientId: string) {
        try {
            // Create a filtered array of valid commands first
            const validCommands = this.commandList.filter(
                (command) =>
                    command?.data &&
                    command.data.toJSON &&
                    typeof command.data.toJSON === 'function'
            );

            // Then map the valid commands to their JSON representation
            const commandsData = validCommands.map((command) => {
                // We know toJSON exists at this point
                const toJSON = command.data.toJSON as () => any;
                return toJSON();
            });

            const rest = new REST({ version: '10' }).setToken(token);
            this.logger.log('Started refreshing application (/) commands.');

            await rest.put(Routes.applicationCommands(clientId), {
                body: commandsData
            });

            this.logger.log(
                'Successfully registered application (/) commands.'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to register commands: ${errorMessage}`);
        }
    }
}
