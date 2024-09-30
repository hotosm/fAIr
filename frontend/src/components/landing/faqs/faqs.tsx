import SlDetails from "@shoelace-style/shoelace/dist/react/details/index.js";
import styles from "./faqs.module.css";
import { APP_CONTENT } from "@/utils/content";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";

type FAQItemProps = {
  question: string;
  answer: string;
};

const FAQItem: React.FC<{ faq: FAQItemProps }> = ({ faq }) => (
  <SlDetails summary={faq.question}>
    {/*The slot prop is needed by shoelace*/}
    {/* @ts-ignore e*/}
    <ChevronDownIcon className="w-4 h-4 rotate-0" slot="expand-icon" />
    {/*The slot prop is needed by shoelace*/}
    {/* @ts-ignore e*/}
    <ChevronDownIcon className="w-4 h-4 rotate-180" slot="collapse-icon" />
    {faq.answer}
  </SlDetails>
);

const FAQs = () => {
  return (
    <section className={styles.FAQS}>
      <h1 className={styles.heading}>
        {APP_CONTENT.homepage.faqs.sectionTitle}
      </h1>
      <div className={styles.FAQContentContainer}>
        <div>
          {APP_CONTENT.homepage.faqs.content.map((faq, id) => (
            <FAQItem faq={faq} key={`faq-item-${id}`} />
          ))}
        </div>
        <h3 className={styles.seeMore}>
          {APP_CONTENT.homepage.faqs.cta}
          <span></span>&gt;
        </h3>
      </div>
    </section>
  );
};

export default FAQs;
