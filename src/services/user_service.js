const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Database features will not work.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const UserService = {
    /**
     * Get user profile by Telegram ID
     */
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching profile:', error);
        }
        return data;
    },

    /**
     * Create or update user profile
     */
    async upsertProfile(userId, profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ user_id: userId, ...profileData, updated_at: new Date() })
            .select();

        if (error) {
            console.error('Error upserting profile:', error);
            throw error;
        }
        return data[0];
    },

    /**
     * Save workout plan
     */
    async saveWorkoutPlan(userId, planData) {
        const { data, error } = await supabase
            .from('workout_plans')
            .insert({ user_id: userId, plan_data: planData })
            .select();

        if (error) {
            console.error('Error saving workout plan:', error);
            throw error;
        }
        return data[0];
    },

    /**
     * Get latest workout plan
     */
    async getLatestWorkoutPlan(userId) {
        const { data, error } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching latest workout plan:', error);
        }
        return data;
    },

    /**
     * Save nutrition plan
     */
    async saveNutritionPlan(userId, planData) {
        const { data, error } = await supabase
            .from('nutrition_plans')
            .insert({ user_id: userId, plan_data: planData })
            .select();

        if (error) {
            console.error('Error saving nutrition plan:', error);
            throw error;
        }
        return data[0];
    },

    /**
     * Log progress
     */
    async logProgress(userId, progressData) {
        const { data, error } = await supabase
            .from('progress_logs')
            .insert({ user_id: userId, ...progressData })
            .select();

        if (error) {
            console.error('Error logging progress:', error);
            throw error;
        }
        return data[0];
    }
};

module.exports = UserService;
