import styles from './faqs.module.css';
import { Accordion } from '@/components/ui/accordion';
import { APPLICATION_ROUTES, SHARED_CONTENT } from '@/constants';
import { ChevronDownIcon } from '@/components/ui/icons';
import { Link } from '@/components/ui/link';
import { TFAQs } from '@/types';


export const FAQs = ({
  faqs = SHARED_CONTENT.homepage.faqs.content,
  disableSeeMoreButton,
}: {
  faqs?: TFAQs;
  disableSeeMoreButton?: boolean;
}) => {
  return (
    <section className={styles.FAQS}>
      <h1 className={styles.heading}>
        {SHARED_CONTENT.homepage.faqs.sectionTitle}
      </h1>
      <div className={styles.FAQContentContainer}>
        <div>
          {faqs.map((faq, id) => (
            <Accordion
              summary={faq.question}
              content={faq.answer}
              key={`faq-item-${id}`}
            />
          ))}
        </div>
        {!disableSeeMoreButton && (
          <Link
            href={APPLICATION_ROUTES.RESOURCES}
            title={SHARED_CONTENT.homepage.faqs.cta}
            className="!capitalize"
            nativeAnchor={false}
          >
            <h3 className={`${styles.seeMore} flex items-center gap-x-2`}>
              {SHARED_CONTENT.homepage.faqs.cta}
              <ChevronDownIcon className="w-3 -rotate-90" />
            </h3>
          </Link>
        )}
      </div>
    </section>
  );
};
