export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
}

export interface Couple {
  id: string
  user1_id: string
  user2_id: string
  anniversary_date: string  // YYYY-MM-DD
  invite_code: string
  first_met_date?: string   // YYYY-MM-DD
  wedding_date?: string     // YYYY-MM-DD
}

export interface Event {
  id: string
  couple_id: string
  created_by: string
  title: string
  date: string
  end_date?: string
  category?: string
  is_recurring: boolean
}

export interface Photo {
  id: string
  couple_id: string
  uploaded_by: string
  storage_path: string
  caption?: string
  taken_at: string
}

export interface Diary {
  id: string
  couple_id: string
  author_id: string
  content: string
  mood: 'happy' | 'sad' | 'love' | 'normal'
  is_private: boolean
  diary_date: string
  reactions?: Record<string, string>
}
