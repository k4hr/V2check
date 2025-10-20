import { readLocale } from '@/lib/i18n';
import { getProStrings } from '@/lib/i18n/pro';
// ...
const locale = readLocale();
const P = getProStrings(locale);
// <h1>{P.title}</h1>
// placeholder/aria/notFound — из P
