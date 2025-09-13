import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
    data: Partial<SlashCommandBuilder>;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
