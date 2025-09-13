import { Injectable, Logger } from '@nestjs/common';
import { Interaction } from 'discord.js';
import { Event } from './event.interface';
import { HelloWorldCommand } from '../commands/hello-world.command';

@Injectable()
export class InteractionCreateHandler implements Event<'interactionCreate'> {
    private readonly logger = new Logger(InteractionCreateHandler.name);
    name = 'interactionCreate' as const;
    once = false;

    constructor(private readonly helloWorldCommand: HelloWorldCommand) {}

    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        try {
            if (interaction.commandName === 'helloworld') {
                await this.helloWorldCommand.execute(interaction);
            }
        } catch (error) {
            this.logger.error(`Error handling interaction: ${error.message}`);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            }
        }
    }
}
