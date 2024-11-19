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

  if (!isBannerVisible || isError || data?.length === 0 || isLoading) {
    return null;
  }

  const banner = useMemo(
    () => (
      <div className="w-full p-4 bg-primary flex items-center justify-between px-4 text-white">
        <Markdown
          remarkPlugins={[remarkGfm]}
          className={
            "flex flex-wrap gap-x-2 items-center justify-center w-full"
          }
        >
          {data?.[0].message}
        </Markdown>
        <button onClick={handleCloseBanner} className="font-bold">
          ✕
        </button>
      </div>
    ),
    [data],
  );

  return banner;
};

export default Banner;
