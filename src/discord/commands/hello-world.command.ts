import { Injectable, Logger } from '@nestjs/common';
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from './command.interface';

@Injectable()
export class HelloWorldCommand implements Command {
    private readonly logger = new Logger(HelloWorldCommand.name);

    data = {
        name: 'helloworld',
        description: 'Replies with Hello World!',
        toJSON: () => {
            try {
                const builder = new SlashCommandBuilder()
                    .setName('helloworld')
                    .setDescription('Replies with Hello World!');

                this.logger.debug('Built SlashCommandBuilder successfully');
                this.logger.debug(`Command name: ${builder.name}`);
                this.logger.debug(
                    `Command description: ${builder.description}`
                );

                const json = builder.toJSON();
                this.logger.debug(`JSON result: ${JSON.stringify(json)}`);
                return json;
            } catch (error) {
                this.logger.error(
                    `Error creating command JSON: ${error.message}`
                );
                // Return a minimal valid command structure
                return {
                    name: 'helloworld',
                    description: 'Replies with Hello World!',
                    type: 1
                };
            }
        }
    };

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Hello World!');
    }
}
