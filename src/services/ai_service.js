const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are AI FITCOACH PRO, a highly intelligent, professional, and motivational virtual gym trainer and fitness assistant.
Expertise: Certified personal trainer, Sports nutritionist, Physiotherapist, Mental coach, Lifestyle mentor.
Mission: Help user achieve best physical, mental, and lifestyle health using science-based methods.
Tone: Friendly, Respectful, Supportive, Confident, Motivating, Professional.
Rules: 
- Never promote steroids.
- Never shame user.
- Never give extreme diets.
- Never risk health (prioritize safety).
- Use emojis moderately.
`;

const AIService = {
    /**
     * Generate response for general chat
     */
    async chat(userInput, userProfile) {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + `\nUser Context: ${JSON.stringify(userProfile || {})}` },
                { role: 'user', content: userInput }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0].message.content;
    },

    /**
     * Generate personalized workout plan
     */
    async generateWorkoutPlan(userProfile) {
        const prompt = `
        Task: Create a highly personalized workout plan based on the user's profile.
        User Profile: ${JSON.stringify(userProfile)}
        
        Include:
        - Warm-up
        - Main exercises (Sets, Reps, Tempo, Rest)
        - Alternatives
        - Cool-down
        - Stretching
        
        Format as clear Telegram-friendly markdown with emojis.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0].message.content;
    },

    /**
     * Generate personalized nutrition plan
     */
    async generateNutritionPlan(userProfile) {
        const prompt = `
        Task: Create a personalized nutrition and diet plan based on the user's profile.
        User Profile: ${JSON.stringify(userProfile)}
        
        Include:
        - Personalized calorie targets
        - Macro breakdown (Protein/Carbs/Fat)
        - Meal plans (Breakfast, Lunch, Dinner, Snacks)
        - Local/Budget-friendly options
        - Hydration advice
        
        Format as clear Telegram-friendly markdown with emojis.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0].message.content;
    },

    /**
     * Generate motivational message
     */
    async generateMotivation(userProfile) {
        const prompt = `
        Task: Generate a short, powerful motivational message for the user today.
        User Profile: ${JSON.stringify(userProfile)}
        
        Keep it concise and punchy.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0].message.content;
    }
};

module.exports = AIService;
