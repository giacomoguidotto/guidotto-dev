import Image from "next/image";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <h1 className="text-4xl font-bold">guidotto.dev</h1>
        <p className="font-mono text-sm/6 sm:text-left">site under construction... hold to your horses 🐴</p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <a
            className="flex h-10 items-center justify-center gap-2 rounded-full border border-transparent border-solid bg-foreground px-4 font-medium text-background text-sm transition-colors hover:bg-[#383838] sm:h-12 sm:w-auto sm:px-5 sm:text-base dark:hover:bg-[#ccc]"
            href="https://github.com/GiacomoGuidotto"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Image
              alt="GitHub logo"
              className="invert dark:invert-0"
              height={20}
              src="/github.svg"
              width={20}
            />
            GitHub
          </a>
          <a
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-solid border-[#0A66C2] bg-[#0A66C2] px-4 font-medium text-sm text-white transition-colors hover:bg-[#004182] hover:border-[#004182] sm:h-12 sm:w-auto sm:px-5 sm:text-base md:w-[158px] dark:bg-[#0A66C2] dark:border-[#0A66C2] dark:hover:bg-[#004182] dark:hover:border-[#004182]"
            href="https://www.linkedin.com/in/giacomo-guidotto/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Image
              alt="LinkedIn logo"
              className=""
              height={20}
              src="/linkedin.webp"
              width={20}
            />
            LinkedIn
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex flex-wrap items-center justify-center gap-[24px]">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          rel="noopener noreferrer"
          target="_blank"
        >
          Powered by
          <Image
            alt="Next.js logo"
            className="ml-2 dark:invert"
            aria-hidden
            height={28}
            src="/next.svg"
            width={120}
          />
        </a>
      </footer>
    </div>
  );
}
