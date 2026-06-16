import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type NaverWebtoon = {
  titleId: number
  titleName: string
  author: string
  thumbNailUrl: string
  genre: string
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export async function GET() {
  try {
    const todayDate = new Date().toISOString().split('T')[0]

    // 요일별 인기순 + 업데이트순 둘 다 수집
    const res = await fetch(
      'https://comic.naver.com/api/webtoon/titlelist/weekday?order=user',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://comic.naver.com/webtoon/weekday',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: '네이버 API 호출 실패' }, { status: 500 })
    }

    const json = await res.json()
    let totalSaved = 0
    const summary: Record<string, number> = {}

    // 월~일 전체 요일 수집
    for (const day of DAYS) {
      const webtoons: NaverWebtoon[] = json.titleListMap?.[day] ?? []
      let daySaved = 0

      for (let i = 0; i < webtoons.length; i++) {
        const w = webtoons[i]

        const { data: webtoonRow } = await supabase
          .from('webtoons')
          .upsert(
            {
              title: w.titleName,
              author: w.author,
              platform: '네이버',
              genre: w.genre ?? '기타',
              thumbnail_url: w.thumbNailUrl,
            },
            { onConflict: 'title,platform' }
          )
          .select('id')
          .single()

        if (!webtoonRow) continue

        await supabase.from('rankings').upsert(
          {
            webtoon_id: webtoonRow.id,
            rank: i + 1,
            recorded_date: todayDate,
            platform: '네이버',
          },
          { onConflict: 'webtoon_id,recorded_date,platform' }
        )

        daySaved++
      }

      summary[day] = daySaved
      totalSaved += daySaved
    }

    return NextResponse.json({
      success: true,
      message: `총 ${totalSaved}개 저장 완료`,
      date: todayDate,
      summary,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}