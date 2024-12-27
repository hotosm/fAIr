import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="w-full px-4 py-2 bg-primary flex items-center justify-between">
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="w-full md:text-nowrap prose"
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
