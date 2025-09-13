import { InteractionCreateHandler } from './interaction-create.handler';
import { HelloWorldCommand } from '../commands/hello-world.command';
import { Interaction, ChatInputCommandInteraction } from 'discord.js';

jest.mock('@nestjs/common', () => ({
    Injectable: () => (target: any) => target, // Mock Injectable decorator
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        error: jest.fn()
    }))
}));

describe('InteractionCreateHandler', () => {
    let handler: InteractionCreateHandler;
    let helloWorldCommand: HelloWorldCommand;
    let mockInteraction: jest.Mocked<ChatInputCommandInteraction>;

    beforeEach(() => {
        helloWorldCommand = new HelloWorldCommand();
        handler = new InteractionCreateHandler(helloWorldCommand);
        mockInteraction = {
            isChatInputCommand: jest.fn().mockReturnValue(true),
            commandName: 'helloworld',
            reply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            deferred: false,
            replied: false
        } as unknown as jest.Mocked<ChatInputCommandInteraction>;

        jest.spyOn(helloWorldCommand, 'execute').mockResolvedValue(undefined);
    });

    it('should execute HelloWorldCommand if interaction commandName is helloworld', async () => {
        await handler.execute(mockInteraction);
        expect(helloWorldCommand.execute).toHaveBeenCalledWith(mockInteraction);
    });

    it('should not execute anything if interaction is not a chat input command', async () => {
        mockInteraction.isChatInputCommand.mockReturnValue(false);
        await handler.execute(mockInteraction);
        expect(helloWorldCommand.execute).not.toHaveBeenCalled();
    });

    it('should handle errors and send a followUp message if interaction is deferred', async () => {
        mockInteraction.deferred = true;
        jest.spyOn(helloWorldCommand, 'execute').mockRejectedValue(
            new Error('Test Error')
        );

        await handler.execute(mockInteraction);
        expect(mockInteraction.followUp).toHaveBeenCalledWith({
            content: 'There was an error executing this command!',
            ephemeral: true
        });
    });

    it('should handle errors and send a reply if interaction is not deferred', async () => {
        jest.spyOn(helloWorldCommand, 'execute').mockRejectedValue(
            new Error('Test Error')
        );

        await handler.execute(mockInteraction);
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'There was an error executing this command!',
            ephemeral: true
        });
    });
});
