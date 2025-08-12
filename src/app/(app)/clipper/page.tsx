// src/app/(app)/clipper/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

// This is the javascript code for the bookmarklet. It's formatted to be a single line.
const bookmarkletCode = `
javascript:(function(){
    const url=window.location.href;
    let title=document.querySelector('meta[property="og:title"]')?.getAttribute('content')||document.title;
    const description=document.querySelector('meta[property="og:description"]')?.getAttribute('content')||'';
    
    if(url.includes('instagram.com')){
        const titleParts=title.split(' on Instagram');
        title=titleParts[0]||title;
    }

    const appUrl='${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}';
    window.open(appUrl+'/add/video?url='+encodeURIComponent(url)+'&title='+encodeURIComponent(title)+'&description='+encodeURIComponent(description),'_blank');
})();
`.replace(/\s+/g, ' ');


export default function ClipperPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">The LinkVault AI Clipper</h1>
      <p className="text-muted-foreground">
        Save content from any website directly to your vault with one click.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Your Clipper Bookmarklet</CardTitle>
          <CardDescription>
            Drag the button below to your browser&apos;s bookmarks bar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="mb-4 text-center">
              Drag this button to your bookmarks bar
            </p>
            <a
              href={bookmarkletCode}
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white bg-slate-800 rounded-md shadow-md hover:bg-slate-700 transition-colors"
              onClick={(e) => e.preventDefault()} // Prevents the link from being followed when clicked
            >
              <Bookmark className="w-5 h-5" />
              LinkVault AI Clipper
            </a>
          </div>
          <h3 className="mt-6 text-lg font-semibold">How to Use It</h3>
          <ol className="mt-2 text-sm text-muted-foreground list-decimal list-inside space-y-2">
            <li>Make sure your bookmarks bar is visible in your browser.</li>
            {/* FIX: Replaced quotes with HTML entities */}
            <li>Drag the &quot;LinkVault AI Clipper&quot; button above onto your bookmarks bar.</li>
            {/* FIX: Replaced apostrophe with HTML entity */}
            <li>When you&apos;re on a page you want to save (like an Instagram Reel), simply click the bookmark.</li>
            <li>A new LinkVault AI tab will open with the information pre-filled. Just click save!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}