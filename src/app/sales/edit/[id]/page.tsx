import EditSalesPage from "@/app/components/Sales/edit/Page";

interface PageProps {
  params: Promise<{ id: string }>; // ✅ Ubah ke Promise
}

export default async function Page({ params }: PageProps) {
  // ✅ Await params untuk mendapatkan id
  const resolvedParams = await params;
  console.log("Route page params:", resolvedParams);

  return <EditSalesPage params={resolvedParams} />;
}

export async function generateMetadata({ params }: PageProps) {
  // ✅ Await params di generateMetadata juga
  const resolvedParams = await params;

  return {
    title: `Edit Penjualan #${resolvedParams.id} - PERUSAHAAN`,
    description: `Edit data penjualan dengan ID ${resolvedParams.id}`,
  };
}
