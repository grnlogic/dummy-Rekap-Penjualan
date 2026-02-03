import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility untuk menghilangkan duplikasi data dropdown
export function removeDuplicatesByName<
  T extends { id: number; [key: string]: any }
>(array: T[], nameKey: string): T[] {
  const seen = new Map<string, T>();
  const seenIds = new Set<number>();

  array.forEach((item) => {
    const name = item[nameKey];
    const id = item.id;

    if (name && !seenIds.has(id)) {
      const normalizedName = name.toLowerCase().trim();

      // Prioritaskan item dengan ID terkecil jika nama sama
      if (!seen.has(normalizedName) || item.id < seen.get(normalizedName)!.id) {
        seen.set(normalizedName, item);
        seenIds.add(id);
      }
    }
  });

  return Array.from(seen.values()).sort((a, b) =>
    a[nameKey].localeCompare(b[nameKey], "id", {
      sensitivity: "base",
      numeric: true,
    })
  );
}

// Utility untuk sorting hari dalam urutan yang benar
export function sortHariData<T extends { namaHari: string }>(array: T[]): T[] {
  const hariOrder = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  return array.sort((a, b) => {
    const aIndex = hariOrder.indexOf(a.namaHari);
    const bIndex = hariOrder.indexOf(b.namaHari);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    return a.namaHari.localeCompare(b.namaHari, "id");
  });
}

// Utility untuk sorting minggu secara numerik
export function sortMingguData<T extends { namaMinggu: string }>(
  array: T[]
): T[] {
  return array.sort((a, b) => {
    const aNum = parseInt(a.namaMinggu.replace(/\D/g, ""));
    const bNum = parseInt(b.namaMinggu.replace(/\D/g, ""));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    return a.namaMinggu.localeCompare(b.namaMinggu, "id", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

// Cache untuk menyimpan data yang sudah di-filter
const dataCache = new Map<string, any>();

export function getCachedFilteredData<T>(
  key: string,
  data: T[],
  filterFn: (data: T[]) => T[]
): T[] {
  // Buat cache key yang lebih unik berdasarkan konten data
  const dataHash = data.map((item) => JSON.stringify(item)).join("|");
  const cacheKey = `${key}_${data.length}_${dataHash.substring(0, 100)}`;

  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  const filtered = filterFn(data);
  dataCache.set(cacheKey, filtered);

  // Clear cache after 3 minutes untuk data yang lebih fresh
  setTimeout(() => {
    dataCache.delete(cacheKey);
  }, 3 * 60 * 1000);

  return filtered;
}

// Fungsi tambahan untuk clear cache secara manual
export function clearDataCache(): void {
  dataCache.clear();
}
