import SlDetails from '@shoelace-style/shoelace/dist/react/details/index.js';
import styles from './faqs.module.css'
type TFAQItem = {
    question: string
    answer: string
}


const faqs: TFAQItem[] = [
    {
        question: 'What is fAIr?',
        answer: " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
        question: 'Who can use fAIr?',
        answer: " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
        question: 'Can I use fAIr without having a sound knowledge of AI?',
        answer: " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },

]


const FAQItem: React.FC<{ faq: TFAQItem }> = ({ faq }) => (
    <SlDetails summary={faq.question}>
        {faq.answer}
    </SlDetails>
);

const FAQs = () => {
    return (
        <div className={styles.FAQS}>
            <div className='flex items-center justify-between w-full'>
                <h1 className={styles.heading}>FAQs</h1>
                <div>
                    {
                        faqs.map((faq, id) => <FAQItem faq={faq} key={`faq-item-${id}`} />)
                    }
                    <h3 className={styles.seeMore}>See more<span></span>&gt;</h3>
                </div>
            </div>
        </div>

    )
}

export default FAQs