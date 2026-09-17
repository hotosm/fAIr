import styles from "./about-fair.module.css";
import { fAIrWorkflowIllustration } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { SHARED_CONTENT } from "@/constants";

export const WhatIsFAIR = () => {
  return (
    <section className={styles.aboutfAIrContainer}>
      <div className={styles.featureContent}>
        <h1 className={styles.heading}>{SHARED_CONTENT.homepage.aboutTitle}</h1>
        <p className={styles.paragraph}>{SHARED_CONTENT.homepage.aboutContent}</p>
      </div>
      <div className={styles.imageContainer}>
        <Image src={fAIrWorkflowIllustration} alt="fAIr Workflow Illustration" />
      </div>
    </section>
  );
};
