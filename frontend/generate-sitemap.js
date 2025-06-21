import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const links = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.1 },
];

const stream = new SitemapStream({ hostname: 'https://whenlymeet.com' });

streamToPromise(Readable.from(links).pipe(stream)).then((data) => {
  createWriteStream('./dist/sitemap.xml').end(data);
});