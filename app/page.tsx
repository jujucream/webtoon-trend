'use client'  // ← 이 파일은 클라이언트에서 실행된다는 뜻
// 클라이언트 컴포넌트여야 useState(상태 관리)를 쓸 수 있어요

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function getRankChange(today: number, yesterday: number) {
  const diff = yesterday - today
  if (diff > 0) return { label: `▲${diff}`, color: 'text-emerald-500' }
  if (diff < 0) return { label: `▼${Math.abs(diff)}`, color: 'text-red-400' }
  return { label: '-', color: 'text-gray-400' }
}

// 요일 한글 이름 변환 함수
const dayLabels: Record<string, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function Home() {
  // 상태 관리: 선택된 요일을 저장
  const [selectedDay, setSelectedDay] = useState('MONDAY')
  // 순위 데이터를 저장
  const [rankings, setRankings] = useState<any[]>([])
  // 로딩 상태
  const [loading, setLoading] = useState(true)

  // 컴포넌트 마운트될 때 데이터 로드
  useEffect(() => {
    fetchData(selectedDay)
  }, [selectedDay])

  // 선택된 요일의 데이터를 Supabase에서 가져오는 함수
  const fetchData = async (day: string) => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 선택된 요일 + 오늘 날짜의 순위 데이터 조회
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center text-gray-400">로딩중...</div>
      </main>
    )
  }

  const naverRankings = rankings.filter((r: any) => r.platform === '네이버')
  const today = new Date().toISOString().split('T')[0]
  const naverTop = (naverRankings[0]?.webtoons as any)?.title ?? '-'

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">웹툰 트렌드</p>
            <h1 className="text-2xl font-semibold text-gray-900">요일별 순위 현황</h1>
          </div>
          <p className="text-sm text-gray-400">{today} 기준</p>
        </div>

        {/* 요일 탭 버튼 */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              // 선택된 탭은 파란색, 아니면 회색
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedDay === day
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {dayLabels[day]}
            </button>
          ))}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">총 작품 수</p>
            <p className="text-2xl font-semibold text-gray-900">{naverRankings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">1위</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{naverTop}</p>
          </div>
        </div>

        {/* 순위 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-sm font-semibold text-gray-700">네이버 웹툰</h2>
          </div>
          
          {naverRankings.length > 0 ? (
            <div className="space-y-3">
              {naverRankings.map((r: any) => {
                const title = (r.webtoons as any)?.title ?? ''
                return (
                  <div key={`${selectedDay}-${r.rank}`} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-4 font-medium">{r.rank}</span>
                    <span className="flex-1 text-sm text-gray-800 truncate">{title}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">이 요일 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  )
}