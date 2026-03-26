"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Event } from "@/lib/types";

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("couples")
          .select("id, user1_id, user2_id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .single()
          .then(({ data: couple }) => {
            if (couple) {
              setCoupleId(couple.id);
              fetchUsersInfo([couple.user1_id, couple.user2_id].filter(Boolean) as string[]);
              fetchEvents(couple.id, currentDate);
              
              const channel = supabase
                .channel('public:events')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `couple_id=eq.${couple.id}` }, () => {
                  fetchEvents(couple.id, currentDate);
                })
                .subscribe();
                
              return () => {
                supabase.removeChannel(channel);
              };
            }
          });
      }
    });
  }, [currentDate]);

  const fetchUsersInfo = async (userIds: string[]) => {
    const { data } = await supabase.from("users").select("id, nickname, avatar_url").in("id", userIds);
    if (data) {
      const infoMap: Record<string, any> = {};
      data.forEach(u => infoMap[u.id] = u);
      setUsersInfo(infoMap);
    }
  };

  const fetchEvents = async (cid: string, dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const startStr = new Date(year, month, 1).toISOString().substring(0, 10);
    const endStr = new Date(year, month + 1, 0).toISOString().substring(0, 10);
    
    const { data: regularEvents } = await supabase
      .from("events")
      .select("*")
      .eq("couple_id", cid)
      .eq("is_recurring", false)
      .gte("date", startStr)
      .lte("date", endStr);
      
    const { data: recurringEvents } = await supabase
      .from("events")
      .select("*")
      .eq("couple_id", cid)
      .eq("is_recurring", true);
      
    let allEvents = [...(regularEvents || [])];
    
    if (recurringEvents && recurringEvents.length > 0) {
      recurringEvents.forEach(evt => {
        const evtMonth = parseInt(evt.date.substring(5, 7), 10) - 1;
        const evtDay = parseInt(evt.date.substring(8, 10), 10);
        if (evtMonth === month) {
          allEvents.push({ ...evt, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(evtDay).padStart(2, '0')}` });
        }
      });
    }
    
    setEvents(allEvents);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const getLocalDateStr = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const todayObj = new Date();
  const todayLocalStr = getLocalDateStr(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
  const selectedLocalStr = getLocalDateStr(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  
  const selectedEvents = events.filter(e => e.date === selectedLocalStr);

  const getCategoryColor = (cat: string) => {
    if (cat === 'date') return 'bg-pink-100 text-pink-600';
    if (cat === 'anniversary') return 'bg-yellow-100 text-yellow-600';
    return 'bg-blue-100 text-blue-600';
  };
  
  const getCategoryLabel = (cat: string) => {
    if (cat === 'date') return '데이트';
    if (cat === 'anniversary') return '기념일';
    return '일상';
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 px-6 pt-6">
        {/* 달력 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 -ml-2 text-text active:bg-surface rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-[20px] font-bold text-text">
            {year}년 {month + 1}월
          </h2>
          <button onClick={nextMonth} className="p-2 -mr-2 text-text active:bg-surface rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 달력 그리드 */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border/40">
          <div className="grid grid-cols-7 gap-y-3">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-[12px] font-semibold text-muted mb-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-[48px]" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = getLocalDateStr(year, month, d);
              const isToday = dateStr === todayLocalStr;
              const isSelected = dateStr === selectedLocalStr;
              const hasEvents = events.some(e => e.date === dateStr);
              
              return (
                <div 
                  key={d} 
                  onClick={() => setSelectedDate(new Date(year, month, d))}
                  className="flex flex-col items-center justify-start h-[48px] cursor-pointer"
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full text-[15px] transition-colors
                    ${isSelected ? 'bg-primary text-white font-bold shadow-sm' : 
                      isToday ? 'bg-primary/10 text-primary font-bold' : 'text-text hover:bg-surface font-medium'}
                  `}>
                    {d}
                  </div>
                  {/* 이벤트 점 표시 */}
                  {hasEvents && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-primary/30' : 'bg-primary'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택한 날짜 일정 */}
        <div className="mt-8 mb-6">
          <h3 className="text-[17px] font-bold text-text mb-4">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
          </h3>
          
          <div className="flex flex-col gap-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map(evt => {
                const author = usersInfo[evt.created_by];
                return (
                  <div key={evt.id} className="bg-white p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
                    <div className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[12px] font-bold ${getCategoryColor(evt.category)}`}>
                      {getCategoryLabel(evt.category)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-text leading-tight">{evt.title}</p>
                    </div>
                    {author && (
                      <div className="flex-shrink-0">
                        {author.avatar_url ? (
                          <img src={author.avatar_url} className="w-8 h-8 rounded-full border border-border object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface text-muted flex items-center justify-center text-[10px] font-bold border border-border">
                            {author.nickname?.[0]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="bg-surface rounded-2xl p-6 text-center border border-border/40">
                <p className="text-[14px] text-muted font-medium">등록된 일정이 없어요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB Floating Action Button */}
      <Link 
        href={`/calendar/new?date=${selectedLocalStr}`} 
        className="fixed bottom-[100px] left-1/2 ml-[120px] w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.3)] hover:scale-105 active:scale-95 transition-transform z-50"
      >
        <Plus size={28} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
