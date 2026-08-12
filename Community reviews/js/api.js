const ReviewsAPI = {

    async getGames() {
        const { data, error } = await supabaseClient
            .from("games")
            .select("*")
            .order("name");

        if (error) {
            throw error;
        }

        return data;
    },

    async getGame(slug) {
        const { data, error } = await supabaseClient
            .from("games")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            throw error;
        }

        return data;
    },

    async getApprovedReviews(gameId) {
        const { data, error } = await supabaseClient
            .from("reviews")
            .select("*")
            .eq("game_id", gameId)
            .eq("status", "approved")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        return data;
    },

    async submitReview(review) {
        const { error } = await supabaseClient
            .from("reviews")
            .insert({
                ...review,
                status: "pending"
            });

        if (error) {
            throw error;
        }

        return true;
    }

};