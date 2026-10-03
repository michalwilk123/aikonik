import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ children }: { children: string }) {
  return (
    <div
      className={[
        "min-w-0 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_p]:my-3 [&_p]:whitespace-pre-wrap",
        "[&_h1]:my-4 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:my-4 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:my-3 [&_h3]:font-semibold [&_h4]:my-3 [&_h4]:font-semibold [&_h5]:my-3 [&_h5]:font-semibold [&_h6]:my-3 [&_h6]:font-semibold",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-outline-variant [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-variant",
        "[&_code]:rounded [&_code]:bg-surface-container [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-container [&_pre]:p-4 [&_pre]:leading-6 [&_pre_code]:p-0",
        "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-outline-variant [&_th]:bg-surface-container [&_th]:p-2 [&_td]:border [&_td]:border-outline-variant [&_td]:p-2",
        "[&_hr]:my-4 [&_hr]:border-outline-variant [&_img]:max-w-full [&_img]:rounded-lg",
      ].join(" ")}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
