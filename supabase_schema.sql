-- 테이블 생성

-- Users (Profiles)
CREATE TABLE public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nickname text not null,
  avatar_url text
);

-- Couples
CREATE TABLE public.couples (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references public.users(id) on delete cascade not null,
  user2_id uuid references public.users(id) on delete cascade, -- Nullable (until partner connects)
  anniversary_date date not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events
CREATE TABLE public.events (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  category text check (category in ('date', 'anniversary', 'daily')) not null,
  is_recurring boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Photos
CREATE TABLE public.photos (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  uploaded_by uuid references public.users(id) on delete cascade not null,
  storage_path text not null,
  caption text,
  taken_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Diaries
CREATE TABLE public.diaries (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  mood text not null,
  is_private boolean default false not null,
  diary_date date not null,
  reactions jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- 1. Users RLS: 인증된 사용자는 프로필 조회가 가능 (커플의 파트너 정보를 보여주기 위해)
CREATE POLICY "Users can view profiles"
ON public.users FOR SELECT USING ( auth.role() = 'authenticated' );

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE USING ( auth.uid() = id );

-- 2. Couples RLS: 자신이 속한 커플 데이터만 접근 가능
CREATE POLICY "couples_read_by_code" ON public.couples
  FOR SELECT USING (true); -- 코드 확인을 위해 누구나 조회 가능 (단, user2_id가 null인 경우 위주로 필터링해서 사용 권장)

CREATE POLICY "Users can insert their couple"
ON public.couples FOR INSERT
WITH CHECK ( auth.uid() = user1_id OR auth.uid() = user2_id );

CREATE POLICY "couples_update_user2" ON public.couples
  FOR UPDATE USING (user2_id IS NULL)
  WITH CHECK (user2_id = auth.uid());

-- 3. Events RLS
CREATE POLICY "Users can manage events of their couple"
ON public.events FOR ALL
USING ( couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) );

-- 4. Photos RLS
CREATE POLICY "Users can manage photos of their couple"
ON public.photos FOR ALL
USING ( couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) );

-- 5. Diaries RLS (is_private 처리 포함)
CREATE POLICY "Users can access non-private couple diaries or own diaries"
ON public.diaries FOR SELECT
USING ( 
  couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) 
  AND (is_private = false OR author_id = auth.uid()) 
);

CREATE POLICY "Users can insert diaries for their couple"
ON public.diaries FOR INSERT
WITH CHECK ( couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) );

CREATE POLICY "Users can update own diaries"
ON public.diaries FOR UPDATE
USING ( author_id = auth.uid() );

CREATE POLICY "Users can delete own diaries"
ON public.diaries FOR DELETE
USING ( author_id = auth.uid() );

-- 유저 생성 시 자동으로 public.users에 프로필을 만드는 함수 (이메일 인증 전에도 작동하도록 SECURITY DEFINER 사용)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nickname', '사용자')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 유저가 쌓이면 위의 함수를 실행하도록 트리거 설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON public.couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON public.couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON public.events(couple_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON public.photos(couple_id);
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON public.photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_diaries_couple_id ON public.diaries(couple_id);
CREATE INDEX IF NOT EXISTS idx_diaries_diary_date ON public.diaries(diary_date);
CREATE INDEX IF NOT EXISTS idx_diaries_author_id ON public.diaries(author_id);
