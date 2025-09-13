import { HelloWorldCommand } from './hello-world.command';
import { ChatInputCommandInteraction } from 'discord.js';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
    Injectable: () => (target: any) => target, // Mock Injectable decorator
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        error: jest.fn()
    }))
}));
describe('HelloWorldCommand', () => {
    let command: HelloWorldCommand;
    let mockInteraction: jest.Mocked<ChatInputCommandInteraction>;

    beforeEach(() => {
        command = new HelloWorldCommand();
        mockInteraction = {
            reply: jest.fn().mockResolvedValue(undefined)
        } as unknown as jest.Mocked<ChatInputCommandInteraction>;
    });

    it('should reply with "Hello World!" when executed', async () => {
        await command.execute(mockInteraction);
        expect(mockInteraction.reply).toHaveBeenCalledWith('Hello World!');
    });
});
