import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';

class EventService {
  /**
   * Get all events
   * Now uses anonymous client since RLS policy allows public read access
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  }

  /**
   * Get events by category
   * Now uses anonymous client since RLS policy allows public read access
   */
  async getEventsByCategory(category: string): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get events by category error:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   * Now uses anonymous client since RLS policy allows public read access
   */
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get event by ID error:', error);
      return null;
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .order('category', { ascending: true });

      if (error) throw error;
      
      const uniqueCategories = new Set(data?.map(event => event.category) || []);
      const categories = Array.from(uniqueCategories);
      return categories;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  /**
   * Search events
   * Now uses anonymous client since RLS policy allows public read access
   */
  async searchEvents(query: string): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search events error:', error);
      throw error;
    }
  }

  /**
   * Admin: Create new event
   */
  async createEvent(eventData: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required for creating events');
      }

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  }

  /**
   * Admin: Update event
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required for updating events');
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  }

  /**
   * Admin: Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required for deleting events');
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  }

  /**
   * Get event statistics (Pure Unified System)
   * Note: Event statistics are now derived from unified_registrations table
   */
  async getEventStats(eventId: string) {
    try {
      // In the unified system, events are stored within selected_events JSON
      // This method would need to query unified_registrations and count occurrences
      // For now, return empty stats as individual event stats are less relevant
      const stats = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };

      return stats;
    } catch (error) {
      console.error('Get event stats error:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
