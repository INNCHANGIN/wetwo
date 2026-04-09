-- 1. 기존 Diaries 테이블 삭제 (관련 RLS 동시 삭제됨)
DROP TABLE IF EXISTS public.diaries CASCADE;

-- 2. 공유 메모장 (Memos)
CREATE TABLE public.memos (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete cascade not null, -- 작성자/최종수정자
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 맥주 브루잉 일지 (Brewing Logs)
CREATE TABLE public.brewing_logs (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.users(id) on delete cascade not null,
  name text not null,
  malt text,
  hops text,
  yeast text,
  fermentation_temp numeric,
  start_date date,
  end_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 일정과 사진의 N:M 매핑 (Event Photos)
CREATE TABLE public.event_photos (
  event_id uuid references public.events(id) on delete cascade not null,
  photo_id uuid references public.photos(id) on delete cascade not null,
  PRIMARY KEY (event_id, photo_id)
);

-- Memos RLS
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage memos of their couple"
ON public.memos FOR ALL
USING ( couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) );

-- Brewing Logs RLS
ALTER TABLE public.brewing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage brewing logs of their couple"
ON public.brewing_logs FOR ALL
USING ( couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()) );

-- Event Photos RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage event_photos of their couple events"
ON public.event_photos FOR ALL
USING ( 
  event_id IN (
    SELECT id FROM public.events 
    WHERE couple_id IN (SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memos_couple_id ON public.memos(couple_id);
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON public.memos(updated_at);
CREATE INDEX IF NOT EXISTS idx_brewing_logs_couple_id ON public.brewing_logs(couple_id);

-- 샘플 데이터 삽입을 위한 PL/pgSQL 블록 (기존 커플이 하나 이상 존재할 경우 동작)
DO $$
DECLARE
  v_couple_id uuid;
  v_user_id uuid;
BEGIN
  -- 아무 커플이나 하나 선택
  SELECT id, user1_id INTO v_couple_id, v_user_id FROM public.couples LIMIT 1;
  
  -- 커플이 존재하면 더미 데이터 삽입
  IF v_couple_id IS NOT NULL THEN
    INSERT INTO public.brewing_logs (
      couple_id, created_by, name, malt, hops, yeast, fermentation_temp, start_date, notes
    ) VALUES (
      v_couple_id,
      v_user_id,
      '문톤스 컨티넨탈 필스너',
      '문톤스 인하우스 엑스트랙트',
      '기본 포함 홉 (노블 홉 계열)',
      '에일 이스트 (문톤스 번들)',
      18.5,
      CURRENT_DATE,
      '처음 만들어보는 필스너. 에일 이스트지만 라거 느낌을 내기 위해 온도를 낮춰서 발효 중.'
    );
  END IF;
END $$;
