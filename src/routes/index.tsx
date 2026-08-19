import { createFileRoute } from "@tanstack/react-router";
import { EarthMount } from "@/components/earth/EarthMount";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <EarthMount />;
}
