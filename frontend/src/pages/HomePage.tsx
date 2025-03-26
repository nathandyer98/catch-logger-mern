import { useEffect } from "react";
import CreatePostWidget from "../components/CreatePostWidget";
import { useCatchStore } from "../store/useCatchStore";
import PostWidget from "../components/PostWidget";
// import PostWidgetSkeleton from "../components/skeleton/PostWidgetSkeleton";

const HomePage = () => {
  const { feedCatches, fetchCatchesFeed } = useCatchStore();

  useEffect(() => {
    fetchCatchesFeed();
  }, [fetchCatchesFeed]);

  return (
    <div className="space-y-6">
      <CreatePostWidget />
      {/* {isFetchingCatches && <PostWidgetSkeleton /> } */}
      {!feedCatches && <div>No catches found to display here</div>}
      {feedCatches &&
        feedCatches.map((catchLog, index) => (
          <PostWidget catchData={catchLog} key={index + 1} />
        ))}
    </div>
  );
};

export default HomePage;
