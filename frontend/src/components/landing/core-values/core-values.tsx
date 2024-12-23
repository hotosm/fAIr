import styles from "./core-values.module.css";
import { APP_CONTENT } from "@/utils/content";
import { Image } from "@/components/ui/image";
import { HOTTeam, MapathonOngoing } from "@/assets/images";
import { DashedLineConnector } from "@/assets/svgs";

export const Corevalues = () => {
  return (
    <section className={styles.coreValues}>
      <div className={styles.sectionTitle}>
        <h1>{APP_CONTENT.homepage.coreValues.sectionTitle.firstSegment}</h1>

        <span className={styles.svgContainer}>
          <svg
            className={styles.svgIcon}
            viewBox="0 0 232 84"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.900024 83.0566L37.5904 9.37025L83.4256 0.433594L61.0515 66.0872L0.900024 83.0566Z"
              fill="#D33132"
            />
            <path
              d="M61.0515 66.1002L118.103 83.0492L122.685 9.72963L83.4256 0.446289L61.0515 66.1002Z"
              fill="#D63F40"
            />
            <path
              d="M172.314 68.0681L163.653 2.86572L122.685 9.73041L118.103 83.0473L172.314 68.0681Z"
              fill="#D33132"
            />
            <path
              d="M172.308 68.0775L231.13 83.011L202.518 14.4951L163.652 2.86719L172.308 68.0775Z"
              fill="#D63F40"
            />
          </svg>
          <h1 className={styles.svgText}>
            {APP_CONTENT.homepage.coreValues.sectionTitle.secondSegment}
          </h1>
        </span>

        <h1>
          <strong>
            {APP_CONTENT.homepage.coreValues.sectionTitle.thirdSegment}
          </strong>
        </h1>
        <h1 className={`${styles.stretch}`}>
          {APP_CONTENT.homepage.coreValues.sectionTitle.fourthSegment}
        </h1>
        <h1>
          <strong>
            {APP_CONTENT.homepage.coreValues.sectionTitle.fifthSegment}
          </strong>
        </h1>
      </div>
      <div className={`${styles.container} relative`}>
        {/* Community Driven */}
        <div className={`${styles.section} ${styles.community}`}>
          <div className={styles.textBlock}>
            <h2>{APP_CONTENT.homepage.coreValues.community.title}</h2>
            <p>{APP_CONTENT.homepage.coreValues.community.description}</p>
          </div>
          <div className={styles.imageBlock}>
            <Image
              src={HOTTeam}
              alt={APP_CONTENT.homepage.coreValues.community.title}
              className={styles.image}
            />
            {/* The rectangles */}
            <div
              className={`${styles.primaryRectangle} ${styles.rightDirection}`}
            ></div>
            <div
              className={`${styles.lightGrayRectangle} ${styles.lightGrayLeft}`}
            ></div>
          </div>
        </div>

        {/* Connector */}
        <div className={styles.dashedLineWrapper}>
          <Image src={DashedLineConnector} alt="" className={styles.image} />
        </div>

        {/* Humans not replaced */}
        <div className={`${styles.section} ${styles.humans}`}>
          <div className={styles.textBlock}>
            <h2>{APP_CONTENT.homepage.coreValues.humansNotReplaced.title}</h2>
            <p>
              {APP_CONTENT.homepage.coreValues.humansNotReplaced.description}
            </p>
          </div>
          <div className={styles.imageBlock}>
            <Image
              src={MapathonOngoing}
              alt={APP_CONTENT.homepage.coreValues.humansNotReplaced.title}
              className={styles.image}
            />
            {/* The rectangles */}
            <div
              className={`${styles.primaryRectangle} ${styles.leftDirection}`}
            ></div>
            <div
              className={`${styles.lightGrayRectangle} ${styles.lightGrayRight}`}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
};

