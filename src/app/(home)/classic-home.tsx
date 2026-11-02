'use client'

/**
 * 「卡片」版首页（可拖拽布局的那个版本）。
 *
 * 拆成独立文件的意义：默认布局是杂志版（homeLayout === 'magazine'），
 * 这 11 张卡片里有 7 张在杂志版下根本不渲染，却因为静态 import 被打进首屏包。
 * 放进这里之后由 page.tsx 动态加载，杂志版访客不再为它们付费。
 */
import ArtCard from '@/app/(home)/art-card'
import HiCard from '@/app/(home)/hi-card'
import ClockCard from '@/app/(home)/clock-card'
import CalendarCard from '@/app/(home)/calendar-card'
import SocialButtons from '@/app/(home)/social-buttons'
import ShareCard from '@/app/(home)/share-card'
import AritcleCard from '@/app/(home)/aritcle-card'
import WriteButtons from '@/app/(home)/write-buttons'
import LikePosition from '@/app/(home)/like-position'
import HatCard from '@/app/(home)/hat-card'
import BeianCard from '@/app/(home)/beian-card'
import { useSize } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'

export default function ClassicHome() {
	const { maxSM } = useSize()
	const { cardStyles } = useConfigStore()

	return (
		<div className='max-sm:flex max-sm:flex-col max-sm:items-center max-sm:gap-6 max-sm:pt-28 max-sm:pb-20'>
			{cardStyles.artCard?.enabled !== false && <ArtCard />}
			{cardStyles.hiCard?.enabled !== false && <HiCard />}
			{!maxSM && cardStyles.clockCard?.enabled !== false && <ClockCard />}
			{!maxSM && cardStyles.calendarCard?.enabled !== false && <CalendarCard />}
			{cardStyles.socialButtons?.enabled !== false && <SocialButtons />}
			{!maxSM && cardStyles.shareCard?.enabled !== false && <ShareCard />}
			{cardStyles.articleCard?.enabled !== false && <AritcleCard />}
			{!maxSM && cardStyles.writeButtons?.enabled !== false && <WriteButtons />}
			{cardStyles.likePosition?.enabled !== false && <LikePosition />}
			{cardStyles.hatCard?.enabled !== false && <HatCard />}
			{cardStyles.beianCard?.enabled !== false && <BeianCard />}
		</div>
	)
}
