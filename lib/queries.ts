import { createServerClient } from './supabase-server';
import { User, Couple } from './types';

// 현재 접속한 유저의 커플 정보 가져오기
export async function getCurrentCouple(userId: string): Promise<Couple | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
    
  if (error || !data) return null;
  return data as Couple;
}

// 커플의 파트너 정보 가져오기
export async function getPartnerInfo(coupleId: string, myUserId: string): Promise<User | null> {
  const supabase = createServerClient();
  
  // 1. 커플 정보 조회
  const { data: couple, error } = await supabase
    .from('couples')
    .select('user1_id, user2_id')
    .eq('id', coupleId)
    .single();
    
  if (error || !couple) return null;
  
  // 2. 파트너 ID 찾기
  const partnerId = couple.user1_id === myUserId ? couple.user2_id : couple.user1_id;
  if (!partnerId) return null;
  
  // 3. 파트너 계정 조회
  const { data: partner, error: partnerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', partnerId)
    .single();
    
  if (partnerError || !partner) return null;
  return partner as User;
}
