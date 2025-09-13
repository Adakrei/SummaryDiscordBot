export default () => ({
    discord: {
        botToken: process.env.BOT_TOKEN || '',
        clientId: process.env.CLIENT_ID || ''
    },
    application: {
        port: parseInt(process.env.PORT || '3000', 10)
    }
});
