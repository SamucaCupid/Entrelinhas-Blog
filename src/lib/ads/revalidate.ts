import "server-only";

import { revalidatePath } from "next/cache";

const AD_REVALIDATION_PATHS = [
  "/",
  "/busca",
  "/categoria/politica",
  "/categoria/policia",
  "/categoria/eventos",
  "/categoria/negocios",
  "/categoria/cultura",
];

export function revalidateAdPages() {
  for (const path of AD_REVALIDATION_PATHS) {
    revalidatePath(path);
  }
}

