import { APP_URL } from "@/utils/constants";

export default function NotFoundScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-6xl">404</p>
      <p className="text-muted-foreground mx-auto max-w-xl text-center text-lg leading-relaxed">
        The page you are looking for doesn't exist. <br />
        Are you looking for{" "}
        <a
          className="font-medium text-blue-500 hover:underline"
          href={APP_URL}
          target="_blank"
        >
          SiteAssist.io
        </a>
        ?
      </p>
    </div>
  );
}
