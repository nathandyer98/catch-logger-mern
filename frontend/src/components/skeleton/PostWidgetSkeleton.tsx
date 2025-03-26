const PostWidgetSkeleton = () => {
  return (
    <div className="max-w-full mx-auto bg-transparent/25 shadow-md rounded-xl my-4 p-4">
      {/**Header - Profile Pic, Name, Username, Posted at */}
      <div className="flex justify-between">
        <div className="flex gap-5 align-middle">
          <div className="skeleton w-14 h-14 rounded-full"></div>
          <div>
            <div className="skeleton h-2 w-12 rounded-full"></div>
            <div className="skeleton h-2 w-24 rounded-full"></div>
          </div>
        </div>
      </div>

      {/** Picture container  */}
      <div>
        <div className="mt-3 skeleton h-52 w-full"></div>
      </div>
    </div>
  );
};

export default PostWidgetSkeleton;
