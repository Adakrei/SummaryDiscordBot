import { MessageCreateHandler } from './message-create.handler';
import { Message } from 'discord.js';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
    Injectable: () => (target: any) => target, // Mock Injectable decorator
    Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        error: jest.fn()
    }))
}));

describe('MessageCreateHandler', () => {
    let handler: MessageCreateHandler;
    let mockMessage: jest.Mocked<Message>;

    beforeEach(() => {
        handler = new MessageCreateHandler();
        mockMessage = {
            author: { bot: false },
            content: 'Hello',
            reply: jest.fn().mockResolvedValue(undefined)
        } as unknown as jest.Mocked<Message>;
    });

    it('should ignore messages from bots', async () => {
        mockMessage.author.bot = true;
        await handler.execute(mockMessage);
        expect(mockMessage.reply).not.toHaveBeenCalled();
    });

    it('should do nothing when message has no web.pcc.gov.tw link', async () => {
        await handler.execute(mockMessage);
        expect(mockMessage.reply).not.toHaveBeenCalled();
    });

    it('should reply with tender title as 發包單位：案件名稱', async () => {
        // Mock a table structure similar to Pcc tender pages
        const html = `
            <table>
              <tr><th>機關名稱</th><td><span>高雄市小港區漢民國民小學</span></td></tr>
              <tr><th>標案名稱</th><td>114學年度六年級專題性戶外教育</td></tr>
            </table>`;
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => html
        });

        mockMessage.content =
            'https://web.pcc.gov.tw/tps/QueryTender/query/searchTenderDetail?pkPmsMain=abc';

        await handler.execute(mockMessage);

        expect(mockMessage.reply).toHaveBeenCalled();
        const arg = (mockMessage.reply as jest.Mock).mock.calls[0][0];
        expect(arg).toHaveProperty('embeds');
        const embed = arg.embeds[0].data || arg.embeds[0];
        expect(embed.title).toBe(
            '高雄市小港區漢民國民小學：114學年度六年級專題性戶外教育'
        );
        expect(embed.url).toContain('https://web.pcc.gov.tw/tps/');
    });

    it('should ignore links under /pis path', async () => {
        (global as any).fetch = jest.fn();
        mockMessage.content = 'https://web.pcc.gov.tw/pis/some/path';
        await handler.execute(mockMessage);
        expect(mockMessage.reply).not.toHaveBeenCalled();
        expect((global as any).fetch).not.toHaveBeenCalled();
    });
});
