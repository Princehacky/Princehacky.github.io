const ReviewsAPI = {

    async getGames() {
        const { data, error } = await supabase
            .from("games")
            .select("*")
            .order("name");

        if (error) throw error;

        return data;
    },

    async getApprovedReviews(gameId) {

        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("game_id", gameId)
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;
    },

    async submitReview(review) {

        review.status = "pending";

        const { error } = await supabase
            .from("reviews")
            .insert(review);

        if (error) throw error;
    }

};