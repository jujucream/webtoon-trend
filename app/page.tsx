'use client'  // ← 이 파일은 클라이언트에서 실행된다는 뜻
// 클라이언트 컴포넌트여야 useState(상태 관리)를 쓸 수 있어요

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 순위 변동을 화살표로 표시하는 함수
// 예: 5위 → 3위 = 2칸 올라감 = "▲2"
function getRankChange(today: number, yesterday: number) {
  const diff = yesterday - today
  if (diff > 0) return { label: `▲${diff}`, color: 'text-emerald-500' }
  if (diff < 0) return { label: `▼${Math.abs(diff)}`, color: 'text-red-400' }
  return { label: '-', color: 'text-gray-400' }
}

// 요일 영문명 → 한글 변환
// 예: MONDAY → "월"
const dayLabels: Record<string, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

// 네이버 웹툰이 등재된 요일 목록
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

// 순위를 숫자 대신 시각적 표시로 나타내는 함수
// 1,2,3위는 메달 이모지, 나머지는 숫자로 표시
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return rank.toString()
  }
}

export default function Home() {
  // 상태 관리: 사용자가 선택한 요일 저장
  // 예: selectedDay = 'MONDAY' 이면 월요일 데이터 표시
  const [selectedDay, setSelectedDay] = useState('MONDAY')
  
  // 상태 관리: Supabase에서 가져온 순위 데이터 저장
  const [rankings, setRankings] = useState<any[]>([])
  
  // 상태 관리: 데이터 로딩 중인지 여부
  const [loading, setLoading] = useState(true)

  // useEffect: selectedDay가 바뀔 때마다 자동으로 데이터 다시 로드
  // 이걸로 탭을 클릭하면 새로운 요일 데이터가 표시돼요
  useEffect(() => {
    fetchData(selectedDay)
  }, [selectedDay])

  // 선택된 요일의 데이터를 Supabase에서 가져오는 함수
  // 1. 오늘 날짜와 선택된 요일이 일치하는 데이터만 조회
  // 2. 순위순으로 정렬 (1위부터)
  const fetchData = async (day: string) => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Supabase 쿼리: rankings 테이블에서 조건에 맞는 데이터 가져오기
      // - recorded_date: 오늘
      // - day: 선택된 요일
      // - select: title과 genre 정보도 함께 가져오기 (관계 조회)
      const { data } = await supabase
        .from('rankings')
        .select('rank, platform, webtoons(title, genre)')
        .eq('recorded_date', today)
        .eq('day', day)
        .order('rank')

      setRankings(data ?? [])
    } catch (err) {
      console.error('데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto text-center text-blue-200">로딩중...</div>
      </main>
    )
  }

  // 네이버 웹툰만 필터링 (플랫폼이 '네이버'인 것들)
  const naverRankings = rankings.filter((r: any) => r.platform === '네이버')
  
  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0]
  
  // 1위 작품명 (없으면 '-')
  const naverTop = (naverRankings[0]?.webtoons as any)?.title ?? '-'

  return (
    // 배경: 어두운 그래디언트 (검정 → 파랑 → 보라)
    // → 고급스럽고 신비로운 느낌
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* 헤더: 더 심플하고 미니멀한 느낌 */}
        <div className="mb-12">
          {/*
            border-b-2: 하단 테두리로 구분선 표현
            border-blue-500: 파란색 구분선
            pb-6: 아래쪽 여백
          */}
          <div className="">
            <h1 className="text-4xl font-bold text-white mb-2">WEBTOON</h1>
            <p className="text-blue-300">{today} 기준 &lt;네이버 웹툰 요일별 순위&gt;</p>
          </div>
        </div>

        {/* 요일 탭 버튼 */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}  // ← 클릭하면 해당 요일 데이터 로드
              className={`
                px-5 py-2 rounded-lg font-semibold transition-all duration-300
                ${selectedDay === day
                  // 선택된 탭: 그래디언트 배경 + 그림자 + 살짝 커짐
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                  // 미선택 탭: 반투명 배경 + 호버 시 밝아짐
                  : 'bg-white/10 text-blue-100 backdrop-blur hover:bg-white/20'
                }
              `}
            >
              {dayLabels[day]}
            </button>
          ))}
        </div>

        {/* 요약 카드 2개: 그래디언트 + 글래스모피즘 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 작품 수 카드 */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-400/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <p className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-2">총 작품 수</p>
            <p className="text-4xl font-bold text-emerald-100">{naverRankings.length}</p>
          </div>

          {/* 1위 카드 */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 backdrop-blur-sm border border-amber-400/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-2">1위</p>
            <p className="text-2xl font-bold text-amber-100 truncate">{naverTop}</p>
          </div>
        </div>

        {/* 순위 리스트 카드: 글래스모피즘 스타일 */}
        {/* 
          글래스모피즘: 반투명 배경 + 흐린 효과 → 현대적인 느낌
          backdrop-blur-xl: 극도로 흐린 배경
          border border-white/10: 반투명 흰색 테두리
        */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* 섹션 제목 */}
          <div className="flex items-center gap-3 mb-6">
            {/* 그래디언트 동그라미 (표시용) */}
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <h2 className="text-lg font-bold text-white">네이버 웹툰</h2>
          </div>

          {/* 순위 리스트 */}
          {naverRankings.length > 0 ? (
            <div className="space-y-3">
              {/* className : max-h-96 → 높이 제한 + 스크롤 가능, overflow-y-auto → 세로 스크롤만 활성화*/}
              {naverRankings.slice(0, 15).map((r: any, idx: number) => {
                //.slice(0) → 전체 데이터 표시 (15로 제한 안 함)
                const title = (r.webtoons as any)?.title ?? ''
                // 상위 3개는 노란색 배경으로 강조
                const isTop3 = idx < 3
                const rankBadge = getRankBadge(r.rank)
                
                return (
                  <div
                    key={`${selectedDay}-${r.rank}`}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg transition-all
                      ${isTop3
                        // 상위 3개: 노란색 그래디언트 배경
                        ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-400/30'
                        // 그 외: 흰색 반투명 배경 + 호버 시 더 밝아짐
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    {/* 순위 배지: 숫자 또는 메달 이모지 */}
                    <div className="min-w-10 text-center">
                      {/* 상위 3개는 메달 이모지 표시 🥇🥈🥉 */}
                      <span className={`
                        ${isTop3 ? 'text-2xl' : 'text-sm font-bold text-blue-300'}
                      `}>
                        {rankBadge}
                      </span>
                    </div>

                    {/* 작품명 */}
                    <span className="flex-1 text-white font-medium truncate">{title}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-blue-300">이 요일 데이터가 없습니다.</p>
          )}
        </div>

        {/* 푸터: 정보 메시지 */}
        <div className="mt-12 text-center text-blue-200 text-sm">
          <p>🔄 매일 오전 10시에 자동 업데이트 됩니다</p>
        </div>
      </div>
    </main>
  )
}
