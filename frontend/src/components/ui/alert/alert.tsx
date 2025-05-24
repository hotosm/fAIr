import { SlAlert } from "@shoelace-style/shoelace/dist/react";
import React from "react";
import styles from "./alert.module.css";
import { InfoIcon } from "../icons";

export const Alert = ({ children }: { children: React.ReactNode }) => (
  <SlAlert variant="danger" open className={styles.info}>
    <InfoIcon className="icon" slot="icon" />
    {children}
  </SlAlert>
);
