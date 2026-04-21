import { useEffect, useState } from "react";
import { Shell } from "./app/Shell";
import { useGeolocation } from "./app/useGeolocation";
import { useFeedPolling } from "./app/useFeedPolling";
import { useCommuteObserver } from "./app/useCommuteObserver";
import { parseIncoming, type SharePayload } from "./features/share-eta/codec";
import { RecipientView } from "./features/share-eta/RecipientView";

function useSharedEta(): [SharePayload | null, () => void] {
  const [payload, setPayload] = useState<SharePayload | null>(() => parseIncoming());
  useEffect(() => {
    const onHash = () => setPayload(parseIncoming());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [payload, () => setPayload(null)];
}

export default function App() {
  const [shared, dismissShared] = useSharedEta();
  useGeolocation();
  useFeedPolling();
  useCommuteObserver();

  if (shared) return <RecipientView payload={shared} onDismiss={dismissShared} />;
  return <Shell />;
}
