// import styles from './footer.module.css'
import CreativeCommonsBadge from '@/assets/images/cc_by_badge.png'
import FacebookLogo from '@/assets/socials/facebook_logo.svg'
import GitHubLogo from '@/assets/socials/github_logo.svg'
import XLogo from '@/assets/socials/x_logo.svg'
import InstagramLogo from '@/assets/socials/instagram_logo.svg'
import YoutTubeLogo from '@/assets/socials/youtube_logo.svg'
import { APP_CONTENT } from '@/utils/content'
import { Image } from '@/components/ui/image'



const socials = [
    {
        name: 'Facebook',
        url: '#',
        logo: FacebookLogo
    }, {
        name: 'X',
        url: '#',
        logo: XLogo
    }, {
        name: 'GitHub',
        url: '#',
        logo: GitHubLogo
    }, {
        name: 'YouTube',
        url: '#',
        logo: YoutTubeLogo
    }, {
        name: 'Instagram',
        url: '#',
        logo: InstagramLogo
    }
]
const Footer = () => {
    return (
        <footer>
            <div className='grid grid-cols-12 grid-rows-2 gap-y-[67px] px-[20px] lg:px-[80px] bg-dark text-white py-[77px]'>
                <div className='col-span-12 grid grid-cols-8 lg:grid-cols-12  gap-x-[40px] gap-y-[40px]'>
                    <div className='col-span-8 lg:col-span-4'>
                        <p className='text-[20px]'>{APP_CONTENT.footer.title}</p>
                    </div>
                    <div className='col-span-8 uppercase text-[16px] flex  lg:col-start-7 lg:col-span-4  w-full justify-between'>
                        <ul className='space-y-4'>
                            {
                                APP_CONTENT.footer.siteMap.groupOne.map((route, id) => <li key={`footer-link-${id}`}>{route.title}</li>)
                            }
                        </ul>

                        <ul className='space-y-4'>
                            {
                                APP_CONTENT.footer.siteMap.groupTwo.map((route, id) => <li key={`footer-links2-${id}`}>{route.title}</li>)
                            }
                        </ul>
                    </div>
                </div>
                <div className='col-span-12 grid grid-cols-8 lg:grid-cols-12 lg:grid-rows-1 gap-x-[40px] gap-y-[40px] lg:gap-y-0'>
                    <div className='col-span-8 lg:col-span-4 flex flex-col gap-y-5'>
                        <div>
                            <Image src={CreativeCommonsBadge} alt='Creative Commons Badge' title='Creative Commons Badge' />
                        </div>
                        <div className='space-y-5 text-[14px]'>
                            <p>{APP_CONTENT.footer.copyright.firstSegment}</p>
                            <p>{APP_CONTENT.footer.copyright.secondSegment}</p>
                        </div>
                    </div>
                    <div className='col-span-8 flex flex-col lg:col-start-10 lg:col-span-4 w-full justify-start items-start lg:justify-end lg:items-end space-y-4'>
                        <ul className='flex space-x-[11px]'>
                            {
                                socials.map((media, id) =>
                                    <li key={`social-link-${id}`} className='w-7 h-7 flex  items-center justify-center bg-white rounded-full'>
                                        <Image src={media.logo} alt={`${media.name} Icon`} title={`${media.name}`} />
                                    </li>
                                )
                            }
                        </ul>
                        <p className='text-[14px]'>{APP_CONTENT.footer.socials.ctaText}</p>
                    </div>
                </div>
            </div>

            <div className='flex items-center justify-center bg-white w-full h-[56px]'>
                <p className='text-[14px] text-center space-x-1'>
                    <span>{APP_CONTENT.footer.madeWithLove.firstSegment}</span>
                    <strong>{APP_CONTENT.footer.madeWithLove.secondSegment}</strong>
                    <span>{APP_CONTENT.footer.madeWithLove.thirdSegment}</span>
                    <strong>{APP_CONTENT.footer.madeWithLove.fourthSegment}</strong>
                </p>
            </div>
        </footer>
    )
}

export default Footer;