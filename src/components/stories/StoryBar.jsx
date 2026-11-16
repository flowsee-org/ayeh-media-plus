import { useState } from "react";
import { Plus } from "lucide-react";
import CreateStory from "@/components/stories/CreateStory";
import { useAuth } from "@/lib/AuthContext";

export default function StoryBar({ groups, user, onOpen, onRefresh }) {
  const { openAuthModal } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const myGroup = user ? groups.find((g) => g.authorId === user.id) : null;
  const others = user ? groups.filter((g) => g.authorId !== user.id) : groups;

  const handleMyStoryClick = () => {
    if (myGroup) {
      onOpen(groups.indexOf(myGroup));
    } else if (user) {
      setShowCreate(true);
    } else {
      openAuthModal(() => {
        setShowCreate(true);
      });
    }
  };

  return (
    <>
      <div className="sticky top-16 sm:top-20 z-30 border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-3">
            {/* My Story / Add Story */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={handleMyStoryClick}
                className="relative h-16 w-16 rounded"
              >
                <span
                  className={`absolute inset-0 rounded ${
                    myGroup
                      ? "bg-gradient-to-tr from-accent via-accent/70 to-primary"
                      : "bg-muted"
                  }`}
                />
                <span className="absolute inset-[3px] rounded bg-background overflow-hidden">
                  {myGroup?.authorAvatar ? (
                    <img
                      src={myGroup.authorAvatar}
                      alt={myGroup.authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="h-full w-full flex items-center justify-center text-sm font-bold text-primary">
                      {(user?.full_name || user?.phone || user?.email || "+").charAt(0)}
                    </span>
                  )}
                </span>
                {!myGroup && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
                    <Plus className="h-3 w-3" />
                  </span>
                )}
              </button>
              <span className="text-[11px] text-muted-foreground max-w-[64px] truncate text-[12px]">
                {myGroup ? "استوری شما" : "استوری من"}
              </span>
            </div>

            {/* Other stories */}
            {others.map((group) => {
              const realIndex = user ? groups.indexOf(group) : groups.indexOf(group);
              return (
                <div key={group.authorId} className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpen(realIndex)}
                    className="relative h-16 w-16 rounded"
                  >
                    <span
                      className={`absolute inset-0 rounded ${
                        group.allViewed
                          ? "bg-muted-foreground/30"
                          : "bg-gradient-to-tr from-accent via-accent/70 to-primary"
                      }`}
                    />
                    <span className="absolute inset-[3px] rounded bg-background overflow-hidden">
                      {group.authorAvatar ? (
                        <img
                          src={group.authorAvatar}
                          alt={group.authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="h-full w-full flex items-center justify-center text-sm font-bold text-accent">
                          {group.authorName?.charAt(0)}
                        </span>
                      )}
                    </span>
                  </button>
                  <span className="text-[11px] text-muted-foreground max-w-[64px] truncate text-[12px]">
                    {group.authorName?.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateStory
          user={user}
          onClose={() => setShowCreate(false)}
          onPosted={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}