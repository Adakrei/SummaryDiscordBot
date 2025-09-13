import { Client, ClientOptions } from 'discord.js';

export interface DiscordConfig {
    botToken: string;
    clientId: string;
}

export interface DiscordClient extends Client<true> {
    customIsReady: boolean;
}
