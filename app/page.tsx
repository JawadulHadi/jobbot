import { Chat } from "@/components/chat/chat";
import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <Chat />
    </AppShell>
  );
}
