export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string;
          avatar_seed: string;
          level: number;
          xp_total: number;
          created_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name: string;
          avatar_seed: string;
          level?: number;
          xp_total?: number;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      workout_rituals: {
        Row: {
          id: string;
          title: string;
          duration_seconds: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          duration_seconds: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_rituals']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          ritual_id: string;
          started_at: string;
          ended_at: string | null;
          status: 'active' | 'completed' | 'abandoned';
          base_xp_awarded: number;
          duration_seconds_confirmed: number;
          xp_earned_confirmed: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ritual_id: string;
          started_at?: string;
          ended_at?: string | null;
          status?: 'active' | 'completed' | 'abandoned';
          base_xp_awarded?: number;
          duration_seconds_confirmed?: number;
          xp_earned_confirmed?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      xp_ledger: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          reason: 'session_start' | 'session_tick' | 'bonus' | 'manual_adjustment';
          xp_delta: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          reason: 'session_start' | 'session_tick' | 'bonus' | 'manual_adjustment';
          xp_delta: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['xp_ledger']['Insert']>;
      };
    };
    Views: {
      daily_xp_stats: {
        Row: {
          user_id: string;
          xp_window: number;
        };
      };
      weekly_xp_stats: {
        Row: {
          user_id: string;
          xp_window: number;
        };
      };
    };
    Functions: {
      get_profile_snapshot: {
        Args: Record<string, never>;
        Returns: Database['public']['Tables']['profiles']['Row'][];
      };
      fetch_leaderboard: {
        Args: { p_window: 'day' | 'week' };
        Returns: {
          rank: number;
          user_id: string;
          display_name: string;
          username: string | null;
          avatar_seed: string;
          level: number;
          xp_total: number;
          xp_window: number;
        }[];
      };
      start_workout_session: {
        Args: { p_ritual_id: string };
        Returns: {
          session_id: string;
          started_at: string;
          initial_xp: number;
          xp_total: number;
          level: number;
        }[];
      };
      finish_workout_session: {
        Args: { p_session_id: string; p_client_duration_seconds: number };
        Returns: {
          session_id: string;
          confirmed_xp: number;
          confirmed_seconds: number;
          xp_total: number;
          level: number;
          daily_rank: number | null;
          weekly_rank: number | null;
          ended_at: string;
        }[];
      };
    };
  };
};
