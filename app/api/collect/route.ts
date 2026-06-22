import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type NaverWebtoon = {
  titleId: number
  titleName: string
  author: string
  thumbNailUrl: string
  genre: string
}

// 요일 목록
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    // URL에서 ?day=MONDAY 같은 파라미터를 읽어옴
    // 없으면 오늘 요일을 자동으로 사용
    const dayParam = searchParams.get('day')
    const todayIndex = new Date().getDay() // 0=일요일, 1=월요일...
    const todayDay = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][todayIndex]
    const targetDay = dayParam ?? todayDay

    const todayDate = new Date().toISOString().split('T')[0]

    // 네이버 내부 API 호출
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

    // 특정 요일 데이터만 추출
    const webtoons: NaverWebtoon[] = json.titleListMap?.[targetDay] ?? []
    let savedCount = 0

    for (let i = 0; i < webtoons.length; i++) {
      const w = webtoons[i]

      // webtoons 테이블에 저장 (중복이면 업데이트)
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

      // rankings 테이블에 순위 저장
      await supabase.from('rankings').upsert(
        {
          webtoon_id: webtoonRow.id,
          rank: i + 1,
          recorded_date: todayDate,
          platform: '네이버',
          day: targetDay,
        },
        { onConflict: 'webtoon_id,recorded_date,platform' }
      )

      savedCount++
    }

    return NextResponse.json({
      success: true,
      message: `${targetDay} ${savedCount}개 저장 완료`,
      date: todayDate,
      day: targetDay,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}