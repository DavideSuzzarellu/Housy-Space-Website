import type { ImageMetadata } from "astro";
import ciutatVella from "@/assets/home/districts/ciutat-vella.webp";
import eixample from "@/assets/home/districts/eixample.webp";
import gracia from "@/assets/home/districts/gracia.webp";
import hortaGuinardo from "@/assets/home/districts/horta-guinardo.webp";
import lesCorts from "@/assets/home/districts/les-corts.webp";
import nouBarris from "@/assets/home/districts/nou-barris.webp";
import santAndreu from "@/assets/home/districts/sant-andreu.webp";
import santMarti from "@/assets/home/districts/sant-marti.webp";
import santsMontjuic from "@/assets/home/districts/sants-montjuic.webp";
import sarriaSantGervasi from "@/assets/home/districts/sarria-sant-gervasi.webp";

/** AI-generated placeholders until licensed photos arrive (ROADMAP I13). */
export const DISTRICT_IMAGES: Readonly<Record<string, ImageMetadata>> = {
  "ciutat-vella": ciutatVella,
  eixample,
  "sants-montjuic": santsMontjuic,
  "les-corts": lesCorts,
  "sarria-sant-gervasi": sarriaSantGervasi,
  gracia,
  "horta-guinardo": hortaGuinardo,
  "nou-barris": nouBarris,
  "sant-andreu": santAndreu,
  "sant-marti": santMarti,
};
