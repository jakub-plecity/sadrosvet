import {SiteHeader} from "@/components/site-header";
import {SocialLinks} from "@/components/social-links";
import type {Metadata} from "next";
import {SiteBrand,SiteFooter} from "@/components/site-footer";
export const metadata:Metadata={title:"O nás · SádroSvět",description:"Jsme SádroSvět! Parta z Chrudimi, která se rozhodla dělat radost nejen sobě, ale i ostatním."};
const paragraphs = [
"Představujeme se Vám jako plně pracující čtveřice z Chrudimi, která se ráda schází, tvoří a jezdí mezi Vás. Dvě generace, čtyři názory. Technolog, mluvka, kreativec a vozíčkář Jířa, k tomu garáž plná sádry a vosku, která se proměnila v dílnu, co více si můžeme přát. Snad už jen radost každého, kdo odchází s něčím, co jsme vlastnoručně vyrobili a co dokáže vykouzlit úsměv na tváři. A tak se snažíme posouvat dál a dál, od dárkům rodině k prodeji známým, k trhům a nyní až k e-shopu.",
"Děkujeme všem, kteří si u nás dělají radost a náš malý koníček podporují. Moc si vážíme Vaší důvěry a toho, že si našimi výrobky zútulňujete svůj osobni prostor nebo jen posíláte naši radost dál.",
"Co je nutno dále říci - po dlouhé cestě výběru a zkoušení tvoříme naše výrobky z keramické sádry. Nejedná se o obyčejnou sádru, která je křehčí, šedivější a propouští vodu. Tento druh sádry je právě naopak těžší, pevnější a zářivě bílý,  a ačkoli není podle výrobce voděodolný, z vlastní zkušenosti víme, že trochu vody vydrží (naše testovací vázička je vystavená venkovním živlům už téměř rok a stále drží). Výrobky se dají lehce umýt pod slabým proudem vody a rovněž vydrží i lehký žár při zapálení svíčky.",
"Co je obrovskou výhodou tohoto materiálu a co nás moc baví? Dá se na ni malovat! S pomocí akrylových barev je každý kousek originál, který zabaví děti i dospělé všech věkových kategorií. Navíc, fantazii se meze nekladou! Kombinací různých výrobků, barev a dekorací lze vytvořit doplněk do každého domova.",
"K prodeji nabízíme jak samostatné výrobky, aby si každý dopřál, co potřebuje, tak již zkompletované sety, které se nejvíce líbí nám. Další doplňky bohužel nejsou součástí nákupu.",
"Neváhejte nás navštívit na našich výjezdech na trhy a další akce, kde je možné si vlastní varianty vyzkoušet a seskládat. Navíc při výrobě dekorací na trhy, kde je větší prostor pro rozmanitost, se můžeme trochu více rozvášnit a zkoušíme i barevné varianty, sety a další výrobky. Rádi Vás uvidíme!",
"Plánované akce, novinky, fotky, videa z výroby a tipy na seskládané komplety najdete na našich sociálních síti.",
"A teď už konec řečí, jde se tvořit!"
];
export default function About(){return <><SiteHeader/><main className="about-page"><section className="about-intro"><div><span className="eyebrow">O nás</span><h1>Jsme SádroSvět!</h1><p>Parta, která se rozhodla dělat radost nejen sobě, ale i ostatním.</p></div><figure className="about-photo-brand"><img className="about-hands-photo" src="/o-nas-srdce.jpeg" width="1200" height="1600" alt="Tři bílá sádrová srdce s jemným reliéfem v dlaních"/><img className="about-photo-logo" src="/logo-sadrosvet.png" width="1080" height="1080" alt="Logo SádroSvět"/></figure></section><section className="about-chapters" aria-label="Náš příběh">
<article className="about-chapter"><span className="eyebrow">NÁŠ PŘÍBĚH</span><h2>Dvě generace, čtyři názory.</h2><p>{paragraphs[0]}</p><p className="about-thanks">{paragraphs[1]}</p></article>
<article className="about-chapter"><span className="eyebrow">MATERIÁL A TVOŘENÍ</span><h2>Ze sádry, s fantazií.</h2><p>{paragraphs[2]}</p><div className="about-highlight"><h3>Dá se na ni malovat!</h3><p>{paragraphs[3]}</p></div></article>
<article className="about-chapter"><span className="eyebrow">NAŠE VÝROBKY</span><h2>Jeden kousek, nebo celý set.</h2><p>{paragraphs[4]}</p><a className="button blue" href="/#kolekce">Prohlédnout kolekci</a></article>
<article className="about-chapter"><span className="eyebrow">POTKEJME SE</span><h2>Rádi Vás uvidíme!</h2><p>{paragraphs[5]}</p><p>{paragraphs[6]}</p><p className="about-signoff">{paragraphs[7]}</p></article>
</section></main><SiteFooter/></>}
