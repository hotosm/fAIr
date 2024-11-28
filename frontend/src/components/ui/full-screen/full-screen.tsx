import { ReactNode } from "react";

const FullSreenWidthComponent = ({ children }: { children: ReactNode }) => {
  return (
    <div className={`-mx-[1.25rem] lg:-mx-[5rem]`}>
      {/*  Override the root layout padding */}
      {children}
    </div>
  );
};

export default FullSreenWidthComponent;
