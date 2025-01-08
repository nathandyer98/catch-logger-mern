import { useEffect } from "react";
import CreatePostWidget from "../components/CreatePostWidget";
import { useCatchStore } from "../store/useCatchStore";
import PostWidget from "../components/PostWidget";

const HomePage = () => {
  const { feedCatches, isFetchingCatches, fetchCatchesFeed } = useCatchStore();

  useEffect(() => {
    fetchCatchesFeed();
  }, [fetchCatchesFeed]);

  if (isFetchingCatches) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <CreatePostWidget />
      {!feedCatches && <div>No catches found to display :( </div>}
      {feedCatches &&
        feedCatches.map((catchLog, index) => (
          <PostWidget catchData={catchLog} key={index + 1} />
        ))}
    </div>
  );
};

export default HomePage;
