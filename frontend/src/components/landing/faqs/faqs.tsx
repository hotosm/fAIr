import styles from "./faqs.module.css";
import { APP_CONTENT } from "@/utils/content";
import { Accordion } from "@/components/ui/accordion";

const FAQs = () => {
  return (
    <section className={styles.FAQS}>
      <h1 className={styles.heading}>
        {APP_CONTENT.homepage.faqs.sectionTitle}
      </h1>
      <div className={styles.FAQContentContainer}>
        <div>
          {APP_CONTENT.homepage.faqs.content.map((faq, id) => (
            <Accordion
              summary={faq.question}
              content={faq.answer}
              key={`faq-item-${id}`}
            />
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
