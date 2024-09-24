import { Button } from "@/components/ui/button/";
import HOTTeam from '@/assets/images/hot_team_2.jpg'
import styles from './cta.module.css'
import { APP_CONTENT } from "@/utils";
import { Image } from "@/components/ui/image";

const CallToAction = () => {
    return (
        <section className={styles.container}>
            <div className={styles.cta}>
                <div className={styles.ctaContent}>
                    <h1> {APP_CONTENT.homepage.callToAction.title}</h1>
                    <p>
                        {APP_CONTENT.homepage.callToAction.paragraph}
                    </p>
                </div>
                <div className={styles.ctaButtonContainer}>
                    <Button variant='primary'> {APP_CONTENT.homepage.callToAction.ctaButton}</Button>
                </div>
            </div>
            <div className={styles.imageBlock}>
                <Image src={HOTTeam} alt={APP_CONTENT.homepage.callToAction.ctaButton} className={styles.image} />
                {/* The rectangles */}
                <div className={styles.dotsPattern}></div>
                <div className={styles.planeRectangle}></div>
            </div>
        </section>
    )
}


export default CallToAction;