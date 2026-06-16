import { supabase } from '@/lib/supabase'

function getRankChange(today: number, yesterday: number) {
  const diff = yesterday - today
  if (diff > 0) return { label: `▲${diff}`, color: 'text-emerald-500' }
  if (diff < 0) return { label: `▼${Math.abs(diff)}`, color: 'text-red-400' }
  return { label: '-', color: 'text-gray-400' }
}

export default async function Home() {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const { data: todayData } = await supabase
    .from('rankings')
    .select('rank, platform, webtoons(title, genre)')
    .eq('recorded_date', today)
    .order('rank')

  const { data: yesterdayData } = await supabase
    .from('rankings')
    .select('rank, platform, webtoons(title)')
    .eq('recorded_date', yesterday)

  const yesterdayMap: Record<string, number> = {}
  yesterdayData?.forEach((r: any) => {
    const title = (r.webtoons as any)?.title
    if (title) yesterdayMap[title] = r.rank
  })

  const naverRankings = todayData?.filter((r: any) => r.platform === '네이버') ?? []
  const kakaoRankings = todayData?.filter((r: any) => r.platform === '카카오') ?? []

  const totalCount = todayData?.length ?? 0
  const naverTop = (naverRankings[0]?.webtoons as any)?.title ?? '-'
  const kakaoTop = (kakaoRankings[0]?.webtoons as any)?.title ?? '-'

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">웹툰 트렌드</p>
            <h1 className="text-2xl font-semibold text-gray-900">오늘의 순위 현황</h1>
          </div>
          <p className="text-sm text-gray-400">{today} 기준</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">총 작품 수</p>
            <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">네이버 1위</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{naverTop}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">카카오 1위</p>
            <p className="text-lg font-semibold text-gray-900 truncate">{kakaoTop}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-semibold text-gray-700">네이버 웹툰</h2>
            </div>
            <div className="space-y-3">
              {naverRankings.map((r: any) => {
                const title = (r.webtoons as any)?.title ?? ''
                const change = getRankChange(r.rank, yesterdayMap[title] ?? r.rank)
                return (
                  <div key={`naver-${r.rank}`} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-4 font-medium">{r.rank}</span>
                    <span className="flex-1 text-sm text-gray-800 truncate">{title}</span>
                    <span className={`text-xs ${change.color}`}>{change.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <h2 className="text-sm font-semibold text-gray-700">카카오 웹툰</h2>
            </div>
            <div className="space-y-3">
              {kakaoRankings.map((r: any) => {
                const title = (r.webtoons as any)?.title ?? ''
                const change = getRankChange(r.rank, yesterdayMap[title] ?? r.rank)
                return (
                  <div key={`kakao-${r.rank}`} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-4 font-medium">{r.rank}</span>
                    <span className="flex-1 text-sm text-gray-800 truncate">{title}</span>
                    <span className={`text-xs ${change.color}`}>{change.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}