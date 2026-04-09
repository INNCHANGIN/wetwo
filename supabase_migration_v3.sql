-- 1. end_date 컬럼 추가
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date date;

-- 2. 기존 데이터의 end_date를 시작일(date)과 동일하게 업데이트
UPDATE public.events SET end_date = date WHERE end_date IS NULL;

-- 3. category 제약 조건 완화 (NULL 허용 및 NOT NULL 해제)
ALTER TABLE public.events ALTER COLUMN category DROP NOT NULL;

-- 4. 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
