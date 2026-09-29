(() => {
  'use strict';

  const core = window.UpdateSchedulerCore;
  if (!core || !window.supabaseClient) {
    return;
  }

  const TABLE_NAME = 'scheduled_updates';
  // Server-side scheduler integration point:
  // due scheduled rows should be published by a trusted backend job, not by GitHub Pages.

  class SupabaseUpdatesAdapter {
    async loadUpdates() {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (result.error) throw result.error;
      return Array.isArray(result.data) ? result.data : [];
    }

   async createUpdate(payload) {
  const {
    id,
    created_by,
    created_at,
    updated_at,
    published_at,
    cancelled_at,
    ...insertPayload
  } = payload;

  const result = await window.supabaseClient
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select('*')
    .single();

  if (result.error) throw result.error;
  return result.data;
}
    async editUpdate(id, payload) {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (result.error) throw result.error;
      return result.data;
    }

    async deleteUpdate(id) {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .select('id')
        .single();

      if (result.error) throw result.error;
      return result.data;
    }

    async cancelUpdate(id, reason = 'Cancelled by admin') {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          failure_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (result.error) throw result.error;
      return result.data;
    }

    async publishUpdate(id) {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (result.error) throw result.error;
      return result.data;
    }

    async rescheduleUpdate(id, payload) {
      const result = await window.supabaseClient
        .from(TABLE_NAME)
        .update({
          scheduled_at: payload.scheduled_at,
          timezone: payload.timezone || core.DEFAULT_TIMEZONE,
          status: payload.status || 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (result.error) throw result.error;
      return result.data;
    }
  }

  core.updatesRepository.setAdapter(new SupabaseUpdatesAdapter());
})();
