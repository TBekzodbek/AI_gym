const { Markup } = require('telegraf');
const UserService = require('./services/user_service');
const AIService = require('./services/ai_service');

// In-memory state storage (could be moved to DB for persistence)
const userStates = new Map();

const ONBOARDING_STEPS = [
    { key: 'age', prompt: 'What is your age?' },
    { key: 'gender', prompt: 'What is your gender?', options: ['Male', 'Female', 'Other'] },
    { key: 'height', prompt: 'What is your height in cm?' },
    { key: 'weight', prompt: 'What is your weight in kg?' },
    { key: 'fitness_level', prompt: 'What is your fitness level?', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { key: 'training_experience', prompt: 'Tell me about your training experience (e.g., 1 year, never trained).' },
    { key: 'available_equipment', prompt: 'What equipment do you have access to? (e.g., Full Gym, Dumbbells only, Bodyweight)' },
    { key: 'training_location', prompt: 'Where do you prefer to train?', options: ['Gym', 'Home', 'Outdoor'] },
    { key: 'injuries', prompt: 'Do you have any injuries or medical issues I should know about? (Type "None" if none)' },
    { key: 'diet_type', prompt: 'What is your diet type?', options: ['No restrictions', 'Vegan', 'Halal', 'Keto', 'Vegetarian', 'Other'] },
    { key: 'daily_schedule', prompt: 'Briefly describe your daily schedule (e.g., Work 9-5, Active, Sedentary).' },
    { key: 'sleep_hours', prompt: 'How many hours do you sleep on average?' },
    { key: 'stress_level', prompt: 'What is your current stress level?', options: ['Low', 'Moderate', 'High'] },
    { key: 'goal', prompt: 'What is your main goal?', options: ['Fat loss', 'Muscle gain', 'Strength', 'Endurance', 'Flexibility', 'General health'] }
];

const BotHandlers = {
    async start(ctx) {
        const userId = ctx.from.id;
        const profile = await UserService.getProfile(userId);

        if (profile) {
            await ctx.reply(`👋 Welcome back, ${ctx.from.first_name}! I’m AI FITCOACH PRO.\n\nType /workout for a new plan or /profile to see your data.`);
        } else {
            await ctx.reply(`👋 Welcome! I’m AI FITCOACH PRO, your personal Telegram fitness trainer.\n\nLet’s build your strongest body and mind together 💪🔥\n\nFirst, I need to know you better.`);
            userStates.set(userId, { step: 0, data: {} });
            await this.askNextQuestion(ctx, 0);
        }
    },

    async askNextQuestion(ctx, stepIndex) {
        const step = ONBOARDING_STEPS[stepIndex];
        if (step.options) {
            await ctx.reply(step.prompt, Markup.keyboard(step.options.map(o => [o])).oneTime().resize());
        } else {
            await ctx.reply(step.prompt, Markup.removeKeyboard());
        }
    },

    async handleMessage(ctx) {
        const userId = ctx.from.id;
        const state = userStates.get(userId);

        if (!state) {
            // General chat mode
            const profile = await UserService.getProfile(userId);
            try {
                const response = await AIService.chat(ctx.message.text, profile);
                await ctx.reply(response);
            } catch (error) {
                console.error('Chat error:', error);
                await ctx.reply('Sorry, I encountered an error while thinking. Please try again.');
            }
            return;
        }

        if (state.type && state.type.startsWith('progress')) {
            return this.handleProgressInput(ctx, userId, state);
        }

        // Onboarding mode
        const currentStep = ONBOARDING_STEPS[state.step];
        state.data[currentStep.key] = ctx.message.text;

        state.step++;

        if (state.step < ONBOARDING_STEPS.length) {
            userStates.set(userId, state);
            await this.askNextQuestion(ctx, state.step);
        } else {
            // Onboarding complete
            await ctx.reply('🔄 Saving your profile and preparing your journey...', Markup.removeKeyboard());
            try {
                await UserService.upsertProfile(userId, {
                    ...state.data,
                    username: ctx.from.username,
                    full_name: `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim()
                });
                userStates.delete(userId);
                await ctx.reply('✅ Profile saved! You are ready to go.\n\nTry these commands:\n/workout - Generate a workout plan\n/diet - Generate a nutrition plan\n/profile - View your profile');
            } catch (error) {
                console.error('Save profile error:', error);
                await ctx.reply('❌ Error saving profile. Please try /start again.');
                userStates.delete(userId);
            }
        }
    },

    async showProfile(ctx) {
        const profile = await UserService.getProfile(ctx.from.id);
        if (!profile) {
            return ctx.reply('You haven\'t set up a profile yet! Type /start to begin.');
        }

        const details = `📋 *User Fitness Profile*\n\n` +
            `Age: ${profile.age}\n` +
            `Gender: ${profile.gender}\n` +
            `Height: ${profile.height} cm\n` +
            `Weight: ${profile.weight} kg\n` +
            `Goal: ${profile.goal}\n` +
            `Level: ${profile.fitness_level}\n` +
            `Location: ${profile.training_location}\n` +
            `Diet: ${profile.diet_type}`;

        await ctx.replyWithMarkdown(details);
    },

    async generateWorkout(ctx) {
        const profile = await UserService.getProfile(ctx.from.id);
        if (!profile) return ctx.reply('Please complete your /profile first.');

        await ctx.reply('🏋️ Generating your personalized workout plan... This may take a moment.');
        try {
            const plan = await AIService.generateWorkoutPlan(profile);
            await UserService.saveWorkoutPlan(ctx.from.id, { content: plan });
            await ctx.replyWithMarkdown(plan);
        } catch (error) {
            console.error('Workout gen error:', error);
            await ctx.reply('Sorry, I failed to generate a workout plan. Please try again.');
        }
    },

    async generateDiet(ctx) {
        const profile = await UserService.getProfile(ctx.from.id);
        if (!profile) return ctx.reply('Please complete your /profile first.');

        await ctx.reply('🥗 Creating your nutrition plan...');
        try {
            const plan = await AIService.generateNutritionPlan(profile);
            await UserService.saveNutritionPlan(ctx.from.id, { content: plan });
            await ctx.replyWithMarkdown(plan);
        } catch (error) {
            console.error('Diet gen error:', error);
            await ctx.reply('Sorry, I failed to generate a diet plan.');
        }
    },

    async sendMotivation(ctx) {
        const profile = await UserService.getProfile(ctx.from.id);
        try {
            const msg = await AIService.generateMotivation(profile);
            await ctx.reply(msg);
        } catch (error) {
            await ctx.reply('Keep pushing! Your only limit is you. 💪');
        }
    },

    async logProgress(ctx) {
        const userId = ctx.from.id;
        const profile = await UserService.getProfile(userId);
        if (!profile) return ctx.reply('Please complete your /profile first.');

        await ctx.reply('Please enter your current weight (kg):');
        userStates.set(userId, { type: 'progress_weight', data: {} });
    },

    async handleProgressInput(ctx, userId, state) {
        if (state.type === 'progress_weight') {
            state.data.weight = parseFloat(ctx.message.text);
            await ctx.reply('How is your mood today? (e.g. Great, Tired, Motivated)');
            state.type = 'progress_mood';
            userStates.set(userId, state);
        } else if (state.type === 'progress_mood') {
            state.data.mood = ctx.message.text;
            await ctx.reply('What is your energy level? (Low/Medium/High)');
            state.type = 'progress_energy';
            userStates.set(userId, state);
        } else if (state.type === 'progress_energy') {
            state.data.energy = ctx.message.text;
            try {
                await UserService.logProgress(userId, {
                    weight: state.data.weight,
                    mood: state.data.mood,
                    energy_level: state.data.energy
                });
                await ctx.reply('📈 Progress logged successfully! Keep up the great work.');
                userStates.delete(userId);

                // Optional: AI feedback
                const feedback = await AIService.chat(`The user just logged their progress: Weight: ${state.data.weight}kg, Mood: ${state.data.mood}, Energy: ${state.data.energy}. Give a quick encouraging feedback.`, await UserService.getProfile(userId));
                await ctx.reply(feedback);
            } catch (error) {
                console.error('Progress log error:', error);
                await ctx.reply('Failed to log progress. Please try again.');
                userStates.delete(userId);
            }
        }
    }
};

module.exports = BotHandlers;
