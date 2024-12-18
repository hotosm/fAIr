import React from "react";

export const SectionHeader = React.memo(({ title }: { title: string }) => {
    return (
        <h2 className="text-title-3 lg:text-title-2 font-semibold mb-12">
            {title}
        </h2>
    );
})