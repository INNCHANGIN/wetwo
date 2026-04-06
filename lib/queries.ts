import { User, Couple } from './types';

// 현재 접속한 유저의 커플 정보 가져오기
export async function getCurrentCouple(supabase: any, userId: string): Promise<Couple | null> {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
    
  if (error || !data) return null;
  return data as Couple;
}

// 커플의 파트너 정보 가져오기
export async function getPartnerInfo(supabase: any, coupleId: string, myUserId: string): Promise<User | null> {
  // 1. 커플 정보 조회
  const { data: couple, error } = await supabase
    .from('couples')
    .select('user1_id, user2_id')
    .eq('id', coupleId)
    .single();
    
  if (error || !couple) return null;
  
  // 2. 파트너 ID 찾기
  const partnerId = couple.user1_id === myUserId ? couple.user1_id === myUserId ? couple.user2_id : couple.user1_id : null;
  // (Wait, Logic fix:)
  const pId = couple.user1_id === myUserId ? couple.user2_id : couple.user1_id;
  if (!pId) return null;
  
  // 3. 파트너 계정 조회
  const { data: partner, error: partnerError } = await supabase
    .from('users')
    .select('*')
    .eq('id', pId)
    .single();
    
  if (partnerError || !partner) return null;
  return partner as User;
}
