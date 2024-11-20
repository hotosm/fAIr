import { API_ENDPOINTS, apiClient } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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

  const banner = useMemo(
    () => (
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
    ),
    [data],
  );

  if (!isBannerVisible || isError || data?.length === 0 || isLoading) {
    return null;
  }

  return banner;
};

export default Banner;
