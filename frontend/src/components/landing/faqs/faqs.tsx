import SlDetails from '@shoelace-style/shoelace/dist/react/details/index.js';
import styles from './faqs.module.css'
import SlIcon from '@shoelace-style/shoelace/dist/react/icon/index.js';
import { APP_CONTENT } from '@/utils/content';



type TFAQItem = {
    question: string
    answer: string
}


const FAQItem: React.FC<{ faq: TFAQItem }> = ({ faq }) => (
    <SlDetails summary={faq.question}>
        <SlIcon name="chevron-up" slot="expand-icon" />
        <SlIcon name="chevron-down" slot="collapse-icon" />
        {faq.answer}
    </SlDetails>
);

const FAQs = () => {
    return (
        <section className={styles.FAQS}>
            <h1 className={styles.heading}>{APP_CONTENT.homepage.faqs.sectionTitle}</h1>
            <div className={styles.FAQContentContainer}>
                <div>
                    {
                        APP_CONTENT.homepage.faqs.content.map((faq, id) => <FAQItem faq={faq} key={`faq-item-${id}`} />)
                    }
                </div>
                <h3 className={styles.seeMore}>{APP_CONTENT.homepage.faqs.cta}<span></span>&gt;</h3>
            </div>
        </section>

    )
}

export default FAQs