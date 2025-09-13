import { Injectable, Logger } from '@nestjs/common';
import { EmbedBuilder, Message } from 'discord.js';
import { Event } from './event.interface';

@Injectable()
export class MessageCreateHandler implements Event<'messageCreate'> {
    private readonly logger = new Logger(MessageCreateHandler.name);
    name = 'messageCreate' as const;
    once = false;

    async execute(message: Message) {
        // Ignore messages from bots (including our own)
        if (message.author.bot) return;
        // Detect links under web.pcc.gov.tw and reply with titled embeds
        const links = this.extractPccLinks(message.content);
        if (links.length === 0) return;

        try {
            const limited = Array.from(new Set(links)).slice(0, 5);
            const embeds: EmbedBuilder[] = [];

            await Promise.all(
                limited.map(async (url) => {
                    try {
                        const title = await this.fetchPageTitle(url);
                        const safeTitle = this.truncate(title || url, 256);
                        const embed = new EmbedBuilder()
                            .setTitle(safeTitle)
                            .setURL(url);
                        embeds.push(embed);
                    } catch (err) {
                        this.logger.error(
                            `Failed to fetch title for ${url}: ${err instanceof Error ? err.message : String(err)}`
                        );
                    }
                })
            );

            if (embeds.length > 0) {
                await message.reply({ embeds });
            }
        } catch (error) {
            this.logger.error(
                `Error handling message: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private extractPccLinks(text: string): string[] {
        const regex =
            /(https?:\/\/)(?:www\.)?web\.pcc\.gov\.tw\/tps[^\s<>)]*/gi;
        const matches = text.match(regex) || [];
        // Normalize: remove trailing punctuation like '>' or ')' if present
        return matches
            .map((m) => m.replace(/[)>\],.;:!?]+$/g, ''))
            .filter((m) => {
                try {
                    const u = new URL(m);
                    return (
                        u.hostname.toLowerCase() === 'web.pcc.gov.tw' &&
                        u.pathname.toLowerCase().startsWith('/tps')
                    );
                } catch {
                    return false;
                }
            });
    }

    private async fetchPageTitle(url: string): Promise<string | null> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; SummaryBot/1.0; +https://discord.com)',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
                    Referer: 'https://web.pcc.gov.tw/tps/'
                }
            } as any);
            if (!res.ok) return null;
            const html = await res.text();
            const redirect = this.extractMetaRefreshUrl(html, url);
            if (redirect) {
                const res2 = await fetch(redirect, {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (compatible; SummaryBot/1.0; +https://discord.com)',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
                        Referer: url
                    }
                } as any);
                if (res2.ok) {
                    const html2 = await res2.text();
                    return this.parseTitle(html2);
                }
            }
            return this.parseTitle(html);
        } finally {
            clearTimeout(timeout);
        }
    }

    private extractMetaRefreshUrl(
        html: string,
        baseUrl: string
    ): string | null {
        const m = html.match(
            /<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)["']?[^>]*>/i
        );
        if (m && m[1]) {
            try {
                return new URL(m[1], baseUrl).toString();
            } catch {
                return null;
            }
        }
        return null;
    }

    private parseTitle(html: string): string | null {
        // Try to construct a tender title: 機關名稱：標案名稱
        const tender = this.parseTenderTitle(html);
        if (tender) return tender;

        // Fallbacks: og:title then <title>
        const ogMatch = html.match(
            /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
        );
        if (ogMatch && ogMatch[1])
            return this.decodeEntities(ogMatch[1].trim());
        const titleMatch = html.match(
            /<title[^>]*>\s*([^<\n\r]+)\s*<\/title>/i
        );
        if (titleMatch && titleMatch[1])
            return this.decodeEntities(titleMatch[1].trim());
        return null;
    }

    private parseTenderTitle(html: string): string | null {
        const agency =
            this.extractLabeledField(html, '機關名稱') ||
            this.extractLabeledField(html, '機關名稱(機關)');
        const subject =
            this.extractLabeledField(html, '標案名稱') ||
            this.extractLabeledField(html, '標案案名');
        if (agency && subject) {
            return `${agency}：${subject}`;
        }
        return null;
    }

    private extractLabeledField(html: string, label: string): string | null {
        const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns: RegExp[] = [
            // <th>標案名稱</th><td>xxx</td> or <td>標案名稱</td><td>xxx</td> (允許內嵌標籤)
            new RegExp(
                `<t[hd][^>]*>\\s*${esc}\\s*[:：]?\\s*<\\/t[hd]>\\s*<t[hd][^>]*>([\\s\\S]*?)<\\/t[hd]>`,
                'i'
            ),
            // 標籤與值在同一 cell：標案名稱：xxx
            new RegExp(`${esc}\\s*[:：]\\s*([^<\\n\\r]{1,150})`, 'i')
        ];
        for (const re of patterns) {
            const m = html.match(re);
            if (m && m[1]) return this.cleanText(this.stripTags(m[1]));
        }
        return null;
    }

    private cleanText(input: string): string {
        const text = this.decodeEntities(input)
            .replace(/\s+/g, ' ')
            .replace(/[\u00A0\u3000]/g, ' ')
            .trim();
        return text;
    }

    private stripTags(input: string): string {
        return input.replace(/<[^>]*>/g, ' ');
    }

    private decodeEntities(str: string): string {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }

    private truncate(str: string, max: number): string {
        return str.length > max ? str.slice(0, max - 1) + '…' : str;
    }
}
