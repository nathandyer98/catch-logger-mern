import { useEffect } from "react";
import CreatePostWidget from "../components/CreatePostWidget";
import { useCatchStore } from "../store/useCatchStore";
import PostWidget from "../components/PostWidget";
// import PostWidgetSkeleton from "../components/skeleton/PostWidgetSkeleton";

const HomePage = () => {
  const { catches, fetchCatchesFeed } = useCatchStore();

  useEffect(() => {
    fetchCatchesFeed();
  }, [fetchCatchesFeed]);

  return (
    <div className="space-y-6">
      <CreatePostWidget />
      {/* {isFetchingCatches && <PostWidgetSkeleton /> } */}
      {!catches && <div>No catches found to display here</div>}
      {catches &&
        catches.map((catchLog, index) => (
          <PostWidget catchData={catchLog} key={index + 1} />
        ))}
    </div>
  );
};

export default HomePage;
