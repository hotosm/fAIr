import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type TBannerResponse = {
  start_date: string;
  end_date: string;
  message: string;
  id: number;
};

const fetchBanner = async (): Promise<TBannerResponse[]> => {
  const { data } = await apiClient.get(API_ENDPOINTS.GET_BANNER);
  return data;
};

const Banner = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["banner"],
    queryFn: fetchBanner,
  });

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  if (!isBannerVisible || isError || data?.length === 0 || isLoading) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between bg-primary px-4 py-2">
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="prose w-[90%] text-wrap xl:text-nowrap"
      >
        {data?.[0]?.message}
      </Markdown>
      <button onClick={handleCloseBanner} className="font-bold  text-white">
        ✕
      </button>
    </div>
  );
};

export default Banner;
