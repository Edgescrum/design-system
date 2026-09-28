import { Spinner } from "./Spinner";
import { PecoLogo } from "./icons";

export function FullScreenLoading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <main className="flex min-h-app items-center justify-center bg-background">
      <div className="text-center">
        <PecoLogo aria-label="PeCo" className="mx-auto h-10" />
        <div className="mt-6 flex items-center justify-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-muted">{message}</p>
        </div>
      </div>
    </main>
  );
}
