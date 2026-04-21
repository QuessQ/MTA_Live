import { Shell } from "./app/Shell";
import { useGeolocation } from "./app/useGeolocation";
import { useFeedPolling } from "./app/useFeedPolling";

export default function App() {
  useGeolocation();
  useFeedPolling();
  return <Shell />;
}
