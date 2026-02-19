const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const BotHandlers = require('./src/bot_handlers');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing in environment variables.');
    process.exit(1);
}

const bot = new Telegraf(token);

// Middleware for logging (optional)
bot.use((ctx, next) => {
    console.log(`[${new Date().toISOString()}] ${ctx.from?.username || ctx.from?.id}: ${ctx.message?.text || 'Non-text message'}`);
    return next();
});

// Commands
bot.start((ctx) => BotHandlers.start(ctx));
bot.command('profile', (ctx) => BotHandlers.showProfile(ctx));
bot.command('workout', (ctx) => BotHandlers.generateWorkout(ctx));
bot.command('diet', (ctx) => BotHandlers.generateDiet(ctx));
bot.command('progress', (ctx) => BotHandlers.logProgress(ctx));
bot.command('motivation', (ctx) => BotHandlers.sendMotivation(ctx));
bot.command('reset', (ctx) => {
    // Hidden command to clear profile (for testing)
    const userId = ctx.from.id;
    // We would need a UserService.deleteProfile but for now we just show start again
    ctx.reply('If you want to reset, please contact support or wait for future updates. For now, you can just type /start to see if you can override.');
});

// Help command
bot.help((ctx) => {
    ctx.reply(`Available commands:\n/start - Begin your journey\n/profile - View your profile\n/workout - Get a workout plan\n/diet - Get a nutrition plan\n/motivation - Get a daily boost\n\nYou can also just talk to me!`);
});

// Handle all other messages (onboarding flow or AI chat)
bot.on('text', (ctx) => BotHandlers.handleMessage(ctx));

// Handle errors
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('An unexpected error occurred. Please try again later.');
});

// Launch
bot.launch()
    .then(() => {
        console.log('✅ AI FITCOACH PRO is running...');
        console.log('Bot username:', bot.botInfo?.username);
    })
    .catch((err) => {
        console.error('❌ Failed to launch bot:', err);
        process.exit(1);
    });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
