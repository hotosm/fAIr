import styles from "./faqs.module.css";
import { APP_CONTENT } from "@/utils/content";
import { Accordion } from "@/components/ui/accordion";
import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/utils";
import { TFAQs } from "@/types";
import React from "react";

export const FAQs = React.memo(
  ({
    faqs = APP_CONTENT.homepage.faqs.content,
    disableSeeMoreButton,
  }: {
    faqs?: TFAQs;
    disableSeeMoreButton?: boolean;
  }) => {
    return (
      <section className={styles.FAQS}>
        <h1 className={styles.heading}>
          {APP_CONTENT.homepage.faqs.sectionTitle}
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
              title={APP_CONTENT.homepage.faqs.cta}
              className="!capitalize"
              nativeAnchor={false}
            >
              <h3 className={styles.seeMore}>
                {APP_CONTENT.homepage.faqs.cta}
                <span></span>&gt;
              </h3>
            </Link>
          )}
        </div>
      </section>
    );
  },
);
