
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'OnwardMissionsBot/1.0',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Basic extraction logic - can be enhanced
        const title = $('title').text().trim() || '';
        const description = $('meta[name="description"]').attr('content')?.trim() ||
            $('meta[property="og:description"]').attr('content')?.trim() ||
            '';

        // Extract main text content (naive approach)
        // Remove scripts, styles, etc.
        $('script, style, noscript, padding, iframe').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit length

        return NextResponse.json({
            title,
            description,
            content: textContent,
        });

    } catch (error: any) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: `Scraping failed: ${error.message}` }, { status: 500 });
    }
}
