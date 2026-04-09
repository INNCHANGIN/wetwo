-- 1. 'couples' 이름의 새 스토리지 버킷 생성 (공개 읽기 허용)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('couples', 'couples', true)
ON CONFLICT (id) DO NOTHING;

-- 2. storage.objects 테이블의 RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. (조회용) 생성된 버킷의 파일들을 누구나 읽을 수 있도록 허용
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'couples' );

-- 4. (업로드용) 로그인한 사용자(authenticated)만 파일을 업로드 하도록 허용
CREATE POLICY "Authenticated Users can Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'couples' AND auth.role() = 'authenticated' );

-- 5. (수정 및 삭제용) 정책 생략
