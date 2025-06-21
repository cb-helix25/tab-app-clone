import { useContext, lazy, Suspense } from "react";
import { Spinner } from "@fluentui/react-components";
const Welcome = lazy(() =>
  import("./sample/Welcome").then((module) => ({ default: module.Welcome }))
);
import { TeamsFxContext } from "./Context";
import config from "./sample/lib/config";

const showFunction = Boolean(config.apiName);

export default function Tab() {
  const { themeString } = useContext(TeamsFxContext);
  return (
    <div
      className={themeString === "default" ? "light" : themeString === "dark" ? "dark" : "contrast"}
    >
      <Suspense fallback={<Spinner style={{ margin: 100 }} />}>
        <Suspense fallback={<Spinner style={{ margin: 100 }} />}>
          <Welcome showFunction={showFunction} />
        </Suspense>
      </Suspense>
    </div>
  );
}
