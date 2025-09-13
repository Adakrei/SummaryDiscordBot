# NestJS Discord Bot

A Discord bot built with NestJS and Discord.js that echoes messages and responds to a simple `/helloworld` slash command.

## Features

- **Message Echo**: Replies to user messages by appending "-bot" to the original message
- **Hello World Command**: Responds with "Hello World!" when users type `/helloworld`
- **Modular Architecture**: Built using NestJS's modular design patterns
- **TypeScript Support**: Fully typed for better developer experience

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Discord account and bot token
- Discord server with admin access

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/discord-bot.git
cd discord-bot
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a .env file in the root directory:
```
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
```

## Setup Discord Bot
1. Go to the Discord Developer Portal
2. Create a new application and add bot
3. Enable the following Privileged Gateway Intents:
  - Message content intent
  - Server member intent
4. Copy your bot token and client ID to the `.env` file
5. Generate an invite URL with the following permissions:
  - bot
  - applications.commands
  - send messages
  - Read message History
6. Invite the bot to your server using the generated URL

## Project Structure
```
src/
├── config/                 # Configuration settings
├── discord/
│   ├── commands/           # Slash command definitions
│   ├── events/             # Event handlers (messages, interactions)
│   ├── discord.module.ts   # Discord module definition
│   └── discord.service.ts  # Core Discord service
├── app.controller.ts       # Main application controller
├── app.module.ts           # Main application module
├── app.service.ts          # Application service
└── main.ts                 # Application entry point
```

## Running the Bot

### Development
```bash
# Watch mode
pnpm start:dev
```

### Production
```bash
# Build
pnpm build

# Run in producation mode
pnpm start:prod
```

## Testing

The project includes unit tests and integration tests for all components:


```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage
pnpm test:cov
```

## Adding New Commands
1. Create a new command class in the `src/discord/commands` directory:

```typescript
import { Injectable } from '@nestjs/common';
import { SlashCommandBuilder } from 'discord.js';
import { Command } from './command.interface';

@Injectable()
export class MyNewCommand implements Command {
  data = {
    name: 'mycommand',
    description: 'Description of my command',
    toJSON: () => {
      return new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('Description of my command')
        .toJSON();
    }
  };

  async execute(interaction) {
    await interaction.reply('This is my new command!');
  }
}
```

2. Register the command in `discord.module.ts`
```typescript
@Module({
  providers: [
    // ... other providers
    MyNewCommand,
    {
      provide: 'DISCORD_COMMANDS',
      useFactory: (...commands) => commands,
      inject: [
        // ... other commands
        MyNewCommand,
      ],
    },
  ],
})
```



## Event Handling
The bot handle two main types of events:
1. **Message Create Event**: Triggered when a user sends a message
2. **Interaction Create Event**: Triggered when a user uses a slash command

To add a new event handler, create a class in the `src/discord/events` directory that implements the `Event` interface.

## Deployment
This bot can be deployed to any Node.js hosting environment. Just make sure to:

1. Set the environment variables (BOT_TOKEN, CLIENT_ID)
2. Install dependencies with `pnpm install --production`
3. Build the project with `pnpm build`
4. Start the server with `pnpm start:prod`

## Acknowledgements

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Discord.js](https://discord.js.org/) - Node.js module to interact with the Discord API